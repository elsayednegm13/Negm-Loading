import { __esmMin, __exportAll } from "./rolldown-runtime-DXoylpqc.js";
import { AnalysisCancelledError, AnalysisInputError, AnalysisOutputError, ConfigurationError, EvidenceIntegrityError, artifactIntegrityClaimSchema, artifactIntegrityPairOf, artifactMd5PairSchema, artifactSha256PairSchema, canBorrowParsedJsonSnapshot, err, fixedAllowanceRemediation, freezeJsonSnapshot, freezeOwnedJsonSnapshotSteps, freezeOwnedJsonTreeSnapshot, immutableJsonSnapshotMember, init_analysisErrorCore, init_artifactIntegrity, init_configurationErrors, init_evidenceErrors, init_fixedAllowanceRemediation, init_immutableJson, init_jsonValue, init_result, isImmutableJsonSnapshot, jsonObjectSchema, jsonValueSchema, jsonValueValidationIssue, jsonValueValidationSteps, ok } from "./jsonLines-Gf10X4s1.js";
import { z } from "zod";
import { createHash } from "node:crypto";
import { basename, isAbsolute, posix, relative, sep } from "node:path";
import canonicalize from "canonicalize";
import { domainToASCII, fileURLToPath, pathToFileURL } from "node:url";
import { PACKAGE_METADATA } from "../generatedPackageMetadata.js";
import * as t from "@babel/types";
import { parse, parseExpression } from "@babel/parser";

//#region dist/domain/digests.js
var SHA256_PATTERN, digestSchema, prefixedDigestSchema, isDigest;
function init_digests() {
	return (init_digests = __esmMin((() => {
		SHA256_PATTERN = /^[a-f0-9]{64}$/u;
		digestSchema = z.string().regex(SHA256_PATTERN);
		prefixedDigestSchema = (prefix) => z.string().regex(new RegExp(`^${prefix}_[a-f0-9]{64}$`, "u"), `Expected a ${prefix}_ prefixed lowercase sha256 digest`);
		isDigest = (value) => typeof value === "string" && SHA256_PATTERN.test(value);
	})))();
}

//#endregion
//#region dist/domain/localPath.js
var nulFreeStringSchema, localPathStringSchema, absoluteLocalPathStringSchema, isPathWithinRoot;
function init_localPath() {
	return (init_localPath = __esmMin((() => {
		nulFreeStringSchema = z.string().regex(/^[^\x00]*$/u, "Local filesystem paths cannot contain NUL");
		localPathStringSchema = nulFreeStringSchema.min(1);
		absoluteLocalPathStringSchema = localPathStringSchema.regex(process.platform === "win32" ? /^(?:[\\/]|[A-Za-z]:[\\/])/u : /^\//u, "must be an absolute local filesystem path");
		isPathWithinRoot = (root, path) => {
			const value = relative(root, path);
			return value === "" || value !== ".." && !value.startsWith(`..${sep}`) && !isAbsolute(value);
		};
	})))();
}

//#endregion
//#region dist/domain/inputIssueProjection.js
var analysisInputErrorFromIssues, analysisOperationInputErrorFromIssues, projectInputIssues, projectIssue, uniqueIssues, valueAtPath, numericBound, isSafeExpected, safeExpected, boundedIssue;
function init_inputIssueProjection() {
	return (init_inputIssueProjection = __esmMin((() => {
		init_analysisErrorCore();
		analysisInputErrorFromIssues = (operation, issues, input, options = {}) => new AnalysisInputError(operation, {
			...options.cause === undefined ? {} : { cause: options.cause },
			...options.userMessage === undefined ? {} : { userMessage: options.userMessage }
		}, [...projectInputIssues(issues, input), ...options.additionalIssues ?? []]);
		analysisOperationInputErrorFromIssues = (operation, issues, input, cause) => new AnalysisInputError(operation, { cause }, projectInputIssues(issues, {
			operation,
			input
		}).map((issue) => issue.path[0] === "input" ? {
			...issue,
			path: issue.path.slice(1)
		} : issue));
		projectInputIssues = (issues, input) => issues.flatMap((issue) => projectIssue(issue, input));
		projectIssue = (issue, input) => {
			const path = issue.path.flatMap((part) => typeof part === "string" || typeof part === "number" ? [part] : []);
			if (issue.code === "invalid_union") {
				if (issue.errors.length === 0) {
					const expected = "options" in issue ? issue.options?.filter(isSafeExpected) : undefined;
					return [{
						path,
						reason: valueAtPath(input, path) === undefined ? "missing_argument" : "invalid_value",
						...expected === undefined ? {} : { expected }
					}];
				}
				return uniqueIssues(issue.errors.flatMap((branch) => branch.flatMap((branchIssue) => projectIssue({
					...branchIssue,
					path: [...issue.path, ...branchIssue.path]
				}, input))));
			}
			if (issue.code === "invalid_key") return issue.issues.flatMap((keyIssue) => projectIssue({
				...keyIssue,
				path: [...issue.path, ...keyIssue.path]
			}, input));
			if (issue.code === "unrecognized_keys") return issue.keys.map((key) => ({
				path: [...path, key],
				reason: "unknown_argument"
			}));
			if (issue.code === "invalid_type") return [{
				path,
				reason: valueAtPath(input, path) === undefined ? "missing_argument" : "invalid_type",
				expected: safeExpected(issue.expected)
			}];
			if (issue.code === "too_small") return [boundedIssue(path, "minimum", numericBound(issue.minimum))];
			if (issue.code === "too_big") return [boundedIssue(path, "maximum", numericBound(issue.maximum))];
			if (issue.code === "invalid_format") return [{
				path,
				reason: "invalid_format",
				expected: issue.format,
				...issue.format === "regex" && issue.message.length > 0 ? { message: issue.message } : {}
			}];
			if (issue.code === "invalid_value") return [{
				path,
				reason: "invalid_value",
				expected: issue.values.filter(isSafeExpected)
			}];
			return [{
				path,
				reason: "invalid_value",
				...issue.message.length > 0 ? { message: issue.message } : {}
			}];
		};
		uniqueIssues = (issues) => [...new Map(issues.map((issue) => [JSON.stringify(issue), issue])).values()];
		valueAtPath = (input, path) => {
			let current = input;
			for (const part of path) {
				if (typeof current !== "object" || current === null) return undefined;
				const next = Reflect.get(current, part);
				current = next;
			}
			return current;
		};
		numericBound = (value) => typeof value === "number" && Number.isFinite(value) ? value : undefined;
		isSafeExpected = (value) => value === null || [
			"string",
			"number",
			"boolean"
		].includes(typeof value);
		safeExpected = (value) => isSafeExpected(value) ? value : "schema-defined value";
		boundedIssue = (path, key, value) => ({
			path,
			reason: "out_of_range",
			...value === undefined ? {} : { [key]: value }
		});
	})))();
}

//#endregion
//#region dist/domain/safeJson.js
var safeParseJson;
function init_safeJson() {
	return (init_safeJson = __esmMin((() => {
		safeParseJson = (value, reviver) => {
			try {
				return {
					ok: true,
					value: JSON.parse(value, reviver)
				};
			} catch (cause) {
				return {
					ok: false,
					error: cause instanceof Error ? cause.message : String(cause),
					cause
				};
			}
		};
	})))();
}

//#endregion
//#region dist/domain/canonicalDigest.js
var digestCanonicalValue, emitCanonical;
function init_canonicalDigest() {
	return (init_canonicalDigest = __esmMin((() => {
		digestCanonicalValue = (value, context = "Comparison") => {
			const hash = createHash("sha256");
			let buffered = "";
			const flush = () => {
				if (buffered.length === 0) return;
				hash.update(buffered);
				buffered = "";
			};
			const emit = (part) => {
				if (part.length >= 8192) {
					flush();
					hash.update(part);
					return;
				}
				buffered += part;
				if (buffered.length >= 8192) flush();
			};
			const encoded = emitCanonical(value, emit, new Set());
			if (!encoded) throw new TypeError(`${context} could not canonicalize data`);
			flush();
			return hash.digest("hex");
		};
		emitCanonical = (value, emit, ancestors) => {
			if (typeof value === "number" && !Number.isFinite(value)) throw new Error(Number.isNaN(value) ? "NaN is not allowed" : "Infinity is not allowed");
			if (value === null || typeof value !== "object") {
				const encoded = JSON.stringify(value);
				if (encoded === undefined) return false;
				emit(encoded);
				return true;
			}
			if (ancestors.has(value)) throw new Error("Circular reference detected");
			ancestors.add(value);
			try {
				if ("toJSON" in value && typeof value.toJSON === "function") {
					const normalized = value.toJSON();
					return emitCanonical(normalized, emit, ancestors);
				}
				if (Array.isArray(value)) {
					emit("[");
					const length = value.length;
					for (let index = 0; index < length; index += 1) {
						if (index > 0) emit(",");
						if (!(index in value)) continue;
						const item = value[index];
						emitCanonical(item === undefined || typeof item === "symbol" ? null : item, emit, ancestors);
					}
					emit("]");
				} else {
					emit("{");
					let first = true;
					for (const key of Object.keys(value).sort()) {
						if (Reflect.get(value, key) === undefined || typeof Reflect.get(value, key) === "symbol") continue;
						const item = Reflect.get(value, key);
						if (!first) emit(",");
						first = false;
						emit(JSON.stringify(key));
						emit(":");
						if (!emitCanonical(item, emit, ancestors)) emit("undefined");
					}
					emit("}");
				}
				return true;
			} finally {
				ancestors.delete(value);
			}
		};
	})))();
}

//#endregion
//#region dist/domain/canonicalJsonDigestSteps.js
/** Hash owned, validated JSON in bounded steps without a document-sized string. */
function* canonicalJsonDigestSteps(value) {
	const hash = createHash("sha256");
	const ancestors = new Set();
	const stack = [{
		kind: "value",
		value
	}];
	const encodedKeys = new Map();
	let remainingKeyCodeUnits = 8192;
	let buffered = "";
	let flushed = false;
	const emit = (part) => {
		buffered += part;
		if (buffered.length >= 8192) {
			hash.update(buffered);
			buffered = "";
			flushed = true;
		}
	};
	try {
		while (stack.length > 0) {
			if (flushed) {
				flushed = false;
				yield;
			}
			const frame = stack.pop();
			if (frame === undefined) break;
			if (frame.kind === "separator") {
				emit(":");
				continue;
			}
			if (frame.kind === "string") {
				if (frame.index === frame.value.length) {
					emit("\"");
					continue;
				}
				let end = Math.min(frame.index + 8192, frame.value.length);
				const last = frame.value.charCodeAt(end - 1);
				const next = frame.value.charCodeAt(end);
				if (end < frame.value.length && last >= 55296 && last <= 56319 && next >= 56320 && next <= 57343) end -= 1;
				emit(JSON.stringify(frame.value.slice(frame.index, end)).slice(1, -1));
				frame.index = end;
				stack.push(frame);
				continue;
			}
			let item;
			if (frame.kind === "array") {
				if (frame.index === frame.length) {
					emit("]");
					ancestors.delete(frame.value);
					continue;
				}
				const element = frame.value[frame.index];
				if (element === undefined) throw new TypeError("Canonical JSON digest requires dense JSON arrays");
				if (frame.index++ > 0) emit(",");
				stack.push(frame);
				item = element;
			} else if (frame.kind === "object") {
				if (frame.index === frame.keys.length) {
					emit("}");
					ancestors.delete(frame.value);
					continue;
				}
				const key = frame.keys[frame.index++];
				if (key === undefined) throw new TypeError("Canonical JSON object changed during hashing");
				const property = frame.value[key];
				if (property === undefined) {
					stack.push(frame);
					continue;
				}
				if (frame.written++ > 0) emit(",");
				if (key.length > 8192) {
					emit("\"");
					stack.push(frame, {
						kind: "value",
						value: property
					}, { kind: "separator" }, {
						kind: "string",
						value: key,
						index: 0
					});
					continue;
				}
				let encodedKey = encodedKeys.get(key);
				if (encodedKey === undefined) {
					encodedKey = JSON.stringify(key);
					if (encodedKey.length <= remainingKeyCodeUnits) {
						encodedKeys.set(key, encodedKey);
						remainingKeyCodeUnits -= encodedKey.length;
					}
				}
				emit(encodedKey);
				emit(":");
				stack.push(frame);
				item = property;
			} else {
				item = frame.value;
			}
			if (flushed) {
				flushed = false;
				yield;
			}
			if (typeof item === "string" && item.length > 8192) {
				emit("\"");
				stack.push({
					kind: "string",
					value: item,
					index: 0
				});
			} else if (item === null || typeof item !== "object") {
				if (typeof item === "number" && !Number.isFinite(item)) throw new Error(Number.isNaN(item) ? "NaN is not allowed" : "Infinity is not allowed");
				emit(JSON.stringify(item));
			} else {
				if (ancestors.has(item)) throw new Error("Circular reference detected");
				ancestors.add(item);
				if (Array.isArray(item)) {
					emit("[");
					stack.push({
						kind: "array",
						value: item,
						length: item.length,
						index: 0
					});
				} else {
					emit("{");
					stack.push({
						kind: "object",
						value: item,
						keys: Object.keys(item).sort(),
						index: 0,
						written: 0
					});
				}
			}
		}
		if (buffered !== "") hash.update(buffered);
		return hash.digest("hex");
	} finally {
		stack.length = 0;
		ancestors.clear();
		encodedKeys.clear();
		buffered = "";
	}
}
function init_canonicalJsonDigestSteps() {
	return (init_canonicalJsonDigestSteps = __esmMin((() => {})))();
}

//#endregion
//#region dist/domain/analysisProfile.js
var committedProviderSchema, unsignedAnalysisProfileSchema, analysisProfileSchema, createAnalysisProfile, analysisProfilesEqual, profileDigest;
function init_analysisProfile() {
	return (init_analysisProfile = __esmMin((() => {
		init_canonicalDigest();
		init_jsonValue();
		init_digests();
		committedProviderSchema = z.strictObject({
			id: z.string().min(1),
			name: z.string().min(1),
			version: z.string().min(1)
		});
		unsignedAnalysisProfileSchema = z.strictObject({
			provider: committedProviderSchema,
			parameters: jsonObjectSchema
		});
		analysisProfileSchema = unsignedAnalysisProfileSchema.extend({ digest: digestSchema }).superRefine((profile, context) => {
			const { digest: _digest, ...unsigned } = profile;
			if (profileDigest(unsigned) !== profile.digest) context.addIssue({
				code: "custom",
				path: ["digest"],
				message: "Analysis profile digest does not match its parameters"
			});
		});
		createAnalysisProfile = (provider, parameters) => {
			const unsigned = unsignedAnalysisProfileSchema.parse({
				provider: {
					id: provider.id,
					name: provider.name,
					version: provider.version
				},
				parameters
			});
			return analysisProfileSchema.parse({
				...unsigned,
				digest: profileDigest(unsigned)
			});
		};
		analysisProfilesEqual = (left, right) => left.digest === right.digest && left.provider.id === right.provider.id && left.provider.name === right.provider.name && left.provider.version === right.provider.version;
		profileDigest = (profile) => digestCanonicalValue(profile, "Analysis profile");
	})))();
}

//#endregion
//#region dist/domain/binaryTargetTypes.js
var BINARY_ARCHITECTURES, RAW_ONLY_ARCHITECTURES, ELF_METADATA_ARCHITECTURES, isElfMetadataArchitecture, isMachOFormat;
function init_binaryTargetTypes() {
	return (init_binaryTargetTypes = __esmMin((() => {
		BINARY_ARCHITECTURES = [
			"x86",
			"x86_64",
			"arm",
			"arm64",
			"arm64_32",
			"mips",
			"6502",
			"riscv",
			"powerpc",
			"m68k",
			"hexagon"
		];
		RAW_ONLY_ARCHITECTURES = ["6502", "m68k"];
		ELF_METADATA_ARCHITECTURES = [
			"mips",
			"riscv",
			"powerpc"
		];
		isElfMetadataArchitecture = (architecture) => ELF_METADATA_ARCHITECTURES.includes(architecture);
		isMachOFormat = (format) => format === "mach-o" || format === "mach-o-universal";
	})))();
}

//#endregion
//#region dist/domain/fixedTupleSchema.js
var fixedTupleSchema;
function init_fixedTupleSchema() {
	return (init_fixedTupleSchema = __esmMin((() => {
		fixedTupleSchema = (items) => z.tuple(items, z.union(items)).check(z.minLength(items.length), z.maxLength(items.length));
	})))();
}

//#endregion
//#region dist/domain/relationshipCoverage.js
var diagnostics, completeCoverage$1, limitedDirections, partialCoverage, unknownCoverage, relationshipCoverageSchema, relationshipCoverageLimitations;
function init_relationshipCoverage() {
	return (init_relationshipCoverage = __esmMin((() => {
		init_fixedTupleSchema();
		diagnostics = z.array(z.string().min(1)).min(1).exactOptional();
		completeCoverage$1 = z.strictObject({
			status: z.literal("complete"),
			diagnostics
		});
		limitedDirections = z.union([
			fixedTupleSchema([z.literal("callers")]),
			fixedTupleSchema([z.literal("callees")]),
			fixedTupleSchema([z.literal("callers"), z.literal("callees")])
		]);
		partialCoverage = z.strictObject({
			status: z.literal("partial"),
			limitations: z.array(z.string().min(1)).min(1),
			limited_directions: limitedDirections.exactOptional(),
			diagnostics
		});
		unknownCoverage = z.strictObject({
			status: z.literal("unknown"),
			reason: z.string().min(1),
			limited_directions: limitedDirections.exactOptional(),
			diagnostics
		});
		relationshipCoverageSchema = z.discriminatedUnion("status", [
			completeCoverage$1,
			partialCoverage,
			unknownCoverage
		]);
		relationshipCoverageLimitations = (coverage) => {
			switch (coverage?.status) {
				case undefined: return ["Provider did not report relationship coverage."];
				case "complete": return [];
				case "partial": return coverage.limitations;
				case "unknown": return [coverage.reason];
			}
		};
	})))();
}

//#endregion
//#region dist/domain/evidence.js
var evidence_exports = /* @__PURE__ */ __exportAll({ parseEvidence: () => parseEvidence });
/** Create Evidence from owned immutable JSON while exposing cooperative computation steps. */
function* createImmutableEvidenceSteps(target, provider, observation) {
	if (!isImmutableJsonSnapshot(observation.result)) throw new TypeError("Cooperative Evidence requires an authenticated immutable result");
	yield* jsonValueValidationSteps(observation.result);
	const { normalized } = normalizeEvidenceObservation(target, provider, observation);
	const digest = yield* canonicalJsonDigestSteps(evidenceSemanticContent(normalized));
	return rememberImmutableEvidence({
		...normalized,
		evidence_id: `ev_${digest}`
	});
}
var providerSchema, subjectFormatSchema, subjectBaseSchema, subjectSchema, evidenceLocationSchema, evidenceAuthoritySchema, executionEnvironmentSchema, evidenceBaseSchema, validateAnalysisProfileProvider, evidenceSchema, authenticatedEvidenceSchema, immutableEvidenceSnapshots, immutableResultSchema, rebindEvidenceSubjectTargetPath, evidenceSemanticContent, computeEvidenceId, usesPre66NullCoverageIdentity, parseEvidence, immutableEvidence, rebindEvidenceToTargetPath, withEvidenceCallerInputPath, rememberReboundEvidence, isImmutableEvidence, rememberImmutableEvidence, createEvidence, normalizeEvidenceObservation;
function init_evidence() {
	return (init_evidence = __esmMin((() => {
		init_canonicalDigest();
		init_canonicalJsonDigestSteps();
		init_localPath();
		init_analysisProfile();
		init_binaryTargetTypes();
		init_jsonValue();
		init_immutableJson();
		init_digests();
		init_relationshipCoverage();
		providerSchema = z.strictObject({
			id: z.string().min(1),
			name: z.string().min(1),
			version: z.string().nullable()
		});
		subjectFormatSchema = z.enum([
			"hopper",
			"analysis-database",
			"mach-o",
			"elf",
			"pe",
			"dos-mz",
			"dos-com",
			"raw-binary",
			"gamecube-dol",
			"zip",
			"ipa",
			"apk",
			"msix",
			"appx",
			"hap",
			"hsp",
			"app-pack",
			"asar",
			"godot-pck",
			"dmg",
			"pkg",
			"plist",
			"javascript",
			"source-map",
			"directory",
			"file",
			"unknown",
			"mach-o-universal",
			"javascript-bundle",
			"entitlements",
			"pyinstaller",
			"node-sea"
		]);
		subjectBaseSchema = z.strictObject({
			name: z.string().min(1),
			digest: z.strictObject({ sha256: digestSchema }),
			local_path: nulFreeStringSchema
		});
		subjectSchema = z.discriminatedUnion("format", [
			subjectBaseSchema.extend({
				format: subjectFormatSchema.exclude(["raw-binary", "gamecube-dol"]),
				architecture: z.enum(BINARY_ARCHITECTURES).exclude([...RAW_ONLY_ARCHITECTURES]).nullable()
			}),
			subjectBaseSchema.extend({
				format: z.literal("raw-binary"),
				architecture: z.enum(BINARY_ARCHITECTURES).nullable()
			}),
			subjectBaseSchema.extend({
				format: z.literal("gamecube-dol"),
				architecture: z.literal("powerpc")
			})
		]);
		evidenceLocationSchema = z.discriminatedUnion("kind", [
			z.strictObject({
				kind: z.literal("address"),
				address: z.string().min(1)
			}),
			z.strictObject({
				kind: z.literal("address-range"),
				start: z.string().min(1),
				end: z.string().min(1)
			}),
			z.strictObject({
				kind: z.literal("artifact-path"),
				path: z.string().min(1)
			}),
			z.strictObject({
				kind: z.literal("file-offset"),
				offset: z.int().min(0)
			}),
			z.strictObject({
				kind: z.literal("file-offset-range"),
				start: z.int().min(0),
				end: z.int().min(0)
			})
		]);
		evidenceAuthoritySchema = z.enum([
			"shipped-artifact",
			"controlled-replay",
			"historical-reference",
			"external-service",
			"analyst-inference"
		]);
		executionEnvironmentSchema = z.strictObject({
			id: z.string().min(1),
			platform: z.string().min(1),
			architecture: z.string().min(1),
			isolation: z.enum([
				"none",
				"process",
				"container",
				"virtual-machine"
			])
		});
		evidenceBaseSchema = z.object({
			evidence_id: prefixedDigestSchema("ev"),
			subject: subjectSchema.nullable(),
			provider: providerSchema,
			analysis_profile: analysisProfileSchema.nullable(),
			predicate_type: z.string().min(1),
			operation: z.string().min(1),
			parameters: jsonObjectSchema,
			/** Verbatim selected path for a direct request; absent on older records. */
			caller_input_path: nulFreeStringSchema.exactOptional().describe("Verbatim direct-request path; not part of semantic identity."),
			raw_result: jsonValueSchema.nullable(),
			normalized_result: jsonValueSchema,
			confidence: z.enum([
				"observed",
				"derived",
				"inferred"
			]),
			authority: evidenceAuthoritySchema,
			environment: executionEnvironmentSchema.nullable(),
			limitations: z.array(z.string()),
			relationship_coverage: relationshipCoverageSchema.nullable(),
			locations: z.array(evidenceLocationSchema),
			evidence_links: z.array(prefixedDigestSchema("ev"))
		}).strict();
		validateAnalysisProfileProvider = (evidence, context) => {
			const profile = evidence.analysis_profile;
			if (profile !== null && (profile.provider.id !== evidence.provider.id || profile.provider.name !== evidence.provider.name || profile.provider.version !== evidence.provider.version)) context.addIssue({
				code: "custom",
				path: ["analysis_profile", "provider"],
				message: "Analysis profile provider does not match Evidence provider"
			});
		};
		evidenceSchema = evidenceBaseSchema.superRefine(validateAnalysisProfileProvider);
		authenticatedEvidenceSchema = evidenceSchema.superRefine((evidence, context) => {
			const { evidence_id: evidenceId, ...withoutId } = evidence;
			if (computeEvidenceId(withoutId) !== evidenceId) context.addIssue({
				code: "custom",
				path: ["evidence_id"],
				message: usesPre66NullCoverageIdentity(withoutId, evidenceId) ? "Evidence uses an earlier relationship_coverage identity commitment: explicit null was omitted from that digest. Recreate this observation with the current REA release; re-exporting the old bundle cannot update its identity." : "Evidence semantic identifier does not match its record"
			});
		});
		immutableEvidenceSnapshots = new WeakMap();
		immutableResultSchema = z.custom(isImmutableJsonSnapshot).superRefine((value, context) => {
			const issue = jsonValueValidationIssue(value);
			if (issue !== undefined) context.addIssue({
				code: "custom",
				message: issue
			});
		});
		rebindEvidenceSubjectTargetPath = (subject, target) => subject.sha256 === target.sha256 && subject.format === target.format && (subject.architecture ?? null) === (target.architecture ?? null) ? {
			...subject,
			path: target.path
		} : subject;
		evidenceSemanticContent = (evidence) => ({
			subject: evidence.subject === null ? null : {
				digest: evidence.subject.digest,
				format: evidence.subject.format,
				architecture: evidence.subject.architecture
			},
			provider: evidence.provider,
			analysis_profile: evidence.analysis_profile,
			predicate_type: evidence.predicate_type,
			operation: evidence.operation,
			parameters: evidence.parameters,
			raw_result: evidence.raw_result,
			normalized_result: evidence.normalized_result,
			confidence: evidence.confidence,
			authority: evidence.authority,
			environment: evidence.environment,
			limitations: evidence.limitations,
			relationship_coverage: evidence.relationship_coverage,
			locations: evidence.locations,
			evidence_links: evidence.evidence_links
		});
		computeEvidenceId = (evidence) => `ev_${digestCanonicalValue(evidenceSemanticContent(evidence), "Evidence")}`;
		usesPre66NullCoverageIdentity = (evidence, evidenceId) => {
			if (evidence.relationship_coverage !== null) return false;
			const legacyProjection = evidenceSemanticContent(evidence);
			delete legacyProjection.relationship_coverage;
			return evidenceId === `ev_${digestCanonicalValue(legacyProjection, "Historical Evidence identity")}`;
		};
		parseEvidence = (input) => {
			const immutable = typeof input === "object" && input !== null ? immutableEvidenceSnapshots.get(input) : undefined;
			if (immutable !== undefined) return immutable;
			return authenticatedEvidenceSchema.parse(input);
		};
		immutableEvidence = (input) => {
			const parsed = parseEvidence(input);
			return rememberImmutableEvidence(canBorrowParsedJsonSnapshot(input, parsed) ? input : parsed);
		};
		rebindEvidenceToTargetPath = (evidence, target) => {
			const subject = evidence.subject;
			if (subject === null) return evidence;
			const rebound = rebindEvidenceSubjectTargetPath({
				path: subject.local_path,
				sha256: subject.digest.sha256,
				format: subject.format,
				...subject.architecture === null ? {} : { architecture: subject.architecture }
			}, target);
			if (rebound.path === subject.local_path) return evidence;
			const reboundSubject = subjectSchema.parse({
				...subject,
				name: basename(target.path) || "artifact",
				local_path: target.path
			});
			const reboundEvidence = {
				...evidence,
				subject: reboundSubject
			};
			if (!isImmutableEvidence(evidence)) return immutableEvidence(reboundEvidence);
			return rememberReboundEvidence(evidence, reboundEvidence);
		};
		withEvidenceCallerInputPath = (evidence, rawPath) => {
			const callerInputPath = nulFreeStringSchema.parse(rawPath);
			const owned = immutableEvidence(evidence);
			if (owned.caller_input_path === callerInputPath) return owned;
			const rebound = {
				...owned,
				caller_input_path: callerInputPath
			};
			return rememberReboundEvidence(owned, rebound);
		};
		rememberReboundEvidence = (source, rebound) => {
			for (const key of Object.keys(source)) immutableJsonSnapshotMember(source, key);
			return rememberImmutableEvidence(rebound);
		};
		isImmutableEvidence = (evidence) => immutableEvidenceSnapshots.has(evidence);
		rememberImmutableEvidence = (evidence) => {
			freezeJsonSnapshot(evidence);
			immutableEvidenceSnapshots.set(evidence, evidence);
			return evidence;
		};
		createEvidence = (target, provider, observation, options) => {
			const { normalized, sharedResult } = normalizeEvidenceObservation(target, provider, observation);
			const evidence = {
				...normalized,
				evidence_id: computeEvidenceId(normalized)
			};
			if (sharedResult || options?.immutable === true) {
				freezeOwnedJsonTreeSnapshot(evidence);
				immutableEvidenceSnapshots.set(evidence, evidence);
			}
			return evidence;
		};
		normalizeEvidenceObservation = (target, provider, observation) => {
			const subject = target === undefined ? null : {
				name: basename(target.path) || "artifact",
				digest: { sha256: target.sha256 },
				format: target.format,
				architecture: target.architecture ?? null,
				local_path: target.path
			};
			const semantic = {
				subject: subject === null ? null : {
					digest: subject.digest,
					format: subject.format,
					architecture: subject.architecture
				},
				provider: {
					id: provider.id,
					name: provider.name,
					version: provider.version
				},
				analysis_profile: observation.analysisProfile ?? null,
				predicate_type: observation.predicateType ?? "rea.analysis",
				operation: observation.operation,
				parameters: observation.parameters,
				raw_result: observation.rawResult ?? null,
				normalized_result: observation.result,
				confidence: observation.confidence ?? "observed",
				authority: observation.authority ?? "shipped-artifact",
				environment: observation.environment ?? null,
				limitations: [...target === undefined ? [observation.subjectUnavailableReason ?? "Artifact identity is unavailable for this observation."] : [], ...observation.limitations ?? []],
				...observation.relationshipCoverage === undefined ? { relationship_coverage: null } : { relationship_coverage: observation.relationshipCoverage },
				locations: [...observation.locations ?? []],
				evidence_links: [...observation.evidenceLinks ?? []]
			};
			const sharedResult = typeof observation.result === "object" && observation.result !== null && isImmutableJsonSnapshot(observation.result);
			const selectedSchema = sharedResult ? evidenceSchema.safeExtend({ normalized_result: immutableResultSchema }) : evidenceSchema;
			const normalized = selectedSchema.parse({
				...semantic,
				evidence_id: `ev_${"0".repeat(64)}`,
				subject
			});
			return {
				normalized,
				sharedResult
			};
		};
	})))();
}

//#endregion
//#region dist/domain/validationFailure.js
var describeValidationFailure;
function init_validationFailure() {
	return (init_validationFailure = __esmMin((() => {
		describeValidationFailure = (cause) => {
			if (!(cause instanceof z.ZodError)) return cause instanceof Error ? cause.message : String(cause);
			const [first, ...rest] = cause.issues;
			const location = first === undefined || first.path.length === 0 ? "the document root" : first.path.map(String).join(".");
			return `at ${location}: ${first?.message ?? "invalid value"}${rest.length === 0 ? "" : ` (${String(rest.length)} more issues)`}`;
		};
	})))();
}

//#endregion
//#region dist/domain/unicodeCodePointOrder.js
var compareUnicodeCodePoints, compositeKey;
function init_unicodeCodePointOrder() {
	return (init_unicodeCodePointOrder = __esmMin((() => {
		compareUnicodeCodePoints = (left, right) => {
			let leftIndex = 0;
			let rightIndex = 0;
			while (leftIndex < left.length && rightIndex < right.length) {
				const leftPoint = left.codePointAt(leftIndex) ?? 0;
				const rightPoint = right.codePointAt(rightIndex) ?? 0;
				const difference = leftPoint - rightPoint;
				if (difference !== 0) return difference;
				leftIndex += leftPoint > 65535 ? 2 : 1;
				rightIndex += rightPoint > 65535 ? 2 : 1;
			}
			if (leftIndex === left.length && rightIndex === right.length) return 0;
			return leftIndex === left.length ? -1 : 1;
		};
		compositeKey = (parts) => JSON.stringify(parts);
	})))();
}

//#endregion
//#region dist/domain/canonicalOrdering.js
var uniqueSorted, uniqueSortedBy, compareAsciiStrings, isSortedUniqueAscii;
function init_canonicalOrdering() {
	return (init_canonicalOrdering = __esmMin((() => {
		init_unicodeCodePointOrder();
		uniqueSorted = (values) => [...new Set(values)].sort(compareUnicodeCodePoints);
		uniqueSortedBy = (values, key) => {
			const byKey = new Map();
			for (const value of values) byKey.set(key(value), value);
			return [...byKey].sort(([left], [right]) => compareUnicodeCodePoints(left, right)).map(([, value]) => value);
		};
		compareAsciiStrings = (left, right) => left < right ? -1 : left > right ? 1 : 0;
		isSortedUniqueAscii = (values) => values.every((value, index) => index === 0 || compareAsciiStrings(values[index - 1] ?? "", value) < 0);
	})))();
}

//#endregion
//#region dist/domain/comparisonSemantics.js
var absenceClaimable, canonicalJson;
function init_comparisonSemantics() {
	return (init_comparisonSemantics = __esmMin((() => {
		absenceClaimable = (coverage) => coverage.status === "complete" && coverage.truncated !== true && (coverage.omitted_count === undefined || coverage.omitted_count === 0);
		canonicalJson = (value, context = "Comparison") => {
			const encoded = canonicalize(value);
			if (encoded === undefined) throw new TypeError(`${context} could not canonicalize data`);
			return encoded;
		};
	})))();
}

//#endregion
//#region dist/domain/evidenceReference.js
var retainedEvidenceReferenceSchema, evidenceInputSchema;
function init_evidenceReference() {
	return (init_evidenceReference = __esmMin((() => {
		init_digests();
		init_evidence();
		retainedEvidenceReferenceSchema = z.strictObject({
			kind: z.literal("retained-evidence"),
			evidence_id: prefixedDigestSchema("ev")
		});
		evidenceInputSchema = z.union([evidenceSchema, retainedEvidenceReferenceSchema]);
	})))();
}

//#endregion
//#region dist/domain/process/processScenario.js
var positiveBudget, processScenarioOutputBudgetProjectionSchema, PROCESS_TERMINAL_CELL_BUDGET, timedEventBase, reservedRunIdEnvironmentName, ENVIRONMENT_NAME_CHARACTER, environmentNamePattern, environmentName, unsupportedPtyEnvironmentName, ptyEnvironmentName, childProcessString, environmentRecordSchema, processEnvironmentSchema, fitsProcessTerminalCellBudget, normalizationSchema, digestProcessCommitment, committedScenarioEvents, processScenarioCommitment, processComparisonContract, processScenarioSchema, eventsOutOfOrder;
function init_processScenario() {
	return (init_processScenario = __esmMin((() => {
		positiveBudget = z.int().safe().positive();
		processScenarioOutputBudgetProjectionSchema = z.object({ output_bytes: positiveBudget }).passthrough();
		PROCESS_TERMINAL_CELL_BUDGET = 1e6;
		timedEventBase = { at_ms: z.int().safe().nonnegative() };
		reservedRunIdEnvironmentName = "REA_PROCESS_RUN_ID";
		ENVIRONMENT_NAME_CHARACTER = "[^=\\x00]";
		environmentNamePattern = (reserved) => {
			let rest = `${ENVIRONMENT_NAME_CHARACTER}+`;
			for (let index = reserved.length - 1; index >= 0; index -= 1) {
				const character = reserved[index] ?? "";
				const choice = `[^=\\x00${character}]${ENVIRONMENT_NAME_CHARACTER}*|${character}${rest}`;
				rest = index === 0 ? choice : `(?:${choice})?`;
			}
			return new RegExp(`^(?:${rest})$`, "u");
		};
		environmentName = z.string().min(1, "Environment names must not be empty").regex(environmentNamePattern(reservedRunIdEnvironmentName), { error: (issue) => issue.input === reservedRunIdEnvironmentName ? `${reservedRunIdEnvironmentName} is reserved by the process adapter` : "Environment names cannot contain '=' or NUL" });
		unsupportedPtyEnvironmentName = "__proto__";
		ptyEnvironmentName = environmentName.regex(environmentNamePattern(unsupportedPtyEnvironmentName), { error: "The installed PTY backend cannot preserve the __proto__ environment name; pass it through /usr/bin/env instead." });
		childProcessString = z.string().regex(/^[^\x00]*$/u, "Values passed to operating-system APIs cannot contain NUL");
		environmentRecordSchema = z.record(ptyEnvironmentName, childProcessString);
		processEnvironmentSchema = z.unknown().superRefine((value, context) => {
			if (value !== null && typeof value === "object" && Object.hasOwn(value, unsupportedPtyEnvironmentName)) context.addIssue({
				code: "custom",
				path: [unsupportedPtyEnvironmentName],
				message: "The installed PTY backend cannot preserve the __proto__ environment name; pass it through /usr/bin/env instead."
			});
		}).pipe(environmentRecordSchema);
		processEnvironmentSchema._zod.toJSONSchema = () => z.toJSONSchema(environmentRecordSchema, { io: "input" });
		fitsProcessTerminalCellBudget = (columns, rows, scrollback) => rows + scrollback <= Math.floor(PROCESS_TERMINAL_CELL_BUDGET / columns);
		normalizationSchema = z.object({
			paths: z.boolean(),
			pids: z.boolean(),
			ports: z.boolean(),
			time_bucket_ms: positiveBudget,
			patterns: z.array(z.object({
				pattern: z.string(),
				replacement: z.string()
			}))
		});
		digestProcessCommitment = (value) => {
			const serialized = canonicalize(value);
			if (serialized === undefined) throw new TypeError("Process capture commitment is not canonical JSON");
			return createHash("sha256").update(serialized).digest("hex");
		};
		committedScenarioEvents = (events, includeSensitiveInputLength) => events.map((event) => event.type === "input" && event.sensitive ? {
			...event,
			data: includeSensitiveInputLength ? `<redacted-input:${String(Buffer.byteLength(event.data))}-bytes>` : "<redacted-input>"
		} : event);
		processScenarioCommitment = (scenario, executableSha256) => {
			const { finalization_ms: finalizationMs, ...committed } = scenario;
			return {
				...committed,
				...finalizationMs > 0 ? { finalization_ms: finalizationMs } : {},
				events: committedScenarioEvents(scenario.events, true),
				executable_sha256: executableSha256 ?? null
			};
		};
		processComparisonContract = (scenario) => ({
			working_directory: scenario.working_directory,
			environment: scenario.environment,
			ambient_environment: "unknown",
			filesystem_observation_paths: scenario.filesystem_observation_paths,
			terminal: scenario.terminal,
			events: committedScenarioEvents(scenario.events, false),
			timeout_ms: scenario.timeout_ms,
			idle_timeout_ms: scenario.idle_timeout_ms,
			settle_ms: scenario.settle_ms,
			...scenario.finalization_ms > 0 ? { finalization_ms: scenario.finalization_ms } : {},
			limits: scenario.limits,
			normalization: scenario.normalization,
			terminal_observation_version: "deferred-rendered-journal-v1",
			...scenario.normalization.pids ? { pid_normalization_version: "sampled-identifiers-v2" } : {},
			...scenario.normalization.paths ? { path_normalization_version: "path-component-boundaries-v2" } : {},
			...scenario.normalization.ports ? { port_normalization_version: "contextual-endpoints-v3" } : {},
			...scenario.normalization.patterns.length > 0 ? { pattern_normalization_version: "literal-replacements-v1" } : {},
			rendered_line_format: "trailing-spaces-trimmed-v1"
		});
		processScenarioSchema = z.strictObject({
			executable: childProcessString.min(1),
			arguments: z.array(childProcessString).default([]),
			working_directory: childProcessString.default("."),
			environment: processEnvironmentSchema.default({}),
			filesystem_observation_paths: z.array(childProcessString.min(1)).default([]),
			terminal: z.strictObject({
				columns: z.int().min(1).max(65535).default(80),
				rows: z.int().min(1).max(65535).default(24),
				scrollback: z.int().safe().nonnegative().default(1e3)
			}).describe("The visible terminal and scrollback together must use at most 1,000,000 xterm renderer cells: columns × (rows + scrollback). Resize events use the same scrollback and limit. This release has no runtime override.").default({
				columns: 80,
				rows: 24,
				scrollback: 1e3
			}),
			events: z.array(z.discriminatedUnion("type", [
				z.strictObject({
					...timedEventBase,
					type: z.literal("input"),
					data: z.string(),
					sensitive: z.boolean().default(false)
				}),
				z.strictObject({
					...timedEventBase,
					type: z.literal("resize"),
					columns: z.int().min(1).max(65535),
					rows: z.int().min(1).max(65535)
				}),
				z.strictObject({
					...timedEventBase,
					type: z.literal("signal"),
					signal: z.enum([
						"SIGINT",
						"SIGTERM",
						"SIGKILL"
					])
				})
			])).default([]),
			timeout_ms: positiveBudget.default(3e4),
			idle_timeout_ms: positiveBudget.default(3e4),
			settle_ms: z.int().safe().nonnegative().default(100),
			finalization_ms: z.int().safe().nonnegative().default(0).describe("Milliseconds a target may keep running after SIGTERM when timeout_ms or idle_timeout_ms fires, before SIGKILL; 0 sends SIGKILL immediately. Both signals reach the captured root only while its launch-time start identity still matches; cancellation ends the run at once."),
			limits: z.strictObject({
				output_bytes: positiveBudget.default(1e6),
				files: positiveBudget.default(1e4),
				file_bytes: positiveBudget.default(1e7),
				processes: positiveBudget.default(1e3),
				filesystem_depth: z.int().safe().nonnegative().default(16)
			}).strict().default({
				output_bytes: 1e6,
				files: 1e4,
				file_bytes: 1e7,
				processes: 1e3,
				filesystem_depth: 16
			}),
			normalization: z.strictObject({
				paths: z.boolean().default(false),
				pids: z.boolean().default(true),
				ports: z.boolean().default(true),
				time_bucket_ms: positiveBudget.default(10),
				patterns: z.array(z.strictObject({
					pattern: z.string().describe("Literal text to replace in captured output; not a regular expression."),
					replacement: z.string()
				})).default([])
			}).default({
				paths: false,
				pids: true,
				ports: true,
				time_bucket_ms: 10,
				patterns: []
			})
		}).superRefine((scenario, context) => {
			const lifecycleBudget = BigInt(scenario.timeout_ms) + BigInt(scenario.finalization_ms) + BigInt(scenario.settle_ms);
			if (lifecycleBudget > BigInt(Number.MAX_SAFE_INTEGER)) context.addIssue({
				code: "custom",
				message: `timeout_ms + finalization_ms + settle_ms must stay at or below ${String(Number.MAX_SAFE_INTEGER)} ms, the largest total exactly representable as a JavaScript number`,
				path: ["timeout_ms"]
			});
			if (!fitsProcessTerminalCellBudget(scenario.terminal.columns, scenario.terminal.rows, scenario.terminal.scrollback)) context.addIssue({
				code: "custom",
				path: ["terminal"],
				message: `terminal columns × (rows + scrollback) must not exceed ${String(PROCESS_TERMINAL_CELL_BUDGET)} renderer cells. This release has no runtime override.`
			});
			for (let index = 1; index < scenario.events.length; index += 1) {
				const event = scenario.events[index];
				const previous = scenario.events[index - 1];
				if (eventsOutOfOrder(event, previous)) {
					context.addIssue({
						code: "custom",
						message: "events must be ordered by at_ms",
						path: ["events", index]
					});
				}
			}
			for (const [index, event] of scenario.events.entries()) {
				if (event.type === "resize" && !fitsProcessTerminalCellBudget(event.columns, event.rows, scenario.terminal.scrollback)) context.addIssue({
					code: "custom",
					path: ["events", index],
					message: `resize event at ${String(event.at_ms)} ms exceeds the ${String(PROCESS_TERMINAL_CELL_BUDGET)}-cell renderer budget with the selected scrollback. This release has no runtime override.`
				});
				if (event.at_ms > scenario.timeout_ms) {
					context.addIssue({
						code: "custom",
						message: `event at ${String(event.at_ms)} ms occurs after the ${String(scenario.timeout_ms)} ms scenario timeout`,
						path: ["events", index]
					});
				}
			}
		});
		eventsOutOfOrder = (event, previous) => event !== undefined && previous !== undefined && event.at_ms < previous.at_ms;
	})))();
}

//#endregion
//#region dist/domain/process/processCaptureCoverage.js
var byteRetentionSchema, enumerationOmissionReasonSchema, filesystemCoverageSchema, processCaptureTruncationDetailsSchema, omitted, filesystemTruncated, hasCaptureTruncation, processSourceTruncated;
function init_processCaptureCoverage() {
	return (init_processCaptureCoverage = __esmMin((() => {
		byteRetentionSchema = z.strictObject({
			budget_bytes: z.int().nonnegative(),
			observed_bytes: z.int().nonnegative(),
			retained_bytes: z.int().nonnegative(),
			observed_frames: z.int().nonnegative(),
			retained_frames: z.int().nonnegative(),
			unknown_size_frames: z.int().nonnegative().optional(),
			normalization_over_budget_frames: z.int().nonnegative().optional()
		});
		enumerationOmissionReasonSchema = z.enum([
			"identity_changed",
			"directory_unavailable",
			"entry_unavailable",
			"symlink_not_followed"
		]);
		filesystemCoverageSchema = z.strictObject({
			files_limit: z.int().nonnegative(),
			depth_limit: z.int().nonnegative(),
			enumeration_truncated: z.boolean(),
			enumeration_reasons: z.array(z.enum([
				"files_limit",
				"depth_limit",
				...enumerationOmissionReasonSchema.options
			])),
			enumeration_omissions: z.array(z.strictObject({
				path: z.string(),
				reason: enumerationOmissionReasonSchema,
				system_code: z.string().nullable()
			})),
			unobserved_subtrees: z.array(z.strictObject({
				path: z.string(),
				reason: z.enum(["symlink_not_followed", "observer_owned"])
			})).optional(),
			hash_budget_bytes: z.int().nonnegative(),
			hashed_bytes: z.int().nonnegative(),
			hash_omissions: z.array(z.strictObject({
				path: z.string(),
				size_bytes: z.int().nonnegative(),
				remaining_budget_bytes: z.int().nonnegative(),
				reason: z.enum([
					"file_bytes_budget",
					"file_changed_or_short_read",
					"file_unavailable"
				]),
				system_code: z.string().nullable()
			}))
		});
		processCaptureTruncationDetailsSchema = z.strictObject({
			raw_terminal: byteRetentionSchema.describe("UTF-8 bytes of original PTY chunks; whole chunks are retained or omitted."),
			rendered_terminal: byteRetentionSchema.describe("Cumulative UTF-8 bytes of serialized state plus visible lines, evaluated from retained PTY input; whole frames are retained or omitted. observed_bytes contains the exact total for size-known frames; unknown_size_frames counts frames whose complete size was not calculated. normalization_over_budget_frames identifies the subset stopped by an ordered normalization stage rather than final representation retention."),
			normalized_terminal: z.strictObject({
				budget_bytes: z.int().nonnegative(),
				retained_bytes: z.int().nonnegative(),
				omitted_frames: z.int().nonnegative()
			}).optional().describe("UTF-8 bytes of normalized raw-chunk text retained under output_bytes; omitted frames can have unknown final size when normalization exceeded an intermediate bound."),
			filesystem_before: filesystemCoverageSchema,
			filesystem_after: filesystemCoverageSchema,
			process: z.strictObject({
				sample_limit: z.int().nonnegative(),
				sampling_partial: z.boolean(),
				retained_samples: z.int().nonnegative(),
				sample_limit_reached: z.boolean(),
				sampling_failures: z.int().nonnegative(),
				first_sampling_failure: z.string().nullable(),
				coverage: z.literal("sampled")
			})
		});
		omitted = (retention) => retention.observed_frames > retention.retained_frames;
		filesystemTruncated = (coverage) => coverage.enumeration_truncated || coverage.enumeration_omissions.length > 0 || coverage.hash_omissions.length > 0;
		hasCaptureTruncation = (details) => omitted(details.raw_terminal) || omitted(details.rendered_terminal) || (details.normalized_terminal?.omitted_frames ?? 0) > 0 || (details.rendered_terminal.unknown_size_frames ?? 0) > 0 || filesystemTruncated(details.filesystem_before) || filesystemTruncated(details.filesystem_after) || details.process.sampling_partial;
		processSourceTruncated = (capture, source) => {
			const details = capture.truncation_details;
			switch (source) {
				case "terminal_raw": return omitted(details.raw_terminal);
				case "terminal_rendered": return omitted(details.raw_terminal) || omitted(details.rendered_terminal);
				case "filesystem": return filesystemTruncated(details.filesystem_before) || filesystemTruncated(details.filesystem_after);
				case "process": return details.process.sampling_partial;
				case "interaction":
				case "lifecycle": return false;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/process/processCaptureValidation.js
var orderedTimestamps, validateCommitments, validateOrdering, validateEventJournal, finalizationManifestIssue, finalizationAgreementIssue, finalizationConsistencyIssue, validateLifecycle, validateCoverage, collectProcessCaptureIssues;
function init_processCaptureValidation() {
	return (init_processCaptureValidation = __esmMin((() => {
		init_processScenario();
		init_processCaptureCoverage();
		orderedTimestamps = (values) => values.every((value, index) => {
			const previous = values[index - 1];
			return previous === undefined || value >= previous;
		});
		validateCommitments = (capture, require) => {
			const { manifest } = capture;
			require(manifest.scenario.executable_sha256 === manifest.selected_executable_sha256, "manifest.selected_executable_sha256", "selected executable commitment does not match the scenario projection");
			require(manifest.executable_identity.state === "path_metadata_unchanged" ? manifest.executable_sha256 === manifest.selected_executable_sha256 && manifest.executable_identity.reason === null : manifest.executable_sha256 === null && manifest.executable_identity.reason !== null, "manifest.executable_identity", "launch identity and executable digest do not agree");
			for (const [field, value] of [
				["full_scenario_sha256", manifest.scenario],
				["comparison_contract_sha256", manifest.comparison_contract],
				["normalization_sha256", capture.normalization]
			]) require(manifest[field] === digestProcessCommitment(value), `manifest.${field}`, "commitment does not match its canonical value");
		};
		validateOrdering = (capture, require) => {
			for (const [name, values] of [
				["frames", capture.frames],
				["rendered_frames", capture.rendered_frames],
				["interaction_events", capture.interaction_events]
			]) require(values.every(({ sequence }, index) => sequence === index), name, "sequence values must be contiguous from zero");
			for (const [name, values] of [
				["frames", capture.frames],
				["rendered_frames", capture.rendered_frames],
				["process_samples", capture.process_samples]
			]) require(orderedTimestamps(values.map(({ at_ms }) => at_ms)), name, "timestamps must be ordered");
			require(orderedTimestamps(capture.interaction_events.map(({ dispatched_at_ms }) => dispatched_at_ms)), "interaction_events", "dispatch timestamps must be ordered");
		};
		validateEventJournal = (capture, require) => {
			const journal = capture.event_journal;
			if (journal.length === 0) return;
			const sizes = {
				frames: capture.frames.length,
				rendered_frames: capture.rendered_frames.length,
				interaction_events: capture.interaction_events.length,
				lifecycle: 2,
				process_samples: capture.process_samples.length,
				filesystem_checkpoints: capture.filesystem_checkpoints.length
			};
			const references = new Set();
			for (const [position, entry] of journal.entries()) {
				require(entry.capture_order === position, `event_journal.${String(position)}.capture_order`, "capture order must be contiguous from zero");
				require(entry.index < sizes[entry.collection], `event_journal.${String(position)}.index`, "journal reference is outside its capture collection");
				const reference = `${entry.collection}:${String(entry.index)}`;
				require(!references.has(reference), `event_journal.${String(position)}`, "journal references must be unique");
				references.add(reference);
			}
			const expectedSize = Object.values(sizes).reduce((total, size) => total + size, 0);
			require(journal.length === expectedSize, "event_journal", "nonempty journal must reference every captured observation");
		};
		finalizationManifestIssue = (committedScenario, committedComparison) => committedScenario !== undefined && committedComparison !== undefined && committedScenario["finalization_ms"] !== committedComparison["finalization_ms"] ? "comparison_contract finalization_ms must match the committed scenario" : undefined;
		finalizationAgreementIssue = (exitFinalization, observedFinalization) => exitFinalization !== undefined && observedFinalization !== undefined && JSON.stringify(exitFinalization) !== JSON.stringify(observedFinalization) ? "exit finalization and finalization observation must agree" : undefined;
		finalizationConsistencyIssue = (exit, committedScenario, committedComparison, options) => {
			const manifestIssue = finalizationManifestIssue(committedScenario, committedComparison);
			if (manifestIssue !== undefined) return manifestIssue;
			const finalization = exit?.finalization ?? options?.finalization;
			if (finalization === undefined) {
				const committed = committedScenario?.["finalization_ms"];
				return (exit?.reason === "timeout" || exit?.reason === "idle_timeout") && typeof committed === "number" && committed > 0 ? "a deadline exit under a committed finalization_ms requires finalization evidence" : undefined;
			}
			if (exit?.reason === "exited") return "finalization requires a deadline exit reason";
			const first = finalization.signals[0];
			if (first?.signal !== "SIGTERM") return "finalization signals must start with SIGTERM";
			const killIndexes = finalization.signals.flatMap(({ signal }, index) => signal === "SIGKILL" ? [index] : []);
			if (killIndexes.length > 1 || killIndexes[0] !== undefined && killIndexes[0] !== finalization.signals.length - 1) return "finalization may contain at most one final SIGKILL";
			if (!finalization.signals.every(({ sent_at_ms }, index) => {
				const previous = finalization.signals[index - 1];
				return previous === undefined || sent_at_ms >= previous.sent_at_ms;
			})) return "finalization signal attempt times must not decrease";
			if (finalization.signals.filter(({ signal }) => signal === "SIGTERM").length !== 1) return "finalization must attempt SIGTERM exactly once";
			const kill = finalization.signals.find(({ signal }) => signal === "SIGKILL");
			if (kill !== undefined && kill.sent_at_ms < finalization.requested_ms && exit !== undefined && exit.reason !== "cancelled") return "finalization SIGKILL cannot precede the requested interval";
			if (finalization.elapsed_ms === null && options?.allowNullElapsedMs !== true) return "finalization requires an observed elapsed_ms";
			if (finalization.exit_code !== null && exit?.signal !== undefined && exit.signal !== null && exit.signal !== 0) return "finalization exit_code requires an exit not caused by a signal";
			if (finalization.elapsed_ms !== null && finalization.elapsed_ms < (finalization.signals.at(-1)?.sent_at_ms ?? first.sent_at_ms)) return "finalization elapsed_ms cannot precede the last signal attempt";
			if (committedScenario !== undefined && committedScenario["finalization_ms"] !== finalization.requested_ms) return "finalization must match the committed finalization_ms";
			return undefined;
		};
		validateLifecycle = (capture, require) => {
			require(capture.filesystem_checkpoints.map(({ name }) => name).join(",") === "before,after_settlement", "filesystem_checkpoints", "capture must include initial and final filesystem snapshots");
			require(orderedTimestamps(capture.filesystem_checkpoints.map(({ at_ms }) => at_ms)), "filesystem_checkpoints", "filesystem snapshot times must be ordered");
			require(!capture.filesystem_checkpoints.some(({ truncated }) => truncated) || capture.truncated, "truncated", "filesystem snapshot truncation must propagate to the capture");
			require(capture.exit.reason === "exited" || capture.exit.code === null, "exit", "deadline termination cannot declare a normal exit code");
			const finalizationIssue = finalizationConsistencyIssue(capture.exit, capture.manifest.scenario, capture.manifest.comparison_contract);
			require(finalizationIssue === undefined, "exit", finalizationIssue ?? "");
		};
		validateCoverage = (capture, require) => {
			const details = capture.truncation_details;
			require(details.process.retained_samples === capture.process_samples.length && details.process.retained_samples <= details.process.sample_limit && details.process.sampling_partial === (details.process.sample_limit_reached || details.process.sampling_failures > 0) && details.process.sampling_failures === 0 === (details.process.first_sampling_failure === null), "truncation_details.process", "sampling coverage must agree with retained samples and observed failures");
			require(capture.truncated === hasCaptureTruncation(details), "truncation_details", "aggregate truncation must match producer coverage");
			require((details.rendered_terminal.normalization_over_budget_frames ?? 0) <= (details.rendered_terminal.unknown_size_frames ?? 0), "truncation_details.rendered_terminal.normalization_over_budget_frames", "normalization omissions must be a subset of unknown-size rendered frames");
			for (const [name, retention, count, bytes] of [[
				"raw_terminal",
				details.raw_terminal,
				capture.frames.length,
				capture.frames.reduce((total, frame) => total + Buffer.byteLength(frame.raw_data ?? frame.data), 0)
			], [
				"rendered_terminal",
				details.rendered_terminal,
				capture.rendered_frames.length,
				capture.rendered_frames.reduce((total, frame) => frame.lines.reduce((sum, line) => sum + Buffer.byteLength(line), total + Buffer.byteLength(frame.serialized_state)), 0)
			]]) {
				require(retention.retained_frames === count && retention.observed_frames >= count && retention.retained_bytes === bytes && retention.observed_bytes >= retention.retained_bytes && (retention.observed_frames > count || retention.observed_bytes === retention.retained_bytes) && retention.retained_bytes <= retention.budget_bytes && (retention.unknown_size_frames ?? 0) <= retention.observed_frames - retention.retained_frames, `truncation_details.${name}`, "retained observations and budget accounting do not agree");
			}
			const normalized = details.normalized_terminal;
			if (normalized !== undefined) {
				const committedOutputBudget = processScenarioOutputBudgetProjectionSchema.safeParse(capture.manifest.scenario["limits"]);
				require(committedOutputBudget.success, "manifest.scenario.limits.output_bytes", "committed process scenario must include an explicit valid output_bytes budget");
				const retainedBytes = capture.frames.reduce((total, frame) => total + Buffer.byteLength(frame.data), 0);
				if (committedOutputBudget.success) require(normalized.budget_bytes === committedOutputBudget.data.output_bytes && normalized.retained_bytes === retainedBytes && normalized.retained_bytes <= normalized.budget_bytes && normalized.omitted_frames <= details.raw_terminal.observed_frames - details.raw_terminal.retained_frames, "truncation_details.normalized_terminal", "normalized terminal retention must agree with the committed budget and retained frames");
			}
			for (const [name, coverage, files, checkpoint] of [[
				"filesystem_before",
				details.filesystem_before,
				capture.files_before,
				capture.filesystem_checkpoints[0]
			], [
				"filesystem_after",
				details.filesystem_after,
				capture.files_after,
				capture.filesystem_checkpoints[1]
			]]) {
				const unhashedFiles = new Map(files.filter((file) => file.type === "file" && file.sha256 === null).map((file) => [file.path, file]));
				const entryTypes = new Map(files.map(({ path, type }) => [path, type]));
				require(coverage.hash_omissions.length === unhashedFiles.size && new Set(coverage.hash_omissions.map(({ path }) => path)).size === unhashedFiles.size && coverage.hash_omissions.every((omission) => unhashedFiles.get(omission.path)?.size === omission.size_bytes && omission.remaining_budget_bytes <= coverage.hash_budget_bytes && (omission.reason === "file_unavailable" ? omission.system_code !== null : omission.system_code === null)), `truncation_details.${name}.hash_omissions`, "every retained regular file without a digest must have one matching omission reason");
				require(new Set(coverage.enumeration_omissions.map(({ path }) => path)).size === coverage.enumeration_omissions.length && (!coverage.enumeration_reasons.includes("entry_unavailable") || coverage.enumeration_omissions.some(({ reason }) => reason === "entry_unavailable")) && (!coverage.enumeration_reasons.includes("symlink_not_followed") || coverage.enumeration_omissions.some(({ reason }) => reason === "symlink_not_followed")) && coverage.enumeration_omissions.every((omission) => {
					if (!coverage.enumeration_reasons.includes(omission.reason)) return false;
					const entryType = entryTypes.get(omission.path);
					if (omission.reason === "symlink_not_followed") return entryType === "symlink" && omission.system_code === null;
					if (omission.reason === "directory_unavailable") return entryType === "directory" && omission.system_code !== null;
					return (entryType === undefined || entryType === "directory") && (omission.reason === "entry_unavailable" ? omission.system_code !== null : omission.system_code === null);
				}), `truncation_details.${name}.enumeration_omissions`, "every enumeration omission must identify an unavailable entry, retained directory or unfollowed symlink, with a matching reason and system error only for unavailable reads");
				require(coverage.hashed_bytes === files.filter((file) => file.type === "file" && file.sha256 !== null).reduce((sum, file) => sum + file.size, 0) && coverage.hashed_bytes <= coverage.hash_budget_bytes && files.length <= coverage.files_limit, `truncation_details.${name}`, "filesystem budget accounting does not match retained observations");
				require(coverage.enumeration_truncated === coverage.enumeration_reasons.length > 0 && checkpoint?.truncated === (coverage.enumeration_truncated || coverage.enumeration_omissions.length > 0 || coverage.hash_omissions.length > 0), `truncation_details.${name}`, "filesystem checkpoint truncation must match enumeration and digest coverage");
			}
		};
		collectProcessCaptureIssues = (capture) => {
			const issues = [];
			const require = (condition, path, message) => {
				if (!condition) issues.push({
					path,
					message
				});
			};
			validateCommitments(capture, require);
			validateOrdering(capture, require);
			validateEventJournal(capture, require);
			validateLifecycle(capture, require);
			validateCoverage(capture, require);
			return issues;
		};
	})))();
}

//#endregion
//#region dist/domain/process/processCapture.js
var PROCESS_CAPTURE_EVENT_COLLECTIONS, fileStateShape, fileStateSchema, processFilesystemSnapshotSchema, fileEffectSchema, processSettlementSchema, unverifiedCleanupProcessesSchema, processCaptureFinalizationSchema, processCaptureShapeSchema, processCleanupResourceSchema, partialObservationFieldSchema, incompleteProcessCaptureObservationsSchema, partialCleanupReportSchema, partialObservationMetadataSchema, completedCaptureObservationSchema, incompleteCaptureObservationSchema, partialProcessCaptureObservationSchema, processCaptureSchema;
function init_processCapture() {
	return (init_processCapture = __esmMin((() => {
		init_jsonValue();
		init_processScenario();
		init_processCaptureValidation();
		init_processCaptureCoverage();
		PROCESS_CAPTURE_EVENT_COLLECTIONS = [
			"frames",
			"rendered_frames",
			"interaction_events",
			"lifecycle",
			"process_samples",
			"filesystem_checkpoints"
		];
		fileStateShape = {
			path: z.string(),
			mode: z.int().nonnegative(),
			size: z.int().nonnegative()
		};
		fileStateSchema = z.discriminatedUnion("type", [
			z.object({
				...fileStateShape,
				type: z.literal("file"),
				sha256: z.string().regex(/^[a-f0-9]{64}$/u).nullable(),
				symlink_target: z.null()
			}),
			z.object({
				...fileStateShape,
				type: z.literal("symlink"),
				sha256: z.null(),
				symlink_target: z.string()
			}),
			z.object({
				...fileStateShape,
				type: z.enum(["directory", "other"]),
				sha256: z.null(),
				symlink_target: z.null()
			})
		]);
		processFilesystemSnapshotSchema = z.strictObject({
			files: z.array(fileStateSchema),
			truncated: z.boolean(),
			completeRoots: z.array(z.string()),
			coverage: filesystemCoverageSchema
		});
		fileEffectSchema = z.discriminatedUnion("status", [
			z.object({
				path: z.string(),
				status: z.literal("created"),
				before: z.null(),
				after: fileStateSchema
			}),
			z.object({
				path: z.string(),
				status: z.literal("deleted"),
				before: fileStateSchema,
				after: z.null()
			}),
			z.object({
				path: z.string(),
				status: z.enum(["modified", "unchanged"]),
				before: fileStateSchema,
				after: fileStateSchema
			}),
			z.object({
				path: z.string(),
				status: z.literal("unknown"),
				before: fileStateSchema.nullable(),
				after: fileStateSchema.nullable(),
				reason: z.string().min(1)
			})
		]);
		processSettlementSchema = z.discriminatedUnion("state", [z.object({
			state: z.literal("quiesced"),
			elapsed_ms: z.int().nonnegative(),
			cleanup_outcome: z.enum(["not_required", "failed"])
		}), z.object({
			state: z.enum(["alive_at_deadline", "unverifiable"]),
			elapsed_ms: z.int().nonnegative(),
			cleanup_outcome: z.enum(["cleaned", "failed"])
		})]);
		unverifiedCleanupProcessesSchema = z.array(z.strictObject({
			pid: z.int().positive(),
			reason: z.string()
		}));
		processCaptureFinalizationSchema = z.strictObject({
			requested_ms: z.int().safe().positive(),
			elapsed_ms: z.int().nonnegative().nullable(),
			exit_code: z.int().nonnegative().nullable(),
			signals: z.array(z.strictObject({
				signal: z.enum(["SIGTERM", "SIGKILL"]),
				sent_at_ms: z.int().nonnegative(),
				delivery: z.enum([
					"signaled",
					"gone",
					"identity-changed",
					"unverified"
				]),
				reason: z.string().min(1).optional()
			})).min(1)
		}).superRefine((finalization, context) => {
			if (finalization.exit_code !== null && finalization.elapsed_ms === null) context.addIssue({
				code: "custom",
				path: ["exit_code"],
				message: "finalization exit_code requires an observed exit"
			});
			for (const [index, attempt] of finalization.signals.entries()) if (attempt.reason !== undefined && attempt.delivery !== "unverified") context.addIssue({
				code: "custom",
				path: [
					"signals",
					index,
					"reason"
				],
				message: "finalization reason is only allowed for an unverified delivery"
			});
		});
		processCaptureShapeSchema = z.strictObject({
			manifest: z.strictObject({
				rea_version: z.string().min(1),
				provider_version: z.string().min(1),
				platform: z.string().min(1),
				architecture: z.string().min(1),
				pty_backend: z.literal("node-pty"),
				started_at: z.iso.datetime(),
				completed_at: z.iso.datetime(),
				scenario: z.record(z.string(), jsonValueSchema),
				comparison_contract: z.record(z.string(), jsonValueSchema),
				full_scenario_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
				comparison_contract_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
				selected_executable_sha256: z.string().regex(/^[a-f0-9]{64}$/u).nullable(),
				executable_sha256: z.string().regex(/^[a-f0-9]{64}$/u).nullable(),
				executable_identity: z.strictObject({
					state: z.enum(["path_metadata_unchanged", "unknown"]),
					reason: z.string().nullable()
				}),
				normalization_sha256: z.string().regex(/^[a-f0-9]{64}$/u)
			}),
			normalization: normalizationSchema,
			frames: z.array(z.object({
				sequence: z.int().nonnegative(),
				at_ms: z.int().nonnegative(),
				data: z.string(),
				raw_data: z.string().optional()
			})),
			rendered_frames: z.array(z.object({
				sequence: z.int().nonnegative(),
				at_ms: z.int().nonnegative(),
				columns: z.int().positive(),
				rows: z.int().positive(),
				cursor_x: z.int().nonnegative(),
				cursor_y: z.int().nonnegative(),
				active_buffer: z.enum(["normal", "alternate"]),
				lines: z.array(z.string()),
				serialized_state: z.string()
			})),
			interaction_events: z.array(z.object({
				sequence: z.int().nonnegative(),
				scheduled_at_ms: z.int().nonnegative(),
				dispatched_at_ms: z.int().nonnegative(),
				type: z.enum([
					"input",
					"resize",
					"signal"
				]),
				data: z.string(),
				outcome: z.enum([
					"dispatched",
					"target_exited",
					"failed"
				])
			})),
			exit: z.object({
				code: z.int().nullable(),
				signal: z.int().nullable(),
				reason: z.enum([
					"exited",
					"timeout",
					"idle_timeout"
				]),
				finalization: processCaptureFinalizationSchema.optional()
			}),
			settlement: z.discriminatedUnion("state", [z.object({
				state: z.literal("quiesced"),
				elapsed_ms: z.int().nonnegative(),
				cleanup_outcome: z.literal("not_required")
			}), z.object({
				state: z.enum(["alive_at_deadline", "unverifiable"]),
				elapsed_ms: z.int().nonnegative(),
				cleanup_outcome: z.enum(["cleaned", "failed"])
			})]),
			process_samples: z.array(z.object({
				at_ms: z.int().nonnegative(),
				pid: z.int().positive(),
				parent_pid: z.int().nonnegative(),
				command: z.string(),
				process_group_id: z.int().positive().nullable(),
				session_id: z.int().nonnegative().nullable()
			})),
			filesystem_checkpoints: z.array(z.object({
				name: z.enum(["before", "after_settlement"]),
				at_ms: z.int().nonnegative(),
				files: z.array(fileStateSchema),
				effects: z.array(fileEffectSchema),
				truncated: z.boolean()
			})),
			event_journal: z.array(z.object({
				capture_order: z.int().nonnegative(),
				collection: z.enum(PROCESS_CAPTURE_EVENT_COLLECTIONS),
				index: z.int().nonnegative()
			})),
			files_before: z.array(fileStateSchema),
			files_after: z.array(fileStateSchema),
			filesystem_effects: z.array(fileEffectSchema),
			truncated: z.boolean(),
			truncation_details: processCaptureTruncationDetailsSchema,
			limitations: z.array(z.string()),
			residual_unknowns: z.array(z.object({
				scope: z.enum([
					"terminal",
					"interaction",
					"exit",
					"process",
					"filesystem",
					"cleanup",
					"network",
					"environment"
				]),
				reason: z.string()
			})),
			cleanup: z.object({
				owned_process_group: z.literal("verified"),
				temporary_root: z.literal("removed"),
				unverified_processes: unverifiedCleanupProcessesSchema.optional()
			})
		});
		processCleanupResourceSchema = z.strictObject({
			state: z.enum([
				"cleaned",
				"failed",
				"unverified",
				"not_required"
			]),
			reason: z.string().nullable(),
			unverified_processes: unverifiedCleanupProcessesSchema.optional()
		});
		partialObservationFieldSchema = (value) => z.discriminatedUnion("state", [z.strictObject({
			state: z.literal("available"),
			value
		}), z.strictObject({
			state: z.literal("unavailable"),
			reason: z.string()
		})]);
		incompleteProcessCaptureObservationsSchema = z.strictObject({
			target_pid: partialObservationFieldSchema(z.int().positive()),
			frames: partialObservationFieldSchema(processCaptureShapeSchema.shape.frames),
			rendered_frames: partialObservationFieldSchema(processCaptureShapeSchema.shape.rendered_frames),
			interaction_events: partialObservationFieldSchema(processCaptureShapeSchema.shape.interaction_events),
			exit: partialObservationFieldSchema(z.strictObject({
				code: z.int().nullable(),
				signal: z.int().nullable(),
				reason: z.enum([
					"exited",
					"timeout",
					"idle_timeout",
					"cancelled"
				]),
				finalization: processCaptureFinalizationSchema.optional()
			})),
			finalization: partialObservationFieldSchema(processCaptureFinalizationSchema).optional(),
			settlement: partialObservationFieldSchema(z.strictObject({
				state: z.enum([
					"quiesced",
					"alive_at_deadline",
					"unverifiable"
				]),
				elapsed_ms: z.int().nonnegative()
			})),
			process_samples: partialObservationFieldSchema(processCaptureShapeSchema.shape.process_samples),
			filesystem_snapshots: z.strictObject({
				before: partialObservationFieldSchema(processFilesystemSnapshotSchema),
				after: partialObservationFieldSchema(processFilesystemSnapshotSchema)
			}),
			event_journal: partialObservationFieldSchema(processCaptureShapeSchema.shape.event_journal),
			manifest: partialObservationFieldSchema(processCaptureShapeSchema.shape.manifest)
		});
		partialCleanupReportSchema = z.strictObject({
			owned_process_group: processCleanupResourceSchema,
			terminal_renderer: processCleanupResourceSchema,
			temporary_root: processCleanupResourceSchema
		});
		partialObservationMetadataSchema = z.strictObject({
			cleanup: partialCleanupReportSchema,
			execution_failure: z.string().nullable()
		});
		completedCaptureObservationSchema = z.strictObject({ capture: processCaptureShapeSchema.omit({ cleanup: true }).extend({ settlement: processSettlementSchema }) });
		incompleteCaptureObservationSchema = z.strictObject({ observations: incompleteProcessCaptureObservationsSchema });
		partialProcessCaptureObservationSchema = z.union([completedCaptureObservationSchema.extend(partialObservationMetadataSchema.shape), incompleteCaptureObservationSchema.extend(partialObservationMetadataSchema.shape)]).superRefine((partial, context) => {
			const cleanupIncomplete = Object.values(partial.cleanup).some(({ state }) => state === "failed" || state === "unverified");
			if (!cleanupIncomplete && partial.execution_failure === null) context.addIssue({
				code: "custom",
				path: ["execution_failure"],
				message: "partial observations require incomplete cleanup or an execution failure"
			});
			const observedExit = "capture" in partial ? partial.capture.exit : partial.observations.exit.state === "available" ? partial.observations.exit.value : undefined;
			const observedFinalization = "observations" in partial && partial.observations.finalization?.state === "available" ? partial.observations.finalization.value : undefined;
			const committedManifest = "capture" in partial ? partial.capture.manifest : partial.observations.manifest.state === "available" ? partial.observations.manifest.value : undefined;
			const manifestFinalizationIssue = finalizationManifestIssue(committedManifest?.scenario, committedManifest?.comparison_contract);
			const exitFinalizationIssue = manifestFinalizationIssue ?? (observedExit === undefined ? undefined : finalizationConsistencyIssue(observedExit, committedManifest?.scenario, committedManifest?.comparison_contract));
			const incompleteFinalizationIssue = manifestFinalizationIssue ?? (observedFinalization === undefined ? undefined : finalizationConsistencyIssue(observedExit === undefined ? undefined : {
				reason: observedExit.reason,
				signal: observedExit.signal
			}, committedManifest?.scenario, committedManifest?.comparison_contract, {
				finalization: observedFinalization,
				allowNullElapsedMs: true
			}));
			if (exitFinalizationIssue !== undefined) context.addIssue({
				code: "custom",
				path: ["exit"],
				message: exitFinalizationIssue
			});
			if (incompleteFinalizationIssue !== undefined) context.addIssue({
				code: "custom",
				path: ["finalization"],
				message: incompleteFinalizationIssue
			});
			const agreementIssue = finalizationAgreementIssue(observedExit?.finalization, observedFinalization);
			if (agreementIssue !== undefined) context.addIssue({
				code: "custom",
				path: ["finalization"],
				message: agreementIssue
			});
			if ("observations" in partial && partial.observations.exit.state === "unavailable" && observedFinalization !== undefined && observedFinalization?.elapsed_ms !== null) context.addIssue({
				code: "custom",
				path: ["finalization"],
				message: "finalization elapsed_ms must be null when the exit observation is unavailable"
			});
			if ("observations" in partial) {
				const { observations } = partial;
				if (![
					observations.frames,
					observations.interaction_events,
					observations.process_samples,
					observations.filesystem_snapshots.before,
					observations.event_journal
				].some(({ state }) => state === "available")) context.addIssue({
					code: "custom",
					path: ["observations"],
					message: "incomplete observations contain no collected evidence"
				});
				return;
			}
			const { capture } = partial;
			const settlement = capture.settlement.state === "quiesced" ? {
				...capture.settlement,
				cleanup_outcome: "not_required"
			} : {
				...capture.settlement,
				cleanup_outcome: "cleaned"
			};
			const validationCapture = {
				...capture,
				settlement,
				cleanup: {
					owned_process_group: "verified",
					temporary_root: "removed"
				}
			};
			for (const issue of collectProcessCaptureIssues(validationCapture)) context.addIssue({
				code: "custom",
				path: ["capture", ...issue.path.split(".")],
				message: issue.message
			});
		});
		processCaptureSchema = processCaptureShapeSchema.superRefine((capture, context) => {
			if (capture.settlement.cleanup_outcome === "failed") context.addIssue({
				code: "custom",
				path: ["settlement", "cleanup_outcome"],
				message: "verified captures cannot contain failed cleanup"
			});
			for (const issue of collectProcessCaptureIssues(capture)) context.addIssue({
				code: "custom",
				path: issue.path.split("."),
				message: issue.message
			});
		}).describe("The capture must preserve its canonical scenario, comparison, and normalization SHA-256 commitments; ordered capture timestamps and contiguous sequence numbers; before and final filesystem snapshots with truncation propagated; and exit-code consistency with deadline termination. The event journal is required; empty journals are valid. A non-empty journal must reference every captured observation exactly once with unique in-range references. These cross-field invariants are checked by REA after capture.");
	})))();
}

//#endregion
//#region dist/domain/process/processCaptureParsing.js
var verifiedProcessCaptureSchema, safeParseProcessCapture, parseProcessCapture;
function init_processCaptureParsing() {
	return (init_processCaptureParsing = __esmMin((() => {
		init_processCapture();
		verifiedProcessCaptureSchema = processCaptureSchema.brand();
		safeParseProcessCapture = (input) => verifiedProcessCaptureSchema.safeParse(input);
		parseProcessCapture = (input) => verifiedProcessCaptureSchema.parse(input);
	})))();
}

//#endregion
//#region dist/domain/evidenceValidation.js
var safeParseEvidence, safeParseImmutableEvidence, readEvidence, readImmutableEvidence, authenticateEvidence, readEvidencePayload, integrityFailure$1;
function init_evidenceValidation() {
	return (init_evidenceValidation = __esmMin((() => {
		init_evidence();
		init_evidenceErrors();
		init_validationFailure();
		init_result();
		safeParseEvidence = (input) => authenticateEvidence(input, parseEvidence);
		safeParseImmutableEvidence = (input) => authenticateEvidence(input, immutableEvidence);
		readEvidence = (input) => {
			const parsed = safeParseEvidence(input);
			return parsed.ok ? parsed : err(integrityFailure$1(parsed.error));
		};
		readImmutableEvidence = (input) => {
			const parsed = safeParseImmutableEvidence(input);
			return parsed.ok ? parsed : err(integrityFailure$1(parsed.error));
		};
		authenticateEvidence = (input, parse) => {
			try {
				return ok(parse(input));
			} catch (cause) {
				if (!(cause instanceof z.ZodError)) throw cause;
				return err(cause);
			}
		};
		readEvidencePayload = (schema, input) => {
			const parsed = schema.safeParse(input);
			return parsed.success ? ok(parsed.data) : err(integrityFailure$1(parsed.error));
		};
		integrityFailure$1 = (cause) => {
			const message = `Evidence validation failed ${describeValidationFailure(cause)}`;
			return new EvidenceIntegrityError(message, {
				cause,
				userMessage: message
			});
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSourceCoordinates.js
var compareJavaScriptSourcePoints, javascriptSourceRangeContains, javascriptSourceRangeKey, sourcePointSchema, javascriptSourceRangeSchema;
function init_javascriptSourceCoordinates() {
	return (init_javascriptSourceCoordinates = __esmMin((() => {
		compareJavaScriptSourcePoints = (left, right) => left.line - right.line || left.column - right.column;
		javascriptSourceRangeContains = (outer, inner) => compareJavaScriptSourcePoints(outer.start, inner.start) <= 0 && compareJavaScriptSourcePoints(outer.end, inner.end) >= 0;
		javascriptSourceRangeKey = (range) => `${range.start.line}:${range.start.column}-${range.end.line}:${range.end.column}`;
		sourcePointSchema = z.strictObject({
			line: z.number().int().min(1),
			column: z.number().int().min(0)
		});
		javascriptSourceRangeSchema = z.strictObject({
			start: sourcePointSchema,
			end: sourcePointSchema
		}).superRefine((range, context) => {
			if (compareJavaScriptSourcePoints(range.end, range.start) < 0) context.addIssue({
				code: "custom",
				path: ["end"],
				message: "Source range end must not precede its start"
			});
		}).describe("One-based lines, zero-based UTF-16 columns; start inclusive, end exclusive.");
	})))();
}

//#endregion
//#region dist/domain/jsonStringByteLength.js
var jsonStringByteLength;
function init_jsonStringByteLength() {
	return (init_jsonStringByteLength = __esmMin((() => {
		jsonStringByteLength = (value, budget = Number.POSITIVE_INFINITY) => {
			let bytes = 2;
			for (let index = 0; index < value.length && bytes <= budget; index++) {
				const unit = value.charCodeAt(index);
				if (unit === 34 || unit === 92) bytes += 2;
				else if (unit < 32) bytes += unit === 8 || unit === 9 || unit === 10 || unit === 12 || unit === 13 ? 2 : 6;
				else if (unit < 128) bytes += 1;
				else if (unit < 2048) bytes += 2;
				else if (unit >= 55296 && unit <= 56319) {
					const next = value.charCodeAt(index + 1);
					if (next >= 56320 && next <= 57343) {
						bytes += 4;
						index++;
					} else bytes += 6;
				} else if (unit >= 56320 && unit <= 57343) bytes += 6;
				else bytes += 3;
			}
			return bytes;
		};
	})))();
}

//#endregion
//#region dist/domain/jsonValueByteLength.js
var jsonValueByteLength;
function init_jsonValueByteLength() {
	return (init_jsonValueByteLength = __esmMin((() => {
		init_jsonStringByteLength();
		jsonValueByteLength = (value, budget = Number.POSITIVE_INFINITY) => {
			if (typeof value === "string") return jsonStringByteLength(value, budget);
			if (Array.isArray(value)) {
				let bytes = 2 + Math.max(0, value.length - 1);
				for (const child of value) {
					if (bytes > budget) break;
					bytes += jsonValueByteLength(child, budget - bytes);
				}
				return bytes;
			}
			if (value !== null && typeof value === "object") {
				const keys = Object.keys(value);
				let bytes = 2 + Math.max(0, keys.length - 1);
				for (const key of keys) {
					if (bytes > budget) break;
					bytes += jsonStringByteLength(key, budget - bytes) + 1;
					if (bytes <= budget) bytes += jsonValueByteLength(value[key], budget - bytes);
				}
				return bytes;
			}
			return typeof value === "number" && !Number.isFinite(value) ? 4 : String(value).length;
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptAnalysisResourceControls.js
var JAVASCRIPT_STATIC_FACT_BYTES, JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS, JAVASCRIPT_WORKER_HEAP_MIB_MINIMUM, JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM, JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM, HEAP_DOES_NOT_RAISE, javaScriptWorkerHeapRemediation, JAVASCRIPT_PARENT_HEAP_NODE_OPTIONS, JAVASCRIPT_PARENT_RESULT_BUDGET_REMEDIATION, JAVASCRIPT_PARENT_CHECKPOINT_HEAP_REMEDIATION, javaScriptWorkerHeapExhaustionRecovery, semanticControl, semanticAdjustment, javaScriptSemanticCeilingCoverage, javaScriptAnalysisCoverageLimits, javaScriptAnalysisResourceControlsSchema;
function init_javascriptAnalysisResourceControls() {
	return (init_javascriptAnalysisResourceControls = __esmMin((() => {
		JAVASCRIPT_STATIC_FACT_BYTES = 8 * 1024 * 1024;
		JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS = {
			heapMb: 1024,
			timeoutMs: 3e5,
			semanticNodes: 1e5,
			semanticNodesPerFile: 2e4,
			semanticUnknowns: 1e5,
			semanticUnknownsPerFile: 2e4
		};
		JAVASCRIPT_WORKER_HEAP_MIB_MINIMUM = 128;
		JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM = 16384;
		JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM = 1e6;
		HEAP_DOES_NOT_RAISE = "Raising max_heap_mb does not raise the parent result budget, transfer record or transfer file byte ceilings, the CLI/MCP process heap, or fixed parser limits.";
		javaScriptWorkerHeapRemediation = (heapMb) => {
			const bounds = `an integer from ${String(128)} to ${String(JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM)} (default ${String(JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS.heapMb)} MiB)`;
			const adjustment = heapMb >= 16384 ? `max_heap_mb is already ${String(heapMb)} MiB, the maximum ${String(JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM)}. Do not increase it further.` : `Increase max_heap_mb (CLI: rea analyze-javascript-application <input_path> --max-heap-mb <mebibytes>), ${bounds}.`;
			return `${adjustment} The effective worker heap for this analysis is ${String(heapMb)} MiB. A changed max_heap_mb applies on the next analysis, which starts a new worker. It does not change a worker that is already running, and it does not require restarting the REA server. ${HEAP_DOES_NOT_RAISE} On Bun, V8 heap flags are ignored: Windows limits the analyzer's committed memory to max_heap_mb plus a 512 MiB reserve, and other Bun hosts enforce no analyzer heap limit.`;
		};
		JAVASCRIPT_PARENT_HEAP_NODE_OPTIONS = "On Node, set NODE_OPTIONS (for example --max-old-space-size=<MiB>) in the environment that starts the CLI or MCP server, then restart that process,";
		JAVASCRIPT_PARENT_RESULT_BUDGET_REMEDIATION = `This limit belongs to the parent result budget. That budget follows the parent V8 heap limit. Increasing max_heap_mb does not raise it. ${JAVASCRIPT_PARENT_HEAP_NODE_OPTIONS} to raise the parent heap and this budget. Use the retained static facts or analyze fewer source files.`;
		JAVASCRIPT_PARENT_CHECKPOINT_HEAP_REMEDIATION = `This limit belongs to the parent process heap. Increasing max_heap_mb does not raise it. max_heap_mb changes only the isolated analyzer, on the next analysis, by starting a new worker. ${JAVASCRIPT_PARENT_HEAP_NODE_OPTIONS} to raise the parent heap and admit this checkpoint.`;
		javaScriptWorkerHeapExhaustionRecovery = (input) => {
			if (input.heapFlagsEnforced) return {
				reason: `Owned JavaScript worker exhausted its ${String(input.heapMb)} MiB V8 old-space heap (max_heap_mb) while analyzing ${input.path} during ${input.phase}`,
				remediationAction: javaScriptWorkerHeapRemediation(input.heapMb)
			};
			return {
				reason: `Owned JavaScript worker ran out of memory while analyzing ${input.path} during ${input.phase}. Bun ignores the V8 old-space flag, so this exit is not the configured max_heap_mb limit of ${String(input.heapMb)} MiB.`,
				remediationAction: "Bun ignores V8 heap flags, so raising max_heap_mb does not change this exit. Windows limits the analyzer's committed memory to max_heap_mb plus a 512 MiB reserve and reports that separately as a process memory limit. Other Bun hosts enforce no analyzer heap limit. Reduce the analysis instead of increasing max_heap_mb."
			};
		};
		semanticControl = {
			nodes: {
				total: "max_semantic_nodes",
				perFile: "max_semantic_nodes_per_file",
				ceiling: "semantic_graph_node_ceiling",
				fileCeiling: "semantic_graph_file_node_ceiling",
				totalDefault: JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS.semanticNodes,
				perFileDefault: JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS.semanticNodesPerFile,
				cliTotal: "--max-semantic-nodes",
				cliPerFile: "--max-semantic-nodes-per-file",
				doesNotRaise: "max_semantic_unknowns, max_heap_mb, transfer ceilings, or the parent result budget"
			},
			unknowns: {
				total: "max_semantic_unknowns",
				perFile: "max_semantic_unknowns_per_file",
				ceiling: "semantic_graph_unknown_ceiling",
				fileCeiling: "semantic_graph_file_unknown_ceiling",
				totalDefault: JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS.semanticUnknowns,
				perFileDefault: JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS.semanticUnknownsPerFile,
				cliTotal: "--max-semantic-unknowns",
				cliPerFile: "--max-semantic-unknowns-per-file",
				doesNotRaise: "max_semantic_nodes, max_heap_mb, transfer ceilings, or the parent result budget"
			}
		};
		semanticAdjustment = (name, value, fallback) => value >= 1e6 ? `${name} is already ${String(value)}, the maximum ${String(JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM)}. Do not increase it further.` : `${name} is ${String(value)} (default ${String(fallback)}; an integer from 1 to ${String(JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM)})`;
		javaScriptSemanticCeilingCoverage = (kind, total, perFile, reached) => {
			const control = semanticControl[kind];
			const limits = [
				{
					name: control.ceiling,
					value: total,
					unit: "items"
				},
				{
					name: control.fileCeiling,
					value: perFile,
					unit: "items"
				},
				{
					name: control.total,
					value: total,
					unit: "items"
				},
				{
					name: control.perFile,
					value: perFile,
					unit: "items"
				}
			];
			const reachedControls = [...reached.total ? [{
				name: control.total,
				value: total,
				fallback: control.totalDefault,
				cli: control.cliTotal
			}] : [], ...reached.perFile ? [{
				name: control.perFile,
				value: perFile,
				fallback: control.perFileDefault,
				cli: control.cliPerFile
			}] : []];
			if (reachedControls.length === 0) throw new RangeError("Semantic ceiling coverage requires a ceiling that stopped retention");
			const reachedText = reachedControls.map((item) => semanticAdjustment(item.name, item.value, item.fallback)).join(" and ");
			const names = reachedControls.map((item) => item.name).join(" and ");
			const cli = reachedControls.map((item) => item.cli).join(" and ");
			const raising = reachedControls.length === 1 ? "Raising it" : "Raising them";
			const limitation = `Semantic ${kind === "nodes" ? "node" : "unknown"} retention reached ${reachedText}. Set ${names} on the next analyze_javascript_application call (CLI: ${cli}). The change applies to that next analysis and does not restart the worker or the REA server. ${raising} does not raise ${control.doesNotRaise}. Coverage reports the same effective values as ${control.ceiling} and ${control.fileCeiling}.`;
			return {
				limits,
				limitation
			};
		};
		javaScriptAnalysisCoverageLimits = (limits) => {
			const result = [];
			for (const key of [
				"worker_heap_limit_bytes",
				"worker_process_memory_limit_bytes",
				"worker_timeout_ms",
				"parent_result_budget_bytes",
				"parent_available_result_budget_bytes",
				"semantic_result_budget_bytes",
				"transfer_record_bytes",
				"transfer_file_bytes"
			]) {
				const value = limits?.[key];
				if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) continue;
				result.push({
					name: `javascript_analysis_${key}`,
					value,
					unit: key.endsWith("_ms") ? "milliseconds" : "bytes"
				});
			}
			return result;
		};
		javaScriptAnalysisResourceControlsSchema = z.strictObject({
			max_semantic_nodes: z.number().int().min(1).max(JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM).optional().describe("Maximum retained semantic nodes across the application; defaults to 100000. Worker heap and parent result admission remain enforced."),
			max_semantic_nodes_per_file: z.number().int().min(1).max(JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM).optional().describe("Maximum retained semantic nodes per source file; defaults to 20000, additionally bounded by max_semantic_nodes and memory/transfer limits."),
			max_semantic_unknowns: z.number().int().min(1).max(JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM).optional().describe("Maximum retained semantic unknown records across the application; defaults to 100000. Omitted emission occurrences are counted by family and reason."),
			max_semantic_unknowns_per_file: z.number().int().min(1).max(JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM).optional().describe("Maximum retained semantic unknown records per source file; defaults to 20000, additionally bounded by max_semantic_unknowns and memory/transfer limits."),
			max_heap_mb: z.number().int().min(128).max(JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM).optional().describe("Maximum V8 old-space heap in MiB for the isolated JavaScript source analyzer; defaults to 1024. This does not change the CLI/MCP process heap. When REA runs on Bun, which ignores V8 heap flags, Windows instead limits the analyzer's committed memory to this budget plus a 512 MiB runtime reserve; other Bun hosts enforce no limit."),
			analysis_timeout_ms: z.number().int().min(1).max(2147483647).optional().describe("Maximum startup, analysis and transfer time per JavaScript source, in milliseconds; defaults to 300000. On timeout, return collected partial Evidence and stop the analysis.")
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRouteFacts.js
var javaScriptRouteMechanismSchema, javaScriptRouteSegmentSchema, javaScriptRouteCandidateSchema, javaScriptRouteWorkCapacitySchema, javaScriptRouteSourceFactsSchema;
function init_javascriptRouteFacts() {
	return (init_javascriptRouteFacts = __esmMin((() => {
		init_javascriptSourceCoordinates();
		javaScriptRouteMechanismSchema = z.enum([
			"router-call",
			"nested-route-object",
			"typed-route-tree",
			"next-app-chunk",
			"navigation-target",
			"route-string-constant"
		]);
		javaScriptRouteSegmentSchema = z.strictObject({
			value: z.string(),
			location: javascriptSourceRangeSchema,
			origin: z.enum([
				"literal",
				"property-name",
				"next-app-path"
			])
		});
		javaScriptRouteCandidateSchema = z.strictObject({
			path: z.string().startsWith("/"),
			mechanism: javaScriptRouteMechanismSchema,
			confidence: z.enum([
				"low",
				"medium",
				"high"
			]),
			derivation: z.enum([
				"literal",
				"joined",
				"inferred"
			]),
			location: javascriptSourceRangeSchema,
			segments: z.array(javaScriptRouteSegmentSchema)
		});
		javaScriptRouteWorkCapacitySchema = z.strictObject({
			kind: z.literal("route-work-or-facts"),
			limit_bytes: z.int().nonnegative(),
			accounted_fact_bytes: z.int().nonnegative(),
			accounted_work_bytes: z.int().nonnegative()
		});
		javaScriptRouteSourceFactsSchema = z.strictObject({
			candidates: z.array(javaScriptRouteCandidateSchema),
			unresolved: z.array(z.strictObject({
				mechanism: javaScriptRouteMechanismSchema,
				location: javascriptSourceRangeSchema,
				reason: z.string()
			})),
			capacity: z.discriminatedUnion("kind", [javaScriptRouteWorkCapacitySchema, z.strictObject({
				kind: z.literal("result-bytes"),
				limit_bytes: z.int().nonnegative(),
				preceding_work_capacity: javaScriptRouteWorkCapacitySchema.nullable()
			})]).nullable()
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRoutePaths.js
var packageIdentitySchema, nextAppSourceContextSchema, routePath, classifyNextAppRoutePath, nextScriptBasePath;
function init_javascriptRoutePaths() {
	return (init_javascriptRoutePaths = __esmMin((() => {
		init_digests();
		packageIdentitySchema = z.strictObject({
			path: z.string().min(1),
			sha256: digestSchema,
			container_sha256: digestSchema
		});
		nextAppSourceContextSchema = z.discriminatedUnion("kind", [
			z.strictObject({
				kind: z.literal("app-directory"),
				directory: z.string().min(1),
				package: packageIdentitySchema
			}),
			z.strictObject({
				kind: z.literal("compiled-directory"),
				directory: z.string().min(1),
				package: packageIdentitySchema
			}),
			z.strictObject({
				kind: z.literal("outside-app-directory"),
				package: packageIdentitySchema
			}),
			z.strictObject({
				kind: z.literal("unknown"),
				reason: z.string(),
				package: packageIdentitySchema.nullable()
			})
		]);
		routePath = (value, options = {}) => {
			const end = options.navigation ? value.search(/[?#]/u) : -1;
			const path = end < 0 ? value : value.slice(0, end);
			if (!path || /[\u0000-\u0020\u007f\\]/u.test(path) || path.startsWith("//")) return;
			if (!path.startsWith("/") && !options.relative) return;
			if (/^[a-z][a-z0-9+.-]*:/iu.test(path)) return;
			return path.startsWith("/") ? path : `/${path}`;
		};
		classifyNextAppRoutePath = (raw, context) => {
			if (raw.includes("\\") || context.kind === "source-reference") return;
			let value = raw;
			if (context.kind === "script-url" || context.kind === "source-literal" && raw.includes("://")) {
				try {
					value = new URL(raw).pathname;
				} catch {
					return;
				}
			}
			let relative;
			let chunk = false;
			if (context.kind === "source-path") {
				if (context.source.kind === "outside-app-directory") return;
				if (context.source.kind === "app-directory" || context.source.kind === "compiled-directory") {
					const prefix = `${context.source.directory}/`;
					if (!value.startsWith(prefix)) return;
					relative = value.slice(prefix.length);
					chunk = context.source.kind === "compiled-directory";
				}
			} else if (context.kind === "script-url" || context.runtime === "next") {
				const boundary = "/_next/static/chunks/app/";
				const assetRoot = value.indexOf(boundary);
				const localChunk = ["static/chunks/app/", ".next/static/chunks/app/"].find((prefix) => value.startsWith(prefix));
				if (assetRoot >= 0) {
					relative = value.slice(assetRoot + boundary.length);
					chunk = true;
				} else if (context.kind === "source-literal" && localChunk !== undefined) {
					relative = value.slice(localChunk.length);
					chunk = true;
				} else if (context.kind === "source-literal") {
					const prefix = value.startsWith("src/app/") ? "src/app/" : "app/";
					if (value.startsWith(prefix)) relative = value.slice(prefix.length);
				}
			}
			if (relative === undefined) {
				if (/(?:^|\/)app\/(?:.*\/)?page(?:\.[cm]?[jt]sx?|-[^/?#]+\.js|)(?:[?#].*)?$/u.test(value)) return {
					kind: "unknown",
					reason: context.kind === "source-path" && context.source.kind === "unknown" ? context.source.reason : "The page-shaped path has no established Next App Router root or runtime context."
				};
				return;
			}
			const match = /^(?:(.*?)\/)?page(?:-([^/?#]+)\.js|\.(?:[cm]?jsx?|tsx?)|)(?:[?#].*)?$/u.exec(relative);
			if (match === null || match[2] !== undefined && !chunk) return;
			const sourceSegments = (match[1] ?? "").split("/");
			if (sourceSegments.some((segment) => segment.startsWith("_"))) return;
			const segments = [];
			for (const sourceSegment of sourceSegments) {
				const segment = sourceSegment.replace(/%5F/gu, "_");
				if (/^\([^)]*\)$/u.test(segment) || segment.startsWith("@")) continue;
				if (segment.startsWith("(")) return {
					kind: "unknown",
					reason: "An intercepted Next page route requires parent routing context unavailable from its filename."
				};
				if (segment.includes("/") || segment === "." || segment === "..") return;
				const optional = /^\[\[\.\.\.([^\]]+)\]\]$/u.exec(segment);
				const catchAll = /^\[\.\.\.([^\]]+)\]$/u.exec(segment);
				const parameter = /^\[([^\]]+)\]$/u.exec(segment);
				segments.push(optional ? `:${optional[1]}*` : catchAll ? `:${catchAll[1]}+` : parameter ? `:${parameter[1]}` : segment);
			}
			const path = routePath(`/${segments.filter(Boolean).join("/")}`);
			return path === undefined ? undefined : {
				kind: "known",
				path
			};
		};
		nextScriptBasePath = (source) => {
			let path = source;
			if (/^https?:\/\//iu.test(source)) {
				try {
					path = new URL(source).pathname;
				} catch {
					return;
				}
			} else if (!source.startsWith("/")) return;
			const at = path.indexOf("/_next/");
			return at < 0 ? undefined : path.slice(0, at);
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRouteInventory.js
/** Join only owned syntax facts and source metadata; never fetch or reinterpret source text. */
function* buildJavaScriptRouteInventorySteps(inputs, byteBudget = JAVASCRIPT_STATIC_FACT_BYTES, captureOmissions = []) {
	const sources = [], occurrences = [], unknowns = [];
	const routes = new Map(), sourceIdsByRoute = new Map(), seenOccurrences = new Set(), seenGaps = new Set();
	const contexts = [];
	const headerBytes = jsonValueByteLength({
		inventory_id: `jsri:${"f".repeat(64)}`,
		source_manifest_sha256: "f".repeat(64),
		sources: [],
		routes: [],
		occurrences: [],
		unknowns: [],
		capacity: {
			limit_bytes: Number.MAX_SAFE_INTEGER,
			accounted_bytes: Number.MAX_SAFE_INTEGER
		},
		coverage: {
			scope: "provided-code-sources",
			source_parsing: "complete",
			candidate_enumeration: "complete",
			application_routes: "unknown"
		},
		statistics: Object.fromEntries([
			"sources_seen",
			"sources_retained",
			"route_patterns",
			"occurrences",
			"unanchored_literals_excluded"
		].map((key) => [key, Number.MAX_SAFE_INTEGER])),
		limitations: [...INVENTORY_LIMITATIONS]
	});
	if (!Number.isSafeInteger(byteBudget) || byteBudget < headerBytes) throw new RangeError(`Route inventory budget must fit its ${headerBytes}-byte envelope.`);
	let accounted = headerBytes, capacity = null, partial = false, unanchored = 0;
	const reserve = (value) => {
		if (capacity !== null) return false;
		const bytes = jsonValueByteLength(value, byteBudget - accounted) + 1;
		if (bytes > byteBudget - accounted) {
			capacity = {
				limit_bytes: byteBudget,
				accounted_bytes: accounted
			};
			partial = true;
			return false;
		}
		accounted += bytes;
		return true;
	};
	const retainGap = (body) => {
		const value = {
			id: routeGapId(body),
			...body
		};
		if (!seenGaps.has(value.id) && reserve(value)) {
			unknowns.push(value);
			seenGaps.add(value.id);
		}
	};
	const gap = (source, kind, reason, source_range = null) => retainGap({
		source_id: source.id,
		kind,
		source_range,
		reason
	});
	for (const { unit, count, reason } of captureOmissions) {
		yield;
		partial = true;
		retainGap({
			source_id: null,
			kind: "capture-omission",
			source_range: null,
			reason,
			capture_omission: {
				unit,
				count
			}
		});
	}
	const manifestIds = [];
	for (const input of inputs) {
		yield;
		const metadata = classifyNextAppRoutePath(input.url ?? input.path ?? "", input.url !== null ? { kind: "script-url" } : {
			kind: "source-path",
			source: input.next_app_context ?? {
				kind: "unknown",
				package: null,
				reason: "Next App Router source applicability was not measured."
			}
		});
		const nextContext = metadata === undefined ? undefined : input.next_app_context;
		const id = lookupId("jss", [
			input.key,
			input.path,
			input.url,
			input.sha256,
			input.container_sha256,
			...nextContext === undefined ? [] : [nextContext]
		]);
		manifestIds.push(id);
		const prefix = input.url === null ? undefined : nextScriptBasePath(input.url);
		const source = {
			id,
			key: input.key,
			path: input.path,
			url: input.url,
			sha256: input.sha256,
			container_sha256: input.container_sha256,
			status: input.status,
			...nextContext === undefined ? {} : { next_app_context: nextContext },
			reported_route_capacity: input.facts?.capacity ?? null,
			reason: input.reason,
			base_path: prefix ? {
				value: prefix,
				basis: "next-script-url",
				status: "inferred"
			} : null
		};
		if (!reserve(source)) continue;
		sources.push(source);
		const metadataPath = metadata?.kind === "known" ? metadata.path : undefined;
		contexts.push({
			input,
			source,
			metadataPath
		});
		if (metadata?.kind === "unknown") {
			partial = true;
			gap(source, "interpretation", metadata.reason);
		}
		if (input.status !== "complete" || input.facts === null) {
			partial = true;
			gap(source, "source-unavailable", input.reason ?? "Route syntax was not fully measured for this source.");
		}
		if (source.base_path !== null) gap(source, "inferred-base", "A Next script URL prefix is an inferred routing base; assetPrefix may differ from the deployed route base.");
		if (input.facts?.capacity !== null && input.facts?.capacity !== undefined) {
			partial = true;
			gap(source, "capacity", input.facts.capacity.kind === "result-bytes" ? `Route facts exceeded the ${input.facts.capacity.limit_bytes}-byte remaining serialized-result budget; additional candidates remain unknown.` : `Source route work/facts reached ${input.facts.capacity.limit_bytes} accounted bytes; additional candidates remain unknown.`);
		}
		for (const unknown of input.facts?.unresolved ?? []) {
			partial = true;
			gap(source, "interpretation", unknown.reason, unknown.location);
		}
	}
	const prefixPath = (path, source, applicationRelative) => {
		const base = source.base_path?.value;
		return base === undefined || !applicationRelative && (path === base || path.startsWith(`${base}/`)) ? path : path === "/" ? base : `${base}${path}`;
	};
	const applicationRoot = (path, source, applicationRelative) => {
		const base = source.base_path?.value;
		const start = !applicationRelative && base !== undefined && (path === base || path.startsWith(`${base}/`)) ? base.length + 1 : 1;
		const end = path.indexOf("/", start);
		return path.slice(start, end < 0 ? undefined : end);
	};
	const roots = new Set();
	for (const { input, source, metadataPath } of contexts) {
		yield;
		if (metadataPath !== undefined) {
			const root = applicationRoot(metadataPath, source, true);
			if (root) roots.add(root);
		}
		for (const candidate of input.facts?.candidates ?? []) if (candidate.mechanism !== "route-string-constant") {
			const root = applicationRoot(candidate.path, source, candidate.mechanism === "next-app-chunk");
			if (root) roots.add(root);
		}
	}
	const append = (source, candidate, origin) => {
		if (capacity !== null) return;
		const applicationRelative = candidate.mechanism === "next-app-chunk";
		const path = prefixPath(candidate.path, source, applicationRelative);
		if (candidate.mechanism === "route-string-constant" && !roots.has(applicationRoot(candidate.path, source, applicationRelative))) {
			unanchored++;
			return;
		}
		const route_id = routeId(path), inferredBase = path === candidate.path ? null : source.base_path.value;
		const identity = [
			source.id,
			path,
			candidate.mechanism,
			origin,
			candidate.location,
			candidate.segments
		];
		const id = lookupId("jso", identity);
		if (seenOccurrences.has(id)) return;
		const occurrence = {
			id,
			route_id,
			source_id: source.id,
			mechanism: candidate.mechanism,
			confidence: inferredBase === null ? candidate.confidence : "low",
			derivation: inferredBase === null ? candidate.derivation : "inferred",
			source_range: origin === "source-syntax" ? candidate.location : null,
			origin,
			unprefixed_path: candidate.path,
			inferred_base_path: inferredBase,
			segments: origin === "source-syntax" ? candidate.segments : []
		};
		let route = routes.get(path);
		if (route === undefined) {
			route = {
				id: route_id,
				path,
				...classify(path, [candidate.mechanism]),
				confidence: occurrence.confidence,
				mechanisms: [],
				occurrence_count: 0,
				source_count: 0,
				primary_occurrence_id: id
			};
			if (!reserve({
				...route,
				classification_basis: "router-configuration",
				confidence: "medium",
				mechanisms: javaScriptRouteMechanismSchema.options,
				occurrence_count: Number.MAX_SAFE_INTEGER,
				source_count: Number.MAX_SAFE_INTEGER
			})) return;
		}
		if (!reserve(occurrence)) return;
		if (!routes.has(path)) {
			routes.set(path, route);
			sourceIdsByRoute.set(route_id, new Set());
		}
		occurrences.push(occurrence);
		seenOccurrences.add(id);
		route.occurrence_count++;
		const routeSources = sourceIdsByRoute.get(route_id);
		routeSources.add(source.id);
		route.source_count = routeSources.size;
		if (!route.mechanisms.includes(candidate.mechanism)) {
			route.mechanisms.push(candidate.mechanism);
			Object.assign(route, classify(path, route.mechanisms));
		}
		if (ranks[occurrence.confidence] > ranks[route.confidence] || ranks[occurrence.confidence] === ranks[route.confidence] && id < route.primary_occurrence_id) {
			route.confidence = occurrence.confidence;
			route.primary_occurrence_id = id;
		}
	};
	for (const { input, source, metadataPath } of contexts) {
		yield;
		if (metadataPath !== undefined) append(source, {
			path: metadataPath,
			mechanism: "next-app-chunk",
			confidence: "medium",
			derivation: "joined",
			location: null,
			segments: []
		}, source.url === null ? "source-path" : "source-url");
		for (const candidate of input.facts?.candidates ?? []) {
			yield;
			append(source, candidate, "source-syntax");
			if (capacity !== null) break;
		}
	}
	sources.sort((a, b) => order(a.key, b.key) || order(a.id, b.id));
	occurrences.sort((a, b) => order(a.id, b.id));
	const items = [...routes.values()].sort((a, b) => order(a.path, b.path));
	for (const route of items) route.mechanisms.sort(order);
	unknowns.sort((a, b) => order(a.source_id ?? "", b.source_id ?? "") || order(a.kind, b.kind) || (a.source_range?.start.line ?? 0) - (b.source_range?.start.line ?? 0) || (a.source_range?.start.column ?? 0) - (b.source_range?.start.column ?? 0) || (a.source_range?.end.line ?? 0) - (b.source_range?.end.line ?? 0) || (a.source_range?.end.column ?? 0) - (b.source_range?.end.column ?? 0) || order(a.reason, b.reason));
	const source_manifest_sha256 = hash(manifestIds.sort(order));
	const result = {
		source_manifest_sha256,
		sources,
		routes: items,
		occurrences,
		unknowns,
		capacity,
		coverage: {
			scope: "provided-code-sources",
			source_parsing: sources.length === 0 ? "unknown" : sources.some((source) => source.status !== "complete") || capacity !== null ? "partial" : "complete",
			candidate_enumeration: partial ? "partial" : "complete",
			application_routes: "unknown"
		},
		statistics: {
			sources_seen: inputs.length,
			sources_retained: sources.length,
			route_patterns: items.length,
			occurrences: occurrences.length,
			unanchored_literals_excluded: unanchored
		},
		limitations: [...INVENTORY_LIMITATIONS]
	};
	return {
		inventory_id: `jsri:${hash(["javascript-routes-v1", result])}`,
		...result
	};
}
var sourceStatus, confidence, sourceShape, javaScriptRouteInventorySourceSchema, javaScriptRouteOccurrenceSchema, javaScriptInventoryRouteSchema, javaScriptRouteCaptureOmissionSchema, javaScriptRouteGapSchema, capacitySchema, inventoryShape, javaScriptRouteInventorySchema, hash, lookupId, routeGapId, routeId, order, ranks, classify, INVENTORY_LIMITATIONS;
function init_javascriptRouteInventory() {
	return (init_javascriptRouteInventory = __esmMin((() => {
		init_javascriptSourceCoordinates();
		init_canonicalDigest();
		init_jsonValueByteLength();
		init_digests();
		init_javascriptAnalysisResourceControls();
		init_javascriptRouteFacts();
		init_javascriptRoutePaths();
		sourceStatus = z.enum([
			"complete",
			"partial",
			"unavailable",
			"unknown"
		]);
		confidence = javaScriptRouteCandidateSchema.shape.confidence;
		sourceShape = {
			id: z.string().regex(/^jss:[a-f0-9]{32}$/u),
			key: z.string(),
			path: z.string().nullable(),
			url: z.string().nullable(),
			sha256: digestSchema.nullable(),
			container_sha256: digestSchema.nullable(),
			status: sourceStatus,
			reported_route_capacity: javaScriptRouteSourceFactsSchema.shape.capacity,
			reason: z.string().nullable(),
			next_app_context: nextAppSourceContextSchema.exactOptional(),
			base_path: z.strictObject({
				value: z.string(),
				basis: z.literal("next-script-url"),
				status: z.literal("inferred")
			}).nullable()
		};
		javaScriptRouteInventorySourceSchema = z.strictObject(sourceShape);
		javaScriptRouteOccurrenceSchema = z.strictObject({
			id: z.string().regex(/^jso:[a-f0-9]{32}$/u),
			route_id: z.string().regex(/^jsr:[a-f0-9]{32}$/u),
			source_id: sourceShape.id,
			mechanism: javaScriptRouteMechanismSchema,
			confidence,
			derivation: javaScriptRouteCandidateSchema.shape.derivation,
			source_range: javascriptSourceRangeSchema.nullable(),
			origin: z.enum([
				"source-syntax",
				"source-path",
				"source-url"
			]),
			unprefixed_path: z.string(),
			inferred_base_path: z.string().nullable(),
			segments: z.array(javaScriptRouteSegmentSchema)
		});
		javaScriptInventoryRouteSchema = z.strictObject({
			id: z.string().regex(/^jsr:[a-f0-9]{32}$/u),
			path: z.string().startsWith("/"),
			classification: z.enum([
				"page",
				"system",
				"unknown"
			]),
			classification_basis: z.enum([
				"next-app-page",
				"router-configuration",
				"path-name-heuristic",
				"unknown"
			]),
			confidence,
			mechanisms: z.array(javaScriptRouteMechanismSchema),
			occurrence_count: z.int().nonnegative(),
			source_count: z.int().nonnegative(),
			primary_occurrence_id: javaScriptRouteOccurrenceSchema.shape.id
		});
		javaScriptRouteCaptureOmissionSchema = z.strictObject({
			unit: z.enum(["script-records", "script-sources"]),
			count: z.int().nonnegative().nullable()
		});
		javaScriptRouteGapSchema = z.strictObject({
			id: z.string().regex(/^jsg:[a-f0-9]{32}$/u),
			source_id: sourceShape.id.nullable(),
			kind: z.enum([
				"source-unavailable",
				"interpretation",
				"inferred-base",
				"capacity",
				"capture-omission"
			]),
			source_range: javascriptSourceRangeSchema.nullable(),
			reason: z.string(),
			capture_omission: javaScriptRouteCaptureOmissionSchema.exactOptional()
		});
		capacitySchema = z.strictObject({
			limit_bytes: z.int().nonnegative(),
			accounted_bytes: z.int().nonnegative()
		});
		inventoryShape = z.strictObject({
			inventory_id: z.string().regex(/^jsri:[a-f0-9]{64}$/u),
			source_manifest_sha256: digestSchema,
			sources: z.array(javaScriptRouteInventorySourceSchema),
			routes: z.array(javaScriptInventoryRouteSchema),
			occurrences: z.array(javaScriptRouteOccurrenceSchema),
			unknowns: z.array(javaScriptRouteGapSchema),
			coverage: z.strictObject({
				scope: z.literal("provided-code-sources"),
				source_parsing: z.enum([
					"complete",
					"partial",
					"unknown"
				]),
				candidate_enumeration: z.enum(["complete", "partial"]),
				application_routes: z.literal("unknown")
			}),
			statistics: z.strictObject({
				sources_seen: z.int().nonnegative(),
				sources_retained: z.int().nonnegative(),
				route_patterns: z.int().nonnegative(),
				occurrences: z.int().nonnegative(),
				unanchored_literals_excluded: z.int().nonnegative()
			}),
			capacity: capacitySchema.nullable(),
			limitations: z.array(z.string())
		});
		javaScriptRouteInventorySchema = inventoryShape.superRefine((value, context) => {
			const sources = new Set(), routes = new Map(), occurrences = new Map();
			for (const source of value.sources) {
				if (sources.has(source.id) || source.id !== lookupId("jss", [
					source.key,
					source.path,
					source.url,
					source.sha256,
					source.container_sha256,
					...source.next_app_context === undefined ? [] : [source.next_app_context]
				])) context.addIssue({
					code: "custom",
					path: ["sources"],
					message: "Route source identity must be unique and bind source/content/applicability fields"
				});
				sources.add(source.id);
			}
			for (const route of value.routes) {
				if (routes.has(route.id) || route.id !== routeId(route.path)) context.addIssue({
					code: "custom",
					path: ["routes"],
					message: "Route identity must uniquely bind its exact pattern"
				});
				routes.set(route.id, route);
			}
			const byRoute = new Map();
			for (const occurrence of value.occurrences) {
				if (occurrences.has(occurrence.id) || !sources.has(occurrence.source_id) || !routes.has(occurrence.route_id) || occurrence.id !== lookupId("jso", [
					occurrence.source_id,
					routes.get(occurrence.route_id)?.path ?? null,
					occurrence.mechanism,
					occurrence.origin,
					occurrence.source_range,
					occurrence.segments
				])) context.addIssue({
					code: "custom",
					path: ["occurrences"],
					message: "Route occurrences require unique identities and retained source/route owners"
				});
				occurrences.set(occurrence.id, occurrence);
				let rows = byRoute.get(occurrence.route_id);
				if (rows === undefined) {
					rows = [];
					byRoute.set(occurrence.route_id, rows);
				}
				rows.push(occurrence);
			}
			for (const route of value.routes) {
				const rows = byRoute.get(route.id) ?? [], primary = occurrences.get(route.primary_occurrence_id);
				if (rows.length !== route.occurrence_count || new Set(rows.map((row) => row.source_id)).size !== route.source_count || primary?.route_id !== route.id || rows.some((row) => !route.mechanisms.includes(row.mechanism)) || new Set(rows.map((row) => row.mechanism)).size !== new Set(route.mechanisms).size || new Set(route.mechanisms).size !== route.mechanisms.length || route.confidence !== primary?.confidence || rows.some((row) => ranks[row.confidence] > ranks[route.confidence]) || route.classification !== classify(route.path, route.mechanisms).classification || route.classification_basis !== classify(route.path, route.mechanisms).classification_basis) context.addIssue({
					code: "custom",
					path: ["routes"],
					message: "Route aggregates and primary provenance must match their occurrences"
				});
			}
			if (value.statistics.sources_retained !== value.sources.length || value.statistics.route_patterns !== value.routes.length || value.statistics.occurrences !== value.occurrences.length) context.addIssue({
				code: "custom",
				path: ["statistics"],
				message: "Route statistics must count retained facts"
			});
			const gaps = new Set();
			for (const gap of value.unknowns) {
				if (gaps.has(gap.id) || gap.id !== routeGapId(gap) || gap.source_id !== null && !sources.has(gap.source_id)) context.addIssue({
					code: "custom",
					path: ["unknowns"],
					message: "An attributed route gap requires a unique content-bound identity and retained source"
				});
				if (gap.kind === "capture-omission" !== (gap.capture_omission !== undefined) || gap.kind === "capture-omission" && (gap.source_id !== null || gap.source_range !== null)) context.addIssue({
					code: "custom",
					path: ["unknowns"],
					message: "Capture omissions keep capture-level counts and have no invented source or range."
				});
				gaps.add(gap.id);
			}
			const { inventory_id, ...body } = value;
			if (inventory_id !== `jsri:${hash(["javascript-routes-v1", body])}`) context.addIssue({
				code: "custom",
				path: ["inventory_id"],
				message: "Inventory identity must bind all retained facts and coverage."
			});
		});
		hash = (value) => digestCanonicalValue(value, "JavaScript route fact");
		lookupId = (prefix, value) => `${prefix}:${hash(value).slice(0, 32)}`;
		routeGapId = (gap) => lookupId("jsg", [
			gap.source_id,
			gap.kind,
			gap.source_range,
			gap.reason,
			...gap.capture_omission === undefined ? [] : [gap.capture_omission]
		]);
		routeId = (path) => lookupId("jsr", path);
		order = (a, b) => a < b ? -1 : a > b ? 1 : 0;
		ranks = {
			low: 0,
			medium: 1,
			high: 2
		};
		classify = (path, mechanisms) => {
			if (/(?:^|\/)(?:auth|login|logout|signin|signup|billing|callback|callbacks|oauth|sso)(?:\/|$)/iu.test(path)) return {
				classification: "system",
				classification_basis: "path-name-heuristic"
			};
			if (mechanisms.includes("next-app-chunk")) return {
				classification: "page",
				classification_basis: "next-app-page"
			};
			if (mechanisms.includes("nested-route-object") || mechanisms.includes("typed-route-tree")) return {
				classification: "page",
				classification_basis: "router-configuration"
			};
			return {
				classification: "unknown",
				classification_basis: "unknown"
			};
		};
		INVENTORY_LIMITATIONS = [
			"Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.",
			"Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.",
			"System classification is a path-name heuristic. Asset URL prefixes can differ from routing bases; inferred prefixes retain the original unprefixed path.",
			"Unbound path strings require a top-level segment supported by structural routes or navigation candidates. Unknown or missing source facts do not establish route absence."
		];
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptArtifactFiles.js
var javaScriptFileOccurrenceSchema, isJavaScriptSourcePath, javaScriptArtifactTextExclusion, javaScriptSemanticSourceExclusion;
function init_javascriptArtifactFiles() {
	return (init_javascriptArtifactFiles = __esmMin((() => {
		init_digests();
		javaScriptFileOccurrenceSchema = z.strictObject({
			container_sha256: digestSchema,
			path: z.string().min(1),
			sha256: digestSchema
		});
		isJavaScriptSourcePath = (path) => /\.(?:cjs|cts|mjs|mts|js|jsx|ts|tsx)$/iu.test(path);
		javaScriptArtifactTextExclusion = (file) => {
			if (file.text.included || file.text.reason === "not-applicable") return null;
			if (file.text.reason === "invalid-utf8" && file.kind !== "javascript") return null;
			return file.text.reason === "outside-analysis-scope" ? "Source was not analyzed because it is outside the caller-selected source_paths." : "Source bytes are not valid UTF-8; JavaScript semantics were not analyzed.";
		};
		javaScriptSemanticSourceExclusion = (file, parseStatus) => {
			if (file.kind !== "javascript") return null;
			return javaScriptArtifactTextExclusion(file) ?? (parseStatus === "failed" ? "JavaScript syntax could not be parsed; JavaScript semantics were not analyzed." : null);
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSourceMapPaths.js
var javascriptSourceMapReferenceSchema, resolveJavaScriptSourceMapReferences, resolveJavaScriptSourceMapUrl, sourceMapReference, resolveJavaScriptSourceMapPath, unusableHost, carriesUsableHost, windowsFileUrl, decodedUrlPath;
function init_javascriptSourceMapPaths() {
	return (init_javascriptSourceMapPaths = __esmMin((() => {
		javascriptSourceMapReferenceSchema = z.strictObject({
			source_name: z.string(),
			source_root: z.string().nullable(),
			map_path: z.string().min(1),
			resolution: z.discriminatedUnion("kind", [z.strictObject({
				kind: z.enum(["artifact-relative", "suffix"]),
				path: z.string().min(1)
			}), z.strictObject({
				kind: z.literal("unresolved"),
				reason: z.string().min(1)
			})])
		});
		resolveJavaScriptSourceMapReferences = (sourceNames, sourceRoot, mapPath) => {
			return sourceNames.map((sourceName) => {
				if (sourceName === null) return null;
				return {
					source_name: sourceName,
					source_root: sourceRoot,
					map_path: mapPath,
					resolution: resolveJavaScriptSourceMapPath(sourceMapReference(sourceName, sourceRoot), mapPath)
				};
			});
		};
		resolveJavaScriptSourceMapUrl = (source, sourceRoot, mapUrl) => {
			if (source === null) return null;
			return URL.parse(sourceMapReference(source, sourceRoot), mapUrl)?.href ?? null;
		};
		sourceMapReference = (source, sourceRoot) => {
			if (sourceRoot == null) return source;
			return `${sourceRoot}${sourceRoot.endsWith("/") ? "" : "/"}${source}`;
		};
		resolveJavaScriptSourceMapPath = (source, mapPath) => {
			const portable = source.replaceAll("\\", "/");
			const windowsPath = /^[a-z]:\//iu.test(portable) || source.startsWith("\\\\");
			const anchor = `/${"source/".repeat(portable.split("/").length + 1)}`;
			const directory = posix.join(anchor, posix.dirname(mapPath));
			const base = pathToFileURL(`${directory}/`, { windows: false });
			const absolute = windowsPath ? windowsFileUrl(source) : URL.parse(source);
			const resolved = windowsPath ? absolute : URL.parse(source, base);
			if (resolved === null) return {
				kind: "unresolved",
				reason: "Source reference is not a valid URL or filesystem path."
			};
			if (!resolved.pathname.startsWith("/")) return {
				kind: "unresolved",
				reason: "Source reference uses a non-hierarchical URL without a file pathname."
			};
			if (resolved.pathname.endsWith("/")) return {
				kind: "unresolved",
				reason: "Source reference names a directory rather than a file."
			};
			const declaredPath = windowsPath ? absolute?.pathname ?? "" : URL.parse(source, "file:///")?.pathname ?? "";
			if (/%(?:2f|5c)/iu.test(declaredPath)) return {
				kind: "unresolved",
				reason: "Source reference contains an encoded path separator."
			};
			const relative = absolute === null ? !portable.startsWith("/") : absolute.href !== resolved.href;
			const path = decodedUrlPath(resolved);
			if (path === null) return {
				kind: "unresolved",
				reason: "Source reference has malformed URL encoding or an invalid file URL."
			};
			const value = relative ? posix.relative(anchor, path) : path.replace(/^\/+/, "");
			if (value === "" || value === ".." || value.startsWith("../")) return {
				kind: "unresolved",
				reason: "Source reference resolves outside the inventoried artifact."
			};
			return {
				path: value,
				kind: relative ? "artifact-relative" : "suffix"
			};
		};
		unusableHost = /[\0\t\n\r #/:<>?@[\\\]^|%]/u;
		carriesUsableHost = (host) => !unusableHost.test(host) && domainToASCII(host) !== "";
		windowsFileUrl = (path) => {
			if (path.startsWith("\\\\") && !carriesUsableHost(path.slice(2).split("\\")[0] ?? "")) return null;
			try {
				return pathToFileURL(path, { windows: true });
			} catch (cause) {
				if (cause instanceof TypeError) return null;
				throw cause;
			}
		};
		decodedUrlPath = (url) => {
			try {
				if (url.protocol === "file:") {
					const windows = url.hostname !== "" && url.hostname !== "localhost";
					const path = fileURLToPath(url, { windows });
					return windows ? path.replaceAll("\\", "/") : path;
				}
				return `${url.host}${decodeURIComponent(url.pathname)}`;
			} catch (cause) {
				if (cause instanceof URIError || cause instanceof TypeError) return null;
				throw cause;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptApplicationEvidenceSchemas.js
var boundedTextSchema$4, boundedKeySchema, unsafePathSegments, isSafeRelativePath, relativePathSchema$2, applicationEvidenceAuthoritySchema, applicationFactStateSchema, applicationConfidenceSchema, applicationUnavailableReasonSchema, unavailableFactSchema, availableArtifactSchema, applicationArtifactReferenceSchema, sourceRangeSchema, fileOffsetRangeSchema, applicationLocationSchema, applicationLocationReferenceSchema, applicationExtractorSchema, applicationLimitSchema, coverageLimitsSchema, omittedCountSchema, applicationCoverageSchema, completeApplicationCoverage, partialApplicationCoverage, truncatedApplicationCoverage, applicationGraphEvidenceBaseSchema, applicationGraphEvidenceContextSchema, applicationGraphEvidenceLocationSchema, checkAuthorityState, checkStateConfidence, checkTraceability, checkArtifactBacking, applicationGraphEvidenceSchema, applicationNodeIdentitySchema;
function init_javascriptApplicationEvidenceSchemas() {
	return (init_javascriptApplicationEvidenceSchemas = __esmMin((() => {
		init_javascriptSourceCoordinates();
		init_digests();
		boundedTextSchema$4 = z.string().min(1);
		boundedKeySchema = z.string().min(1);
		unsafePathSegments = new Set([
			"",
			".",
			".."
		]);
		isSafeRelativePath = (path) => {
			if (path.startsWith("/")) return false;
			return path.split("/").every((part) => !unsafePathSegments.has(part));
		};
		relativePathSchema$2 = z.string().min(1).refine(isSafeRelativePath, "Expected a normalized relative POSIX path without traversal");
		applicationEvidenceAuthoritySchema = z.enum([
			"artifact-bytes",
			"ast-static-analysis",
			"static-relationship-inference",
			"passive-cdp-runtime",
			"cross-layer-reconciliation",
			"cross-version-comparison",
			"controlled-replay",
			"native-analysis-provider",
			"managed-static-analysis",
			"historical-reference",
			"user-assertion",
			"unknown"
		]);
		applicationFactStateSchema = z.enum([
			"observed",
			"inferred",
			"unknown",
			"unavailable"
		]);
		applicationConfidenceSchema = z.enum([
			"exact",
			"high",
			"medium",
			"low",
			"unknown"
		]);
		applicationUnavailableReasonSchema = z.enum([
			"not-applicable",
			"not-observed",
			"truncated",
			"provider-unavailable",
			"unresolved",
			"unknown"
		]);
		unavailableFactSchema = z.strictObject({
			available: z.literal(false),
			reason: applicationUnavailableReasonSchema,
			detail: boundedTextSchema$4
		});
		availableArtifactSchema = z.strictObject({
			available: z.literal(true),
			artifact_id: prefixedDigestSchema("art"),
			sha256: digestSchema
		}).superRefine((artifact, context) => {
			if (artifact.artifact_id !== `art_${artifact.sha256}`) context.addIssue({
				code: "custom",
				path: ["artifact_id"],
				message: "Artifact identifier must commit the same SHA-256 digest"
			});
		});
		applicationArtifactReferenceSchema = z.discriminatedUnion("available", [availableArtifactSchema, unavailableFactSchema]);
		sourceRangeSchema = javascriptSourceRangeSchema.safeExtend({
			kind: z.literal("source-range"),
			source: boundedTextSchema$4
		});
		fileOffsetRangeSchema = z.strictObject({
			kind: z.literal("file-offset-range"),
			start: z.int().min(0).max(Number.MAX_SAFE_INTEGER),
			end: z.int().min(0).max(Number.MAX_SAFE_INTEGER)
		}).superRefine((location, context) => {
			if (location.end < location.start) context.addIssue({
				code: "custom",
				path: ["end"],
				message: "File offset range end must not precede its start"
			});
		});
		applicationLocationSchema = z.discriminatedUnion("kind", [
			z.strictObject({
				kind: z.literal("artifact-path"),
				path: relativePathSchema$2
			}),
			sourceRangeSchema,
			fileOffsetRangeSchema,
			z.strictObject({
				kind: z.literal("url"),
				url: z.string().min(1)
			}),
			z.strictObject({
				kind: z.literal("runtime"),
				capture_sha256: digestSchema,
				target_key: boundedKeySchema,
				frame_key: boundedKeySchema.nullable(),
				script_key: boundedKeySchema.nullable()
			}),
			z.strictObject({
				kind: z.literal("native-address"),
				address: boundedKeySchema,
				symbol: boundedTextSchema$4.nullable()
			}),
			z.strictObject({
				kind: z.literal("package-export"),
				package_name: boundedKeySchema,
				export_path: boundedTextSchema$4
			})
		]);
		applicationLocationReferenceSchema = z.discriminatedUnion("available", [z.strictObject({
			available: z.literal(true),
			value: applicationLocationSchema
		}), unavailableFactSchema]);
		applicationExtractorSchema = z.strictObject({
			name: z.string().min(1),
			version: z.string().min(1),
			operation: z.string().min(1),
			executable_sha256: digestSchema.nullable()
		});
		applicationLimitSchema = z.strictObject({
			name: z.string().min(1),
			value: z.int().min(0).max(Number.MAX_SAFE_INTEGER),
			unit: z.enum([
				"items",
				"bytes",
				"milliseconds",
				"depth",
				"characters",
				"instructions",
				"other"
			])
		});
		coverageLimitsSchema = z.array(applicationLimitSchema);
		omittedCountSchema = z.int().min(0).max(Number.MAX_SAFE_INTEGER);
		applicationCoverageSchema = z.union([
			z.strictObject({
				status: z.literal("complete"),
				truncated: z.literal(false),
				omitted_count: z.literal(0),
				limits: coverageLimitsSchema
			}),
			z.strictObject({
				status: z.literal("partial"),
				truncated: z.literal(false),
				omitted_count: omittedCountSchema.nullable(),
				limits: coverageLimitsSchema
			}),
			z.strictObject({
				status: z.literal("partial"),
				truncated: z.literal(true),
				omitted_count: z.union([omittedCountSchema.positive(), z.null()]),
				limits: z.array(applicationLimitSchema).min(1)
			}),
			z.strictObject({
				status: z.enum(["unknown", "unavailable"]),
				truncated: z.literal(false),
				omitted_count: z.null(),
				limits: coverageLimitsSchema
			})
		]);
		completeApplicationCoverage = (limits = []) => applicationCoverageSchema.parse({
			status: "complete",
			truncated: false,
			omitted_count: 0,
			limits
		});
		partialApplicationCoverage = (limits, omittedCount) => applicationCoverageSchema.parse({
			status: "partial",
			truncated: false,
			omitted_count: omittedCount,
			limits
		});
		truncatedApplicationCoverage = (limits, omittedCount) => applicationCoverageSchema.parse({
			status: "partial",
			truncated: true,
			omitted_count: omittedCount,
			limits
		});
		applicationGraphEvidenceBaseSchema = z.strictObject({
			authority: applicationEvidenceAuthoritySchema,
			state: applicationFactStateSchema,
			confidence: applicationConfidenceSchema,
			artifact: applicationArtifactReferenceSchema,
			location: applicationLocationReferenceSchema,
			extractor: applicationExtractorSchema,
			coverage: applicationCoverageSchema,
			limitations: z.array(boundedTextSchema$4),
			evidence_ids: z.array(prefixedDigestSchema("ev"))
		});
		applicationGraphEvidenceContextSchema = applicationGraphEvidenceBaseSchema.omit({ location: true });
		applicationGraphEvidenceLocationSchema = applicationLocationReferenceSchema;
		checkAuthorityState = (evidence, context) => {
			if (evidence.authority === "static-relationship-inference" && evidence.state !== "inferred") context.addIssue({
				code: "custom",
				path: ["state"],
				message: "Static relationship authority must remain inferred"
			});
			if (evidence.authority === "cross-layer-reconciliation" && evidence.state !== "inferred") context.addIssue({
				code: "custom",
				path: ["state"],
				message: "Cross-layer reconciliation authority must remain inferred"
			});
			if (evidence.authority === "cross-version-comparison" && evidence.state !== "inferred") context.addIssue({
				code: "custom",
				path: ["state"],
				message: "Cross-version comparison authority must remain inferred"
			});
			if (evidence.authority === "unknown" && !["unknown", "unavailable"].includes(evidence.state)) context.addIssue({
				code: "custom",
				path: ["state"],
				message: "Unknown authority cannot claim an observed fact"
			});
		};
		checkStateConfidence = (evidence, context) => {
			if (["unknown", "unavailable"].includes(evidence.state) && (evidence.confidence !== "unknown" || evidence.limitations.length === 0)) context.addIssue({
				code: "custom",
				message: "Unknown and unavailable facts require unknown confidence and an explicit limitation"
			});
			if (evidence.state === "observed" && evidence.confidence === "unknown") context.addIssue({
				code: "custom",
				path: ["confidence"],
				message: "Observed facts require a bounded non-unknown confidence"
			});
			if (evidence.state === "inferred" && ![
				"high",
				"medium",
				"low"
			].includes(evidence.confidence)) context.addIssue({
				code: "custom",
				path: ["confidence"],
				message: "Inferred facts require high, medium, or low confidence"
			});
			if (evidence.confidence === "exact" && evidence.state !== "observed") context.addIssue({
				code: "custom",
				path: ["confidence"],
				message: "Exact confidence is reserved for observed facts"
			});
		};
		checkTraceability = (evidence, context) => {
			if (evidence.state === "observed" && !evidence.location.available) context.addIssue({
				code: "custom",
				path: ["location"],
				message: "Observed facts require an actionable location"
			});
			if (evidence.state === "inferred" && evidence.limitations.length === 0) context.addIssue({
				code: "custom",
				path: ["limitations"],
				message: "Inferred facts require an explicit limitation"
			});
			if (evidence.coverage.status !== "complete" && evidence.limitations.length === 0) context.addIssue({
				code: "custom",
				path: ["limitations"],
				message: "Non-complete coverage requires an explicit limitation"
			});
		};
		checkArtifactBacking = (evidence, context) => {
			const artifactBacked = [
				"artifact-bytes",
				"ast-static-analysis",
				"controlled-replay",
				"native-analysis-provider",
				"managed-static-analysis"
			].includes(evidence.authority);
			if (artifactBacked && evidence.state !== "unavailable" && !evidence.artifact.available) context.addIssue({
				code: "custom",
				path: ["artifact"],
				message: "Artifact-backed facts require a content digest"
			});
		};
		applicationGraphEvidenceSchema = applicationGraphEvidenceBaseSchema.superRefine((evidence, context) => {
			checkAuthorityState(evidence, context);
			checkStateConfidence(evidence, context);
			checkTraceability(evidence, context);
			checkArtifactBacking(evidence, context);
		});
		applicationNodeIdentitySchema = z.discriminatedUnion("strategy", [
			z.strictObject({
				strategy: z.literal("content-digest"),
				stability: z.literal("global-exact"),
				sha256: digestSchema
			}),
			z.strictObject({
				strategy: z.literal("source-map-original"),
				stability: z.literal("source-map-exact"),
				source_map_sha256: digestSchema,
				original_source: z.string(),
				source_root: z.string().nullable(),
				source_sha256: digestSchema.nullable()
			}),
			z.strictObject({
				strategy: z.literal("canonical-path"),
				stability: z.literal("artifact-version"),
				artifact_sha256: digestSchema,
				path: relativePathSchema$2
			}),
			z.strictObject({
				strategy: z.literal("structural-fingerprint"),
				stability: z.literal("cross-version-inference"),
				algorithm: z.string().min(1),
				fingerprint_sha256: digestSchema,
				basis: z.array(z.enum([
					"syntax-tree",
					"control-flow",
					"imports",
					"exports",
					"literals",
					"api-usage"
				])).min(1)
			}),
			z.strictObject({
				strategy: z.literal("artifact-local-key"),
				stability: z.literal("artifact-version"),
				artifact_sha256: digestSchema,
				namespace: boundedKeySchema,
				key: z.string()
			}),
			z.strictObject({
				strategy: z.literal("runtime-instance"),
				stability: z.literal("capture-only"),
				capture_sha256: digestSchema,
				runtime_key: boundedTextSchema$4
			}),
			z.strictObject({
				strategy: z.literal("observation-fingerprint"),
				stability: z.literal("observation-only"),
				observation_sha256: digestSchema,
				scope: boundedTextSchema$4
			})
		]);
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptApplicationGraphSchemas.js
var boundedTextSchema$3, JAVASCRIPT_APPLICATION_NODE_KINDS, applicationNodeKindSchema, JAVASCRIPT_APPLICATION_RELATIONS, applicationRelationSchema, applicationPropertiesSchema, applicationNodeObservationBaseSchema, applicationNodeObservationInputSchema, applicationNodeObservationSchema, applicationNodeInputSchema, applicationNodeSchema, applicationEdgeInputSchema, applicationEdgeSchema, javascriptApplicationGraphInputSchema, javascriptApplicationGraphRecordSchema;
function init_javascriptApplicationGraphSchemas() {
	return (init_javascriptApplicationGraphSchemas = __esmMin((() => {
		init_javascriptSourceMapPaths();
		init_javascriptApplicationEvidenceSchemas();
		init_jsonValue();
		init_digests();
		boundedTextSchema$3 = z.string().min(1);
		JAVASCRIPT_APPLICATION_NODE_KINDS = [
			"package",
			"installer",
			"artifact",
			"asar-entry",
			"electron-main",
			"electron-preload",
			"electron-renderer",
			"electron-utility",
			"javascript-asset",
			"javascript-chunk",
			"javascript-module",
			"javascript-expression",
			"source-map",
			"source-module",
			"browser-window",
			"frame",
			"target",
			"context-bridge-api",
			"ipc-channel",
			"ipc-handler",
			"worker",
			"service-worker",
			"endpoint",
			"storage",
			"native-addon",
			"native-export",
			"managed-assembly",
			"managed-module",
			"managed-type",
			"managed-method",
			"managed-field",
			"managed-pinvoke-import",
			"managed-native-implementation",
			"runtime-script-instance",
			"unknown"
		];
		applicationNodeKindSchema = z.enum(JAVASCRIPT_APPLICATION_NODE_KINDS);
		JAVASCRIPT_APPLICATION_RELATIONS = [
			"contains",
			"loads",
			"imports",
			"maps_to",
			"exposes",
			"sends",
			"invokes",
			"handles",
			"calls",
			"accesses",
			"persists_to",
			"observed_as",
			"changed_from"
		];
		applicationRelationSchema = z.enum(JAVASCRIPT_APPLICATION_RELATIONS);
		applicationPropertiesSchema = z.record(z.string().min(1), jsonValueSchema);
		applicationNodeObservationBaseSchema = z.strictObject({
			label: z.string().min(1).nullable(),
			source_map_reference: javascriptSourceMapReferenceSchema.nullable(),
			properties: applicationPropertiesSchema,
			evidence: applicationGraphEvidenceSchema
		});
		applicationNodeObservationInputSchema = applicationNodeObservationBaseSchema.extend({ source_map_reference: javascriptSourceMapReferenceSchema.nullable().default(null) });
		applicationNodeObservationSchema = applicationNodeObservationBaseSchema.extend({
			observation_id: prefixedDigestSchema("jag_observation"),
			identifier_strategy: z.strictObject({
				strategy: z.literal("semantic-content-sha256"),
				stability: z.literal("observation-exact")
			})
		});
		applicationNodeInputSchema = z.strictObject({
			kind: applicationNodeKindSchema,
			identity: applicationNodeIdentitySchema,
			observations: z.array(applicationNodeObservationInputSchema).min(1)
		});
		applicationNodeSchema = z.strictObject({
			node_id: prefixedDigestSchema("jag_node"),
			kind: applicationNodeKindSchema,
			identity: applicationNodeIdentitySchema,
			observations: z.array(applicationNodeObservationSchema).min(1)
		});
		applicationEdgeInputSchema = z.strictObject({
			source_node_id: prefixedDigestSchema("jag_node"),
			target_node_id: prefixedDigestSchema("jag_node"),
			relation: applicationRelationSchema,
			properties: applicationPropertiesSchema,
			evidence: applicationGraphEvidenceSchema
		});
		applicationEdgeSchema = applicationEdgeInputSchema.extend({
			edge_id: prefixedDigestSchema("jag_edge"),
			identifier_strategy: z.strictObject({
				strategy: z.literal("semantic-content-sha256"),
				stability: z.literal("relationship-exact")
			})
		});
		javascriptApplicationGraphInputSchema = z.strictObject({
			schema: z.literal("JavaScriptApplicationGraph"),
			root_node_ids: z.array(prefixedDigestSchema("jag_node")).min(1),
			nodes: z.array(applicationNodeSchema).min(1),
			edges: z.array(applicationEdgeSchema),
			coverage: applicationCoverageSchema,
			limitations: z.array(boundedTextSchema$3)
		});
		javascriptApplicationGraphRecordSchema = javascriptApplicationGraphInputSchema.extend({ graph_id: prefixedDigestSchema("jag") });
	})))();
}

//#endregion
//#region dist/domain/referenceSourcePathIdentity.js
var createReferenceSourcePathLookup, isPortableAbsoluteReferenceTarget, decodeReferenceSourceModuleUrlPath;
function init_referenceSourcePathIdentity() {
	return (init_referenceSourcePathIdentity = __esmMin((() => {
		init_result();
		createReferenceSourcePathLookup = (paths) => {
			const exact = new Set(paths);
			const canonical = new Map();
			for (const path of exact) {
				const key = path.normalize("NFC");
				canonical.set(key, canonical.has(key) ? null : path);
			}
			const equivalent = (path) => canonical.get(path.normalize("NFC")) ?? undefined;
			const has = (path) => exact.has(path) || canonical.has(path.normalize("NFC"));
			const resolve = (path) => exact.has(path) ? path : equivalent(path);
			return {
				has,
				resolve,
				resolveCandidates: (candidates) => candidates.find((path) => exact.has(path)) ?? candidates.map(equivalent).find((path) => path !== undefined),
				resolveAncestor: (path) => {
					for (let candidate = path; candidate !== "." && candidate !== "/"; candidate = posix.dirname(candidate)) {
						const found = resolve(candidate);
						if (found !== undefined) return found;
					}
					return undefined;
				}
			};
		};
		isPortableAbsoluteReferenceTarget = (target) => target.startsWith("/") || /^[A-Za-z]:[\\/]/u.test(target) || /^\\\\[^\\/]+[\\/][^\\/]+/u.test(target);
		decodeReferenceSourceModuleUrlPath = (value) => {
			if (/%2f/iu.test(value)) return err("Historical module URL paths cannot contain percent-encoded slash bytes.");
			try {
				const decoded = decodeURIComponent(value);
				return decoded.includes("\0") ? err("The decoded historical module URL path contains NUL.") : ok(decoded);
			} catch (cause) {
				if (!(cause instanceof URIError)) throw cause;
				return err("The historical module URL path contains malformed percent encoding.");
			}
		};
	})))();
}

//#endregion
//#region dist/domain/referenceSourceGraph.js
function checkGraphInvariants$1(graph, context) {
	checkSortedUnique(graph.entries.map(({ path }) => path), "entries", context);
	for (const [index, entry] of graph.entries.entries()) checkSortedUnique(entry.classifications, `entries.${index}.classifications`, context);
	checkSortedUnique(graph.languages, "languages", context);
	checkSortedUnique(graph.manifests, "manifests", context);
	checkSortedUnique(graph.relationships.map(historicalSourceRelationshipKey), "relationships", context);
	checkSortedUnique(graph.parse_failures.map(historicalSourceParseFailureKey), "parse_failures", context);
	checkSortedUnique(graph.exclusions.map((exclusion) => `${exclusion.path}\u0000${exclusion.reason}\u0000${"pattern" in exclusion ? exclusion.pattern : ""}`), "exclusions", context);
	if (canonicalJson(graph.languages, "Reference source graph") !== canonicalJson(historicalSourceLanguages(graph.entries), "Reference source graph")) context.addIssue({
		code: "custom",
		message: "languages must be derived from file entries",
		path: ["languages"]
	});
	if (canonicalJson(graph.manifests, "Reference source graph") !== canonicalJson(historicalSourceManifests(graph.entries), "Reference source graph")) context.addIssue({
		code: "custom",
		message: "manifests must be derived from classified file entries",
		path: ["manifests"]
	});
	const paths = new Set(graph.entries.map(({ path }) => path));
	checkRelationships(graph, paths, context);
	checkSymlinks(graph, paths, context);
	checkCompleteInventory(graph, context);
}
var boundedTextSchema$2, relativePathSchema$1, classificationSchema, entryBaseShape, sourceFileBaseShape, sourceFileSchema, sourceDirectorySchema, symlinkTargetSchema, sourceSymlinkSchema, sourceEntrySchema, sourceRelationshipSchema, parseFailureSchema, exclusionSchema, vcsSchema, graphShape, historicalSourceGraphStructureSchema, historicalSourceGraphSchema, historicalSourceGraphInputSchema, historicalSourceManifestBaseSchema, historicalSourceInventoryHasPartialFacts, historicalSourceParseFailureKey, historicalSourceRelationshipKey, checkSortedUnique, historicalSourceLanguages, historicalSourceManifests, checkRelationships, checkSymlinks, checkCompleteInventory, rootCommitment, computeRootSha256, createHistoricalSourceGraph, parseHistoricalSourceGraph, computeHistoricalSourceGraphSha256, createHistoricalSourceManifest;
function init_referenceSourceGraph() {
	return (init_referenceSourceGraph = __esmMin((() => {
		init_comparisonSemantics();
		init_canonicalDigest();
		init_referenceSourcePathIdentity();
		init_unicodeCodePointOrder();
		init_digests();
		boundedTextSchema$2 = z.string().min(1);
		relativePathSchema$1 = z.string().min(1).refine((path) => !path.startsWith("/") && !path.includes("\0") && path.split("/").every((part) => part !== "" && part !== "." && part !== ".."), "Expected a normalized relative POSIX path without traversal");
		classificationSchema = z.enum([
			"source",
			"test",
			"config",
			"manifest",
			"generated",
			"vendor",
			"documentation",
			"unknown"
		]);
		entryBaseShape = {
			path: relativePathSchema$1,
			classifications: z.array(classificationSchema).min(1),
			limitations: z.array(boundedTextSchema$2),
			local_diagnostics: z.array(boundedTextSchema$2).exactOptional()
		};
		sourceFileBaseShape = {
			...entryBaseShape,
			kind: z.literal("file"),
			language: z.string().min(1).nullable()
		};
		sourceFileSchema = z.union([z.strictObject({
			...sourceFileBaseShape,
			sha256: digestSchema,
			size: z.int().min(0).max(Number.MAX_SAFE_INTEGER),
			content_state: z.literal("hashed")
		}), z.strictObject({
			...sourceFileBaseShape,
			sha256: z.null(),
			size: z.int().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
			content_state: z.enum([
				"redacted-secret",
				"excluded",
				"unreadable",
				"unknown"
			])
		})]);
		sourceDirectorySchema = z.strictObject({
			...entryBaseShape,
			kind: z.literal("directory"),
			tree_state: z.enum([
				"enumerated",
				"partial",
				"excluded",
				"unreadable",
				"unknown"
			])
		});
		symlinkTargetSchema = z.string().min(1).refine((target) => !target.includes("\0") && (isPortableAbsoluteReferenceTarget(target) || !target.startsWith("/") && posix.normalize(target) === target), "Expected a normalized POSIX symlink target");
		sourceSymlinkSchema = z.union([z.strictObject({
			...entryBaseShape,
			kind: z.literal("symlink"),
			target: symlinkTargetSchema,
			target_state: z.enum([
				"internal",
				"external",
				"missing"
			])
		}), z.strictObject({
			...entryBaseShape,
			kind: z.literal("symlink"),
			target: z.null(),
			target_state: z.enum(["unreadable", "unknown"])
		})]);
		sourceEntrySchema = z.union([
			sourceFileSchema,
			sourceDirectorySchema,
			sourceSymlinkSchema,
			z.strictObject({
				...entryBaseShape,
				kind: z.literal("unknown")
			})
		]);
		sourceRelationshipSchema = z.strictObject({
			from_path: relativePathSchema$1,
			to: z.string().min(1),
			source_specifier: z.string().min(1).exactOptional(),
			kind: z.enum([
				"imports",
				"requires",
				"references",
				"declares-module"
			]),
			resolution: z.enum([
				"internal",
				"external",
				"unresolved",
				"unknown"
			]),
			parse_state: z.enum([
				"parsed",
				"partial",
				"unknown"
			])
		});
		parseFailureSchema = z.strictObject({
			path: relativePathSchema$1,
			parser: z.string().min(1),
			reason: boundedTextSchema$2
		});
		exclusionSchema = z.discriminatedUnion("reason", [z.strictObject({
			path: relativePathSchema$1,
			entry_kind: z.enum([
				"file",
				"directory",
				"symlink",
				"other",
				"unknown"
			]).exactOptional(),
			reason: z.enum([
				"configured-secret",
				"project-ignored",
				"default-ignored",
				"caller-excluded"
			]),
			pattern: boundedTextSchema$2
		}), z.strictObject({
			path: relativePathSchema$1,
			entry_kind: z.enum([
				"file",
				"directory",
				"symlink",
				"other",
				"unknown"
			]).exactOptional(),
			reason: z.enum(["symlink-escape", "unreadable"])
		})]);
		vcsSchema = z.discriminatedUnion("kind", [
			z.strictObject({
				kind: z.literal("git"),
				head: z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u),
				dirty: z.boolean().nullable()
			}),
			z.strictObject({
				kind: z.literal("none"),
				head: z.null(),
				dirty: z.null()
			}),
			z.strictObject({
				kind: z.literal("unknown"),
				head: z.null(),
				dirty: z.null()
			})
		]).nullable();
		graphShape = {
			schema: z.literal("HistoricalSourceGraph"),
			authority: z.literal("historical-reference"),
			root_alias: z.literal("$REFERENCE_ROOT"),
			root_sha256: digestSchema,
			inventory_state: z.enum([
				"complete",
				"partial",
				"unknown"
			]),
			entries: z.array(sourceEntrySchema),
			relationships: z.array(sourceRelationshipSchema),
			parse_failures: z.array(parseFailureSchema),
			exclusions: z.array(exclusionSchema),
			languages: z.array(z.string().min(1)),
			manifests: z.array(relativePathSchema$1),
			vcs: vcsSchema,
			provenance: z.strictObject({
				importer: z.string().min(1),
				importer_version: z.string().min(1).nullable(),
				caller: z.string().min(1).regex(/^[\w .:@\x2f+\x2d]+$/u)
			}),
			limitations: z.array(boundedTextSchema$2)
		};
		historicalSourceGraphStructureSchema = z.strictObject(graphShape).superRefine(checkGraphInvariants$1);
		historicalSourceGraphSchema = historicalSourceGraphStructureSchema.superRefine((graph, context) => {
			if (computeRootSha256(graph.entries, graph.exclusions) !== graph.root_sha256) context.addIssue({
				code: "custom",
				message: "Historical source root commitment does not match entries",
				path: ["root_sha256"]
			});
		});
		historicalSourceGraphInputSchema = z.strictObject({
			...graphShape,
			root_sha256: z.never().optional()
		});
		historicalSourceManifestBaseSchema = z.strictObject({
			schema: z.literal("HistoricalSourceManifest"),
			authority: z.literal("historical-reference"),
			manifest_id: prefixedDigestSchema("hsm"),
			graph_sha256: digestSchema,
			root_sha256: digestSchema,
			inventory_state: z.enum([
				"complete",
				"partial",
				"unknown"
			]),
			entry_count: z.int().min(0).max(Number.MAX_SAFE_INTEGER),
			relationship_count: z.int().min(0).max(Number.MAX_SAFE_INTEGER)
		});
		historicalSourceInventoryHasPartialFacts = (input) => input.limitations.length > 0 || input.exclusions.length > 0 || input.parse_failures.length > 0 || input.entries.some((entry) => entry.limitations.length > 0 || entry.kind === "file" && entry.content_state !== "hashed" || entry.kind === "directory" && entry.tree_state !== "enumerated" || entry.kind === "symlink" && entry.target_state !== "internal" || entry.kind === "unknown") || input.relationships.some(({ parse_state, resolution }) => parse_state !== "parsed" || resolution === "unresolved" || resolution === "unknown");
		historicalSourceParseFailureKey = (failure) => `${failure.path}\u0000${failure.parser}\u0000${failure.reason}`;
		historicalSourceRelationshipKey = (relationship) => `${relationship.from_path}\u0000${relationship.to}\u0000${relationship.kind}\u0000${relationship.resolution}\u0000${relationship.parse_state}${relationship.source_specifier === undefined ? "" : `\u0000${relationship.source_specifier}`}`;
		checkSortedUnique = (values, field, context) => {
			for (let index = 1; index < values.length; index += 1) if (compareUnicodeCodePoints(values[index - 1] ?? "", values[index] ?? "") >= 0) {
				context.addIssue({
					code: "custom",
					message: `${field} must be sorted and unique by Unicode code point`,
					path: [field, index]
				});
				return;
			}
		};
		historicalSourceLanguages = (entries) => [...new Set(entries.flatMap((entry) => entry.kind === "file" && entry.language !== null ? [entry.language] : []))].sort(compareUnicodeCodePoints);
		historicalSourceManifests = (entries) => entries.flatMap((entry) => entry.kind === "file" && entry.classifications.includes("manifest") ? [entry.path] : []).sort(compareUnicodeCodePoints);
		checkRelationships = (graph, paths, context) => {
			const files = new Set(graph.entries.flatMap((entry) => entry.kind === "file" ? [entry.path] : []));
			for (const [index, relationship] of graph.relationships.entries()) {
				if (!files.has(relationship.from_path)) context.addIssue({
					code: "custom",
					message: "Relationship source must name an inventoried file",
					path: [
						"relationships",
						index,
						"from_path"
					]
				});
				if (relationship.resolution !== "internal") continue;
				const parsed = relativePathSchema$1.safeParse(relationship.to);
				if (!parsed.success || !paths.has(parsed.data)) context.addIssue({
					code: "custom",
					message: "Internal relationship target must be normalized and inventoried",
					path: [
						"relationships",
						index,
						"to"
					]
				});
			}
		};
		checkSymlinks = (graph, paths, context) => {
			const lookupPath = createReferenceSourcePathLookup(paths);
			const excludedPaths = createReferenceSourcePathLookup(graph.exclusions.map(({ path }) => path));
			const excludedKinds = new Map();
			for (const { path, entry_kind } of graph.exclusions) {
				const kinds = excludedKinds.get(path) ?? new Set();
				kinds.add(entry_kind);
				excludedKinds.set(path, kinds);
			}
			for (const [index, entry] of graph.entries.entries()) {
				if (entry.kind !== "symlink") continue;
				if (entry.target === null) continue;
				const resolved = posix.normalize(posix.join(posix.dirname(entry.path), entry.target));
				const escapesRoot = resolved.startsWith("../") || resolved === "..";
				const inventoried = resolved === "." || lookupPath.resolve(resolved) !== undefined;
				const exactExcluded = excludedPaths.resolve(resolved);
				let excluded = exactExcluded !== undefined;
				for (let candidate = posix.dirname(resolved); candidate !== "." && candidate !== "/"; candidate = posix.dirname(candidate)) {
					const excludedAncestor = excludedPaths.resolve(candidate);
					if (excludedAncestor === undefined) continue;
					const kinds = excludedKinds.get(excludedAncestor);
					if (kinds?.size !== 1 || !kinds.has("directory")) {
						excluded = false;
						break;
					}
					excluded = true;
				}
				const ownedRelativeTarget = !entry.target.startsWith("/") && !escapesRoot && inventoried;
				const absolute = isPortableAbsoluteReferenceTarget(entry.target) && !(entry.target_state === "internal" && ownedRelativeTarget);
				if (entry.target_state === "external" && !absolute || entry.target_state === "internal" && absolute) context.addIssue({
					code: "custom",
					message: "Symlink target path does not match its target state",
					path: [
						"entries",
						index,
						"target"
					]
				});
				if (entry.target_state !== "internal") continue;
				if (escapesRoot || !inventoried && !excluded) context.addIssue({
					code: "custom",
					message: "Internal symlink target must resolve to an inventoried entry or a recorded exclusion",
					path: [
						"entries",
						index,
						"target"
					]
				});
			}
		};
		checkCompleteInventory = (graph, context) => {
			if (graph.inventory_state !== "complete" || !historicalSourceInventoryHasPartialFacts(graph)) return;
			context.addIssue({
				code: "custom",
				message: "Complete inventory cannot contain partial states, exclusions, failures, or limitations",
				path: ["inventory_state"]
			});
		};
		rootCommitment = (entries, exclusions) => ({
			entries: entries.map((entry) => {
				switch (entry.kind) {
					case "file": return {
						kind: entry.kind,
						path: entry.path,
						sha256: entry.sha256,
						size: entry.size,
						content_state: entry.content_state
					};
					case "directory": return {
						kind: entry.kind,
						path: entry.path,
						tree_state: entry.tree_state
					};
					case "symlink": return {
						kind: entry.kind,
						path: entry.path,
						target: entry.target,
						target_state: entry.target_state
					};
					case "unknown": return {
						kind: entry.kind,
						path: entry.path
					};
				}
			}),
			exclusions
		});
		computeRootSha256 = (entries, exclusions) => digestCanonicalValue(rootCommitment(entries, exclusions), "Reference source graph");
		createHistoricalSourceGraph = (input) => {
			const parsed = historicalSourceGraphInputSchema.parse(input);
			return historicalSourceGraphSchema.parse({
				...parsed,
				root_sha256: computeRootSha256(parsed.entries, parsed.exclusions)
			});
		};
		parseHistoricalSourceGraph = (input) => historicalSourceGraphSchema.parse(input);
		computeHistoricalSourceGraphSha256 = (graph) => digestCanonicalValue({
			...graph,
			entries: graph.entries.map(({ local_diagnostics: _local, ...entry }) => entry)
		}, "Reference source graph");
		createHistoricalSourceManifest = (input) => {
			const graph = parseHistoricalSourceGraph(input);
			const semantic = {
				schema: "HistoricalSourceManifest",
				authority: "historical-reference",
				graph_sha256: computeHistoricalSourceGraphSha256(graph),
				root_sha256: graph.root_sha256,
				inventory_state: graph.inventory_state,
				entry_count: graph.entries.length,
				relationship_count: graph.relationships.length
			};
			return historicalSourceManifestBaseSchema.parse({
				...semantic,
				manifest_id: `hsm_${digestCanonicalValue(semantic, "Reference source graph")}`
			});
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/sourceToBundleComparisonSchemas.js
var evidenceIdSchema$6, nodeIdSchema$3, textSchema$4, SOURCE_TO_BUNDLE_SIGNAL_WEIGHTS, sourceToBundleSignalKindSchema, compareSourceToBundleInputSchema, sourceToBundleSignalSchema, sourceToBundleCandidateSchema, sourceToBundleItemSchema, sourceToBundleComparisonResultSchema;
function init_sourceToBundleComparisonSchemas() {
	return (init_sourceToBundleComparisonSchemas = __esmMin((() => {
		init_javascriptArtifactFiles();
		init_evidence();
		init_javascriptApplicationGraphSchemas();
		init_referenceSourceGraph();
		init_digests();
		evidenceIdSchema$6 = prefixedDigestSchema("ev");
		nodeIdSchema$3 = prefixedDigestSchema("jag_node");
		textSchema$4 = z.string().min(1);
		SOURCE_TO_BUNDLE_SIGNAL_WEIGHTS = [
			["exact-source-digest", 100],
			["source-map-original-path", 70],
			["current-path-exact", 60],
			["current-path-suffix", 40],
			["unicode-equivalent-path", 20],
			["basename-match", 20],
			["language-extension", 5]
		];
		sourceToBundleSignalKindSchema = z.enum([
			"exact-source-digest",
			"source-map-original-path",
			"current-path-exact",
			"current-path-suffix",
			"unicode-equivalent-path",
			"basename-match",
			"language-extension"
		]);
		compareSourceToBundleInputSchema = z.strictObject({
			reference: historicalSourceGraphSchema,
			application: evidenceSchema
		});
		sourceToBundleSignalSchema = z.strictObject({
			kind: sourceToBundleSignalKindSchema,
			weight: z.int().min(1).max(100),
			source_value: textSchema$4,
			current_values: z.array(textSchema$4).min(1)
		});
		sourceToBundleCandidateSchema = z.strictObject({
			current_file_occurrence: javaScriptFileOccurrenceSchema.exactOptional(),
			representation_node_ids: z.array(nodeIdSchema$3).min(1).exactOptional(),
			current_node_id: nodeIdSchema$3,
			current_node_kind: z.enum(JAVASCRIPT_APPLICATION_NODE_KINDS),
			score: z.int().min(1),
			confidence: z.enum([
				"exact",
				"high",
				"medium",
				"low"
			]),
			signals: z.array(sourceToBundleSignalSchema).min(1)
		});
		sourceToBundleItemSchema = z.strictObject({
			mapping_id: prefixedDigestSchema("stbc_item"),
			source_path: textSchema$4,
			source_sha256: digestSchema.nullable(),
			source_language: textSchema$4.nullable(),
			status: z.enum([
				"unchanged",
				"modified",
				"removed",
				"split",
				"merged",
				"duplicated",
				"unknown"
			]),
			confidence: z.enum([
				"exact",
				"high",
				"medium",
				"unknown"
			]),
			current_node_ids: z.array(nodeIdSchema$3),
			candidates: z.array(sourceToBundleCandidateSchema),
			limitations: z.array(textSchema$4)
		});
		sourceToBundleComparisonResultSchema = z.strictObject({
			comparison_id: prefixedDigestSchema("stbc"),
			reference: z.strictObject({
				root_sha256: digestSchema,
				inventory_state: z.enum([
					"complete",
					"partial",
					"unknown"
				])
			}),
			application: z.strictObject({
				evidence_id: evidenceIdSchema$6,
				graph_id: prefixedDigestSchema("jag"),
				root_artifact_sha256: digestSchema
			}),
			scoring: z.strictObject({
				algorithm: z.literal("rea-source-to-bundle-signals"),
				minimum_candidate_score: z.literal(20),
				weights: z.array(z.strictObject({
					signal: sourceToBundleSignalKindSchema,
					weight: z.int().min(1).max(100)
				}))
			}),
			summary: z.strictObject({
				unchanged: z.int().min(0),
				modified: z.int().min(0),
				removed: z.int().min(0),
				split: z.int().min(0),
				merged: z.int().min(0),
				duplicated: z.int().min(0),
				unknown: z.int().min(0)
			}),
			items: z.array(sourceToBundleItemSchema),
			unmapped_current_node_ids: z.array(nodeIdSchema$3),
			coverage: z.strictObject({
				status: z.enum(["complete-within-inputs", "partial"]),
				reference_inventory_state: z.enum([
					"complete",
					"partial",
					"unknown"
				]),
				application_graph_status: z.enum([
					"complete",
					"partial",
					"unknown",
					"unavailable"
				]),
				retained_source_files: z.int().min(0),
				retained_application_nodes: z.int().min(0),
				candidate_evaluations: z.int().min(0)
			}),
			evidence_links: z.array(evidenceIdSchema$6).length(1),
			limitations: z.array(textSchema$4)
		});
	})))();
}

//#endregion
//#region dist/domain/stringPatterns.js
var IDENTIFIER_PATTERN, STABLE_IDENTIFIER_PATTERN, BASE64_QUARTET_LENGTH_PATTERN, INVALID_BASE64_CHARACTER_PATTERN, INVALID_BASE64_PADDING_PATTERN, INVALID_CANONICAL_BASE64_PAD_BITS_PATTERN, isPaddedBase64, isCanonicalBase64, paddedBase64SchemaRules, canonicalBase64Schema;
function init_stringPatterns() {
	return (init_stringPatterns = __esmMin((() => {
		IDENTIFIER_PATTERN = /^[A-Za-z][A-Za-z0-9._\x2d]*$/u;
		STABLE_IDENTIFIER_PATTERN = /^[A-Za-z][A-Za-z0-9._:\x2f\x2d]*$/u;
		BASE64_QUARTET_LENGTH_PATTERN = /^(?:....)*$/;
		INVALID_BASE64_CHARACTER_PATTERN = /[^A-Za-z0-9+\x2f=]/;
		INVALID_BASE64_PADDING_PATTERN = /(?:=[^=]|===)/;
		INVALID_CANONICAL_BASE64_PAD_BITS_PATTERN = /(?:[^AQgw]==$|[BCDFGHJKLNOPRSTVWXZabdefhijlmnpqrtuvxyz1235679+\x2f]=$)/;
		isPaddedBase64 = (value) => value.length % 4 === 0 && !INVALID_BASE64_CHARACTER_PATTERN.test(value) && !INVALID_BASE64_PADDING_PATTERN.test(value);
		isCanonicalBase64 = (value) => isPaddedBase64(value) && !INVALID_CANONICAL_BASE64_PAD_BITS_PATTERN.test(value);
		paddedBase64SchemaRules = [
			{ pattern: BASE64_QUARTET_LENGTH_PATTERN.source },
			{ not: { pattern: INVALID_BASE64_CHARACTER_PATTERN.source } },
			{ not: { pattern: INVALID_BASE64_PADDING_PATTERN.source } }
		];
		canonicalBase64Schema = z.string().refine(isCanonicalBase64, {
			message: "Expected canonical padded base64",
			abort: true
		}).meta({ allOf: [...paddedBase64SchemaRules, { not: { pattern: INVALID_CANONICAL_BASE64_PAD_BITS_PATTERN.source } }] });
	})))();
}

//#endregion
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
//#region dist/domain/artifactFormatMetadata.js
var offset, uint32, godotPckMetadataSchema, godotPckEntryMetadataSchema, pyInstallerMetadataSchema, pyInstallerEntryMetadataSchema, nodeSeaMetadataSchema, nodeSeaEntryMetadataSchema, pyInstallerEntryDeclaration, artifactFormatMetadataSchema;
function init_artifactFormatMetadata() {
	return (init_artifactFormatMetadata = __esmMin((() => {
		offset = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
		uint32 = z.number().int().min(0).max(4294967295);
		godotPckMetadataSchema = z.strictObject({
			kind: z.literal("godot-pck"),
			format_version: uint32,
			engine_major: uint32,
			engine_minor: uint32,
			engine_patch: uint32,
			pack_start: offset,
			pack_end: offset,
			embedded: z.boolean(),
			pack_flags: uint32,
			file_base: offset,
			directory_start: offset,
			declared_file_count: uint32,
			directory_status: z.enum([
				"available",
				"encrypted",
				"sparse-bundle"
			])
		});
		godotPckEntryMetadataSchema = z.strictObject({
			kind: z.literal("godot-pck-entry"),
			index: uint32,
			source_path: z.string(),
			declared_offset: offset,
			flags: uint32,
			md5_status: z.enum(["declared", "all-zero"])
		});
		pyInstallerMetadataSchema = z.strictObject({
			kind: z.literal("pyinstaller"),
			layout_version: z.enum(["2.0", "2.1"]),
			archive_start: offset,
			archive_size: offset,
			cookie_offset: offset,
			toc_offset: offset,
			toc_size: offset,
			entry_count: offset,
			runtime_option_count: offset,
			external_dependency_count: offset,
			python_version_raw: uint32,
			python_major: uint32.nullable(),
			python_minor: uint32.nullable(),
			python_library: z.string().nullable(),
			encryption_marker_present: z.boolean()
		});
		pyInstallerEntryMetadataSchema = z.strictObject({
			kind: z.literal("pyinstaller-entry"),
			container: z.enum(["carchive", "pyz"]),
			container_name: z.string().nullable(),
			index: offset,
			source_name: z.string(),
			type_code: z.union([z.string().length(1), uint32]),
			relative_offset: offset,
			directory_record_offset: offset.nullable(),
			directory_record_size: offset.nullable(),
			compression_flag: z.union([z.literal(0), z.literal(1)]),
			bytecode_header: z.enum([
				"not-bytecode",
				"unknown",
				"derived"
			]),
			bytecode_magic: z.string().regex(/^[0-9a-f]{8}$/u).nullable(),
			pyz_status: z.enum([
				"not-pyz",
				"decoded",
				"opaque"
			]),
			pyz_sha256: z.string().regex(/^[0-9a-f]{64}$/u).nullable(),
			pyz_python_magic: z.string().regex(/^[0-9a-f]{8}$/u).nullable(),
			pyz_python_version: z.string().nullable(),
			pyz_entry_count: offset.nullable(),
			encryption_source: z.literal("carchive-marker").nullable(),
			dependency_status: z.enum(["unresolved", "invalid-reference"]).exactOptional(),
			dependency_archive: z.string().nullable().exactOptional(),
			dependency_member: z.string().nullable().exactOptional()
		});
		nodeSeaMetadataSchema = z.strictObject({
			kind: z.literal("node-sea"),
			magic: z.literal(21223968),
			flags: uint32,
			disable_experimental_sea_warning: z.boolean(),
			use_snapshot: z.boolean(),
			use_code_cache: z.boolean(),
			include_assets: z.boolean(),
			include_exec_argv: z.boolean(),
			exec_argv_extension: z.enum([
				"none",
				"env",
				"cli"
			]),
			exec_argv: z.array(z.string()),
			code_path: z.string(),
			carrier: z.enum([
				"mach-o",
				"elf",
				"pe"
			]),
			blob_offset: offset,
			blob_length: offset,
			fuse_state: z.enum([
				"set",
				"unset",
				"absent",
				"conflicting"
			]),
			fuse_sentinel: z.string().nullable(),
			fuse_contradiction: z.string().nullable()
		});
		nodeSeaEntryMetadataSchema = z.strictObject({
			kind: z.literal("node-sea-entry"),
			role: z.enum([
				"main-script",
				"snapshot",
				"code-cache",
				"asset"
			]),
			source_path: z.string(),
			index: uint32
		});
		pyInstallerEntryDeclaration = (metadata) => ({
			container: metadata.container,
			container_name: metadata.container_name,
			source_name: metadata.source_name,
			type_code: metadata.type_code
		});
		artifactFormatMetadataSchema = z.discriminatedUnion("kind", [
			godotPckMetadataSchema,
			godotPckEntryMetadataSchema,
			pyInstallerMetadataSchema,
			pyInstallerEntryMetadataSchema,
			nodeSeaMetadataSchema,
			nodeSeaEntryMetadataSchema
		]);
	})))();
}

//#endregion
//#region dist/domain/artifactGraph.js
var artifactTraversalOmissionKindSchema, sha256Schema, artifactIdSchema$1, occurrenceIdSchema, edgeIdSchema$1, manifestIdSchema, extractionIdSchema, contradictionIdSchema, boundedRelativePathSchema, artifactKindSchema, artifactFormatSchema, artifactContentFormatSchema, artifactByteRangeSchema, artifactCommandSchema, artifactNodeSchema, artifactOccurrenceSchema, integrityContradictionBaseSchema, integrityContradictionSchema, artifactEdgeSchema, artifactGraphManifestSchema, artifactInventoryCoverageSchema, artifactInventoryResultSchema, extractedArtifactSchema, artifactExtractionManifestSchema, artifactExtractionResultSchema;
function init_artifactGraph() {
	return (init_artifactGraph = __esmMin((() => {
		init_artifactIntegrity();
		init_artifactFormatMetadata();
		init_digests();
		artifactTraversalOmissionKindSchema = z.enum([
			"fifo",
			"socket",
			"block-device",
			"character-device",
			"unsupported",
			"directory-descendants"
		]);
		sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u);
		artifactIdSchema$1 = prefixedDigestSchema("art");
		occurrenceIdSchema = prefixedDigestSchema("occ");
		edgeIdSchema$1 = prefixedDigestSchema("edge");
		manifestIdSchema = prefixedDigestSchema("agm");
		extractionIdSchema = prefixedDigestSchema("aex");
		contradictionIdSchema = prefixedDigestSchema("ic");
		boundedRelativePathSchema = z.string().min(1).refine((path) => !path.startsWith("/") && path.split("/").every((part) => part !== "" && part !== ".."), "Expected a normalized relative POSIX path without traversal");
		artifactKindSchema = z.enum([
			"container",
			"executable",
			"dynamic-library",
			"framework",
			"native-addon",
			"javascript",
			"source-map",
			"plist",
			"entitlements",
			"resource",
			"universal-slice",
			"package-metadata",
			"unknown"
		]);
		artifactFormatSchema = z.enum([
			"dmg",
			"zip",
			"pkg",
			"asar",
			"godot-pck",
			"javascript-bundle",
			"source-map",
			"mach-o-universal",
			"mach-o",
			"elf",
			"pe",
			"dos-mz",
			"dos-com",
			"raw-binary",
			"gamecube-dol",
			"hopper",
			"analysis-database",
			"ipa",
			"apk",
			"msix",
			"appx",
			"hap",
			"hsp",
			"app-pack",
			"plist",
			"entitlements",
			"directory",
			"file",
			"pyinstaller",
			"node-sea",
			"unknown"
		]);
		artifactContentFormatSchema = artifactFormatSchema.extract([
			"zip",
			"godot-pck",
			"mach-o-universal",
			"mach-o",
			"elf",
			"pe",
			"dos-mz",
			"plist",
			"directory",
			"file",
			"unknown"
		]);
		artifactByteRangeSchema = z.object({
			offset: z.int().min(0),
			length: z.int().min(0)
		});
		artifactCommandSchema = z.object({
			tool: z.string().min(1),
			arguments: z.array(z.string()),
			tool_version: z.string().nullable(),
			executable_sha256: sha256Schema.nullable(),
			exit_code: z.int().nullable(),
			effects: z.array(z.enum([
				"read",
				"write",
				"mount"
			]))
		});
		artifactNodeSchema = z.object({
			artifact_id: artifactIdSchema$1,
			format: artifactContentFormatSchema,
			sha256: sha256Schema,
			size: z.int().min(0).max(Number.MAX_SAFE_INTEGER),
			media_type: z.string().min(1).nullable(),
			architecture: z.string().min(1).nullable(),
			content_state: z.enum([
				"materialized",
				"embedded",
				"virtual"
			]),
			limitations: z.array(z.string())
		});
		artifactOccurrenceSchema = z.object({
			occurrence_id: occurrenceIdSchema,
			artifact_id: artifactIdSchema$1.nullable(),
			parent_occurrence_id: occurrenceIdSchema.nullable(),
			logical_path: boundedRelativePathSchema,
			entry_kind: z.enum([
				"file",
				"directory",
				"symlink",
				"slice",
				"metadata"
			]),
			artifact_kind: artifactKindSchema,
			artifact_format: artifactFormatSchema,
			declared_size: z.int().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
			compressed_size: z.int().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
			executable: z.boolean(),
			encrypted: z.boolean(),
			/** Positive ASAR companion declaration; older inventories may not record it. */
			unpacked: z.literal(true).exactOptional(),
			hash_status: z.enum([
				"verified",
				"mismatched",
				"not-hashed",
				"unavailable"
			]),
			source_location: artifactByteRangeSchema.nullable(),
			/** Exact reader-source path or opaque key, including an observed empty key. */
			source_path: z.string().exactOptional(),
			declared_integrity: artifactIntegrityClaimSchema.exactOptional(),
			format_metadata: artifactFormatMetadataSchema.exactOptional(),
			limitations: z.array(z.string())
		});
		integrityContradictionBaseSchema = z.object({
			contradiction_id: contradictionIdSchema,
			occurrence_id: occurrenceIdSchema,
			parent_artifact_id: artifactIdSchema$1,
			logical_path: boundedRelativePathSchema,
			entry_kind: z.enum(["file", "slice"]),
			unpacked: z.boolean(),
			trust: z.literal("observed-untrusted"),
			provenance: z.literal("container-integrity-metadata-versus-observed-bytes"),
			limitations: z.array(z.string()).min(1)
		});
		integrityContradictionSchema = z.union([integrityContradictionBaseSchema.extend(artifactSha256PairSchema.shape), integrityContradictionBaseSchema.extend(artifactMd5PairSchema.shape)]);
		artifactEdgeSchema = z.object({
			edge_id: edgeIdSchema$1,
			ordinal: z.int().min(0),
			parent_artifact_id: artifactIdSchema$1,
			relation: z.enum([
				"contains",
				"extracts",
				"slice-of",
				"embeds",
				"loads",
				"maps-source",
				"derived-from"
			]),
			occurrence_id: occurrenceIdSchema,
			producer: artifactCommandSchema.nullable()
		});
		artifactGraphManifestSchema = z.object({
			manifest_id: manifestIdSchema,
			root_artifact_id: artifactIdSchema$1,
			root_sha256: sha256Schema,
			root_format: artifactFormatSchema,
			graph_sha256: sha256Schema,
			node_count: z.int().min(1),
			occurrence_count: z.int().min(1),
			edge_count: z.int().min(0)
		});
		artifactInventoryCoverageSchema = z.strictObject({
			scope: z.enum(["root", "container-entries"]),
			status: z.enum(["complete", "unknown"])
		});
		artifactInventoryResultSchema = z.strictObject({
			manifest: artifactGraphManifestSchema,
			nodes: z.array(artifactNodeSchema),
			occurrences: z.array(artifactOccurrenceSchema),
			edges: z.array(artifactEdgeSchema),
			provenance: z.array(artifactCommandSchema),
			integrity_contradictions: z.array(integrityContradictionSchema),
			coverage: artifactInventoryCoverageSchema,
			limitations: z.array(z.string())
		});
		extractedArtifactSchema = z.object({
			artifact_id: artifactIdSchema$1,
			relative_path: boundedRelativePathSchema,
			sha256: sha256Schema,
			bytes_written: z.int().min(0).max(Number.MAX_SAFE_INTEGER),
			created: z.boolean()
		});
		artifactExtractionManifestSchema = z.object({
			extraction_id: extractionIdSchema,
			source_manifest_id: manifestIdSchema,
			selected_occurrence_ids: z.array(occurrenceIdSchema),
			files_sha256: sha256Schema,
			output_root_alias: z.literal("$OUTPUT_ROOT")
		});
		artifactExtractionResultSchema = z.object({
			manifest: artifactGraphManifestSchema,
			extraction_manifest: artifactExtractionManifestSchema,
			output_root: z.string().min(1),
			artifacts: z.array(extractedArtifactSchema),
			containment_verified: z.boolean(),
			cleanup: z.object({
				attempted: z.boolean(),
				verified: z.boolean(),
				residual_paths: z.array(boundedRelativePathSchema)
			}),
			coverage: artifactInventoryCoverageSchema,
			provenance: z.array(artifactCommandSchema),
			integrity_contradictions: z.array(integrityContradictionSchema),
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticGraphSchemas.js
var boundedTextSchema$1, semanticNodeIdSchema$1, semanticRelationIdSchema, semanticUnknownIdSchema, semanticEvidenceContextIdSchema, javaScriptSemanticEvidenceContextSchema, javaScriptSemanticEvidenceReferenceSchema, JAVASCRIPT_SEMANTIC_NODE_KINDS, JAVASCRIPT_SEMANTIC_RELATION_FAMILIES, JAVASCRIPT_SEMANTIC_RELATIONS, JAVASCRIPT_SEMANTIC_RELATION_FAMILY, relativePathSchema, semanticPropertiesSchema, semanticNodeIdentitySchema, javaScriptSemanticNodeInputSchema, javaScriptSemanticNodeSchema, javaScriptSemanticRelationInputSchema, javaScriptSemanticRelationSchema, JAVASCRIPT_SEMANTIC_UNKNOWN_REASONS, javaScriptSemanticUnknownOmissionSchema, javaScriptSemanticUnknownOmissionsSchema, javaScriptSemanticUnknownInputSchema, javaScriptSemanticUnknownSchema, fingerprintComponentsSchema, javaScriptSemanticFingerprintInputSchema, javaScriptSemanticFingerprintSchema, familyCoverageSchema, graphCoverageSchema, javaScriptSemanticGraphInputSchema, javaScriptSemanticGraphRecordSchema;
function init_javascriptSemanticGraphSchemas() {
	return (init_javascriptSemanticGraphSchemas = __esmMin((() => {
		init_javascriptSourceCoordinates();
		init_javascriptApplicationEvidenceSchemas();
		init_jsonValue();
		init_digests();
		boundedTextSchema$1 = z.string().min(1);
		semanticNodeIdSchema$1 = prefixedDigestSchema("jsrg_node");
		semanticRelationIdSchema = z.string().regex(/^jsrg_relation_[a-f0-9]{64}$/u);
		semanticUnknownIdSchema = z.string().regex(/^jsrg_unknown_[a-f0-9]{64}$/u);
		semanticEvidenceContextIdSchema = z.string().regex(/^jsrg_evidence_[a-f0-9]{64}$/u);
		javaScriptSemanticEvidenceContextSchema = applicationGraphEvidenceContextSchema.extend({ context_id: semanticEvidenceContextIdSchema });
		javaScriptSemanticEvidenceReferenceSchema = z.strictObject({
			context_id: semanticEvidenceContextIdSchema,
			location: applicationGraphEvidenceLocationSchema
		});
		JAVASCRIPT_SEMANTIC_NODE_KINDS = [
			"module",
			"function",
			"parameter",
			"binding",
			"expression",
			"literal",
			"property-slot",
			"call-site",
			"return-site",
			"closure-capture",
			"promise",
			"task",
			"event",
			"listener",
			"timer",
			"child-process",
			"stdio",
			"signal",
			"config-source",
			"request",
			"response",
			"boundary",
			"resource",
			"unknown-frontier"
		];
		JAVASCRIPT_SEMANTIC_RELATION_FAMILIES = [
			"boundary",
			"call-flow",
			"child-process",
			"closure",
			"configuration",
			"data-flow",
			"event",
			"object-flow",
			"promise-ownership",
			"request",
			"resource-lifecycle",
			"timer"
		];
		JAVASCRIPT_SEMANTIC_RELATIONS = [
			"acquires",
			"aggregates",
			"aliases",
			"argument-to-parameter",
			"awaits",
			"calls",
			"cancels-timer",
			"captures",
			"chains",
			"coerces",
			"connects-stdio",
			"consumed-by",
			"constructs-request",
			"creates-promise",
			"defaults",
			"defines",
			"destructures",
			"detaches-task",
			"dispatches-candidate",
			"forwards-signal",
			"listens-error",
			"listens-exit",
			"owns",
			"overrides",
			"parses",
			"reads",
			"reads-argv",
			"reads-config",
			"reads-environment",
			"reads-property",
			"registers-listener",
			"releases",
			"removes-listener",
			"returns-task",
			"returns-to-call",
			"schedules-timer",
			"spawns",
			"spreads",
			"supplies-argv",
			"supplies-env",
			"supplies-request-field",
			"validates",
			"writes",
			"writes-property"
		];
		JAVASCRIPT_SEMANTIC_RELATION_FAMILY = {
			acquires: "resource-lifecycle",
			aggregates: "promise-ownership",
			aliases: "data-flow",
			"argument-to-parameter": "call-flow",
			awaits: "promise-ownership",
			calls: "call-flow",
			"cancels-timer": "timer",
			captures: "closure",
			chains: "promise-ownership",
			coerces: "boundary",
			"connects-stdio": "child-process",
			"consumed-by": "request",
			"constructs-request": "request",
			"creates-promise": "promise-ownership",
			defaults: "configuration",
			defines: "data-flow",
			destructures: "object-flow",
			"detaches-task": "promise-ownership",
			"dispatches-candidate": "event",
			"forwards-signal": "child-process",
			"listens-error": "child-process",
			"listens-exit": "child-process",
			owns: "promise-ownership",
			overrides: "configuration",
			parses: "boundary",
			reads: "data-flow",
			"reads-argv": "configuration",
			"reads-config": "configuration",
			"reads-environment": "configuration",
			"reads-property": "object-flow",
			"registers-listener": "event",
			releases: "resource-lifecycle",
			"removes-listener": "event",
			"returns-task": "promise-ownership",
			"returns-to-call": "call-flow",
			"schedules-timer": "timer",
			spawns: "child-process",
			spreads: "object-flow",
			"supplies-argv": "child-process",
			"supplies-env": "child-process",
			"supplies-request-field": "request",
			validates: "boundary",
			writes: "data-flow",
			"writes-property": "object-flow"
		};
		relativePathSchema = z.string().min(1).refine((path) => !path.startsWith("/") && path.split("/").every((part) => ![
			"",
			".",
			".."
		].includes(part)), "Expected a normalized relative POSIX path without traversal");
		semanticPropertiesSchema = z.record(z.string().min(1), jsonValueSchema);
		semanticNodeIdentitySchema = z.strictObject({
			artifact_sha256: digestSchema,
			module_path: relativePathSchema,
			source_range: javascriptSourceRangeSchema.nullable(),
			role_key: z.string().min(1)
		});
		javaScriptSemanticNodeInputSchema = z.strictObject({
			kind: z.enum(JAVASCRIPT_SEMANTIC_NODE_KINDS),
			identity: semanticNodeIdentitySchema,
			function_node_id: semanticNodeIdSchema$1.nullable(),
			application_node_ids: z.array(prefixedDigestSchema("jag_node")),
			label: z.string().min(1).nullable(),
			properties: semanticPropertiesSchema,
			evidence: applicationGraphEvidenceSchema
		});
		javaScriptSemanticNodeSchema = javaScriptSemanticNodeInputSchema.extend({
			evidence: javaScriptSemanticEvidenceReferenceSchema,
			node_id: semanticNodeIdSchema$1.describe("SHA-256 of the node kind and identity; stable for one artifact version.")
		});
		javaScriptSemanticRelationInputSchema = z.strictObject({
			source_node_id: semanticNodeIdSchema$1,
			target_node_id: semanticNodeIdSchema$1,
			relation: z.enum(JAVASCRIPT_SEMANTIC_RELATIONS),
			resolution: z.enum(["resolved", "candidate"]),
			properties: semanticPropertiesSchema,
			evidence: applicationGraphEvidenceSchema
		});
		javaScriptSemanticRelationSchema = javaScriptSemanticRelationInputSchema.extend({
			evidence: javaScriptSemanticEvidenceReferenceSchema,
			relation_id: semanticRelationIdSchema.describe("SHA-256 of the exact relation content, including its evidence reference.")
		});
		JAVASCRIPT_SEMANTIC_UNKNOWN_REASONS = [
			"ambiguous-target",
			"bound-reached",
			"dynamic-call",
			"dynamic-property",
			"dynamic-scope",
			"eval-or-generated-code",
			"incomplete-module",
			"missing-source",
			"resource-limit",
			"unknown-value",
			"unsupported-syntax"
		];
		javaScriptSemanticUnknownOmissionSchema = z.strictObject({
			family: z.enum(JAVASCRIPT_SEMANTIC_RELATION_FAMILIES),
			reason: z.enum(JAVASCRIPT_SEMANTIC_UNKNOWN_REASONS),
			occurrences: z.int().positive()
		});
		javaScriptSemanticUnknownOmissionsSchema = z.array(javaScriptSemanticUnknownOmissionSchema).min(1).max(JAVASCRIPT_SEMANTIC_RELATION_FAMILIES.length * JAVASCRIPT_SEMANTIC_UNKNOWN_REASONS.length);
		javaScriptSemanticUnknownInputSchema = z.strictObject({
			node_id: semanticNodeIdSchema$1.nullable(),
			family: z.enum(JAVASCRIPT_SEMANTIC_RELATION_FAMILIES),
			relation_kinds: z.array(z.enum(JAVASCRIPT_SEMANTIC_RELATIONS)).min(1),
			reason: z.enum(JAVASCRIPT_SEMANTIC_UNKNOWN_REASONS),
			detail: boundedTextSchema$1,
			candidate_node_ids: z.array(semanticNodeIdSchema$1),
			evidence: applicationGraphEvidenceSchema
		});
		javaScriptSemanticUnknownSchema = javaScriptSemanticUnknownInputSchema.extend({
			evidence: javaScriptSemanticEvidenceReferenceSchema,
			unknown_id: semanticUnknownIdSchema
		});
		fingerprintComponentsSchema = z.strictObject({
			parameter_arity: z.int().min(0),
			normalized_ast_sha256: digestSchema,
			control_flow_sha256: digestSchema,
			relation_shape_sha256: digestSchema,
			literal_set_sha256: digestSchema,
			effects: z.array(z.enum([
				"async",
				"child-process",
				"event",
				"network",
				"promise",
				"resource",
				"timer"
			]))
		});
		javaScriptSemanticFingerprintInputSchema = z.strictObject({
			function_node_id: semanticNodeIdSchema$1,
			algorithm: z.literal("rea.javascript-semantic-function"),
			status: z.enum([
				"complete",
				"partial",
				"unavailable"
			]),
			components: fingerprintComponentsSchema,
			limitations: z.array(boundedTextSchema$1),
			evidence: applicationGraphEvidenceSchema
		});
		javaScriptSemanticFingerprintSchema = javaScriptSemanticFingerprintInputSchema.extend({
			evidence: javaScriptSemanticEvidenceReferenceSchema,
			fingerprint_id: prefixedDigestSchema("jsrg_fingerprint"),
			fingerprint_sha256: digestSchema
		});
		familyCoverageSchema = z.strictObject({
			family: z.enum(JAVASCRIPT_SEMANTIC_RELATION_FAMILIES),
			status: z.enum([
				"complete",
				"partial",
				"unknown",
				"unsupported"
			]),
			retained_relations: z.int().min(0),
			omitted_relations: z.int().min(0).nullable(),
			unknown_ids: z.array(semanticUnknownIdSchema)
		});
		graphCoverageSchema = z.strictObject({
			status: z.enum([
				"complete",
				"partial",
				"unknown",
				"unavailable"
			]),
			truncated: z.boolean(),
			omitted_unknown_occurrences: javaScriptSemanticUnknownOmissionsSchema.exactOptional(),
			omitted_nodes: z.int().min(0).nullable(),
			omitted_relations: z.int().min(0).nullable(),
			limits: z.array(z.strictObject({
				name: z.string().min(1),
				value: z.int().min(0),
				unit: z.enum([
					"items",
					"bytes",
					"milliseconds",
					"depth",
					"other"
				])
			})),
			families: z.array(familyCoverageSchema).length(12)
		});
		javaScriptSemanticGraphInputSchema = z.strictObject({
			schema: z.literal("JavaScriptSemanticRelationGraph"),
			root_artifact_sha256: digestSchema,
			application_graph_id: prefixedDigestSchema("jag"),
			root_node_ids: z.array(semanticNodeIdSchema$1).min(1),
			evidence_contexts: z.array(javaScriptSemanticEvidenceContextSchema),
			nodes: z.array(javaScriptSemanticNodeSchema).min(1),
			relations: z.array(javaScriptSemanticRelationSchema),
			fingerprints: z.array(javaScriptSemanticFingerprintSchema),
			unknowns: z.array(javaScriptSemanticUnknownSchema),
			coverage: graphCoverageSchema,
			limitations: z.array(boundedTextSchema$1)
		});
		javaScriptSemanticGraphRecordSchema = javaScriptSemanticGraphInputSchema.extend({ graph_id: prefixedDigestSchema("jsrg") });
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSourceSelection.js
var javaScriptSourcePathsSchema, javaScriptSourceSelectionSchema;
function init_javascriptSourceSelection() {
	return (init_javascriptSourceSelection = __esmMin((() => {
		javaScriptSourcePathsSchema = z.array(z.string().min(1)).min(1).describe("Exact relevant file paths from the artifact inventory, relative to the application root, analyzed in first-request order before unselected scopes; no globs or implicit dependencies. Omit to analyze all sources.");
		javaScriptSourceSelectionSchema = z.strictObject({
			requested_paths: javaScriptSourcePathsSchema,
			unselected_files: z.int().min(0)
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticValueTypes.js
var javaScriptSemanticResourceLimitSchema;
function init_javascriptSemanticValueTypes() {
	return (init_javascriptSemanticValueTypes = __esmMin((() => {
		javaScriptSemanticResourceLimitSchema = z.enum([
			"primitive-candidates",
			"primitive-bytes",
			"expression-depth",
			"getter-expansion",
			"alias-selections"
		]);
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptStaticCoverage.js
var javaScriptStaticCoverageSchema, javaScriptStaticParseStatus, unexaminedJavaScriptStaticCoverage;
function init_javascriptStaticCoverage() {
	return (init_javascriptStaticCoverage = __esmMin((() => {
		init_javascriptSemanticValueTypes();
		javaScriptStaticCoverageSchema = z.strictObject({
			syntax: z.discriminatedUnion("status", [
				z.strictObject({
					status: z.literal("complete"),
					error_count: z.literal(0)
				}),
				z.strictObject({
					status: z.literal("recovered"),
					error_count: z.int().positive()
				}),
				z.strictObject({
					status: z.literal("failed"),
					error_count: z.null()
				}),
				z.strictObject({
					status: z.literal("not-examined"),
					error_count: z.null()
				})
			]),
			semantics: z.strictObject({
				unknown_findings: z.int().nonnegative().nullable(),
				uncertainty: z.array(z.enum([
					"dynamic-findings",
					"returned-reference-widening",
					"type-only-module-side-effect"
				]))
			}),
			examination: z.strictObject({
				status: z.enum([
					"complete",
					"limited",
					"not-examined"
				]),
				semantic_resource_limits: z.array(javaScriptSemanticResourceLimitSchema),
				electron_call_paths_limited: z.boolean()
			}),
			applicability: z.strictObject({ electron: z.enum(["observed", "unknown"]) }),
			unexamined_reason: z.string().min(1).exactOptional()
		});
		javaScriptStaticParseStatus = (coverage) => coverage.syntax.status === "failed" || coverage.syntax.status === "not-examined" ? "failed" : coverage.syntax.status === "recovered" || (coverage.semantics.unknown_findings ?? 0) > 0 || coverage.examination.semantic_resource_limits.includes("alias-selections") ? "partial" : "complete";
		unexaminedJavaScriptStaticCoverage = (reason) => ({
			syntax: {
				status: "not-examined",
				error_count: null
			},
			semantics: {
				unknown_findings: null,
				uncertainty: []
			},
			examination: {
				status: "not-examined",
				semantic_resource_limits: [],
				electron_call_paths_limited: false
			},
			applicability: { electron: "unknown" },
			unexamined_reason: reason
		});
	})))();
}

//#endregion
//#region dist/domain/native/nativeDeadlines.js
var MAX_NATIVE_TIMER_MS, DEFAULT_NATIVE_COMMAND_TIMEOUT_MS, DEFAULT_NATIVE_UI_DEADLINE_MS, DEFAULT_PWNTOOLS_TIMEOUT_MS, NATIVE_UI_WAIT_STEP_MAX_MS, nativeDeadlineMsSchema, deadlineField, nativeCommandTimeoutField, nativeUiDeadlineField, pwntoolsTimeoutField, readNativeDeadline, nativeDeadlineRecovery, fixedNativeAllowance;
function init_nativeDeadlines() {
	return (init_nativeDeadlines = __esmMin((() => {
		init_fixedAllowanceRemediation();
		MAX_NATIVE_TIMER_MS = 2147483647;
		DEFAULT_NATIVE_COMMAND_TIMEOUT_MS = 6e4;
		DEFAULT_NATIVE_UI_DEADLINE_MS = 18e4;
		DEFAULT_PWNTOOLS_TIMEOUT_MS = 3e4;
		NATIVE_UI_WAIT_STEP_MAX_MS = 18e4;
		nativeDeadlineMsSchema = z.number().int().min(1).max(MAX_NATIVE_TIMER_MS);
		deadlineField = (description) => nativeDeadlineMsSchema.optional().describe(description);
		nativeCommandTimeoutField = deadlineField("Wall-clock budget in milliseconds for each macOS native command in this call (otool, lipo, codesign, plutil, swift-demangle, and the other allowlisted Xcode tools). Omitted means 60000. Integer from 1 to 2147483647. Applies on the next call. Does not raise the fixed 67108864-byte output allowance or the 65536-byte failure-diagnostic excerpt. Named native_command_timeout_ms rather than command_timeout_ms because command_timeout_ms is the separate one-shot objdump and rizin deadline (default 120000).");
		nativeUiDeadlineField = deadlineField("Deadline in milliseconds for this UI observation or scenario, including helper preparation and captures. Omitted means 180000. Integer from 1 to 2147483647. Applies on the next call. Does not raise the fixed 67108864-byte scenario output allowance or the 180000 ms cap on one wait step. A partial observation may already be retained when this deadline expires.");
		pwntoolsTimeoutField = deadlineField("Deadline in milliseconds for each owned pwntools command in this call. Omitted means 30000. Integer from 1 to 2147483647. Applies on the next call. Does not raise cpuSeconds 30 or the output (67108864 bytes), diagnostic (1048576 bytes), or address-space (3221225472 bytes) allowances. Artifact admission stays REA_PWNTOOLS_MAX_INPUT_BYTES (default 33554432 bytes).");
		readNativeDeadline = (value, defaultMs) => {
			if (value === undefined) return {
				ok: true,
				timeoutMs: defaultMs
			};
			const parsed = nativeDeadlineMsSchema.safeParse(value);
			if (parsed.success) return {
				ok: true,
				timeoutMs: parsed.data
			};
			const invalidType = parsed.error.issues.some((issue) => issue.code === "invalid_type");
			return {
				ok: false,
				reason: invalidType ? "invalid_type" : "out_of_range",
				message: `Expected an integer from 1 to ${String(MAX_NATIVE_TIMER_MS)} milliseconds; received ${JSON.stringify(value)}. Omitted means ${String(defaultMs)}.`
			};
		};
		nativeDeadlineRecovery = (input) => {
			const atMaximum = input.timeoutMs >= MAX_NATIVE_TIMER_MS;
			const adjustment = atMaximum ? `${input.setting} (${input.cliFlag} on the CLI) is already at the maximum ${String(MAX_NATIVE_TIMER_MS)} ms; do not increase it.` : `Increase ${input.setting} above ${String(input.timeoutMs)} (integer milliseconds from 1 to ${String(MAX_NATIVE_TIMER_MS)}; omitted means ${String(input.defaultMs)}), or pass ${input.cliFlag} on the CLI. A change applies on the next call.`;
			return {
				userMessage: `This request reached REA's ${input.phase} of ${String(input.timeoutMs)} ms (${input.setting}). This is a server/provider deadline, not the MCP client deadline.${input.detail ?? ""}`,
				remediationAction: `${adjustment} ${input.unchanged} Allow execution, cleanup, and delivery headroom in the outer MCP client deadline. Confirm outstanding work and cleanup before retrying.`
			};
		};
		fixedNativeAllowance = (allowance, kind, valueWithUnits) => ({
			retryable: false,
			remediationAction: `${fixedAllowanceRemediation(allowance, kind)} This release has no runtime override. The allowance is ${valueWithUnits}.`
		});
	})))();
}

//#endregion
//#region dist/domain/artifactInspection.js
var textSchema$3, evidenceIdSchema$5, artifactIdSchema, inspectionObservationSchema, inspectionHypothesisSchema, inspectionContradictionBaseSchema, inspectionContradictionSchema, nextProbeSchema, unexploredBranchSchema, artifactInspectionResultSchema, createArtifactInspection, parseInventoryEvidence, allObservations, observation, allHypotheses, contradictions, probesFor, DIRECTORY_MEMBER_FORMATS, directoryProbes, probesForFormat, allUnexploredBranches, branch, inspectionCoverage, artifactInspectionSources, readArtifactInspectionSources;
function init_artifactInspection() {
	return (init_artifactInspection = __esmMin((() => {
		init_evidenceValidation();
		init_result();
		init_immutableJson();
		init_artifactIntegrity();
		init_artifactGraph();
		init_canonicalDigest();
		init_javascriptArtifactFiles();
		init_canonicalOrdering();
		init_evidence();
		init_jsonValue();
		init_digests();
		textSchema$3 = z.string().min(1);
		evidenceIdSchema$5 = prefixedDigestSchema("ev");
		artifactIdSchema = prefixedDigestSchema("art");
		inspectionObservationSchema = z.strictObject({
			observation_id: prefixedDigestSchema("aio"),
			kind: z.enum(["root-manifest", "integrity"]),
			subject: textSchema$3,
			value: jsonValueSchema,
			evidence_id: evidenceIdSchema$5
		});
		inspectionHypothesisSchema = z.strictObject({
			hypothesis_id: prefixedDigestSchema("aih"),
			statement: textSchema$3,
			confidence: z.enum(["medium", "low"]),
			basis_evidence_ids: z.array(evidenceIdSchema$5).min(1),
			limitation: textSchema$3
		});
		inspectionContradictionBaseSchema = z.strictObject({
			contradiction_id: prefixedDigestSchema("aic"),
			statement: textSchema$3,
			occurrence_id: prefixedDigestSchema("occ"),
			evidence_id: evidenceIdSchema$5
		});
		inspectionContradictionSchema = z.union([inspectionContradictionBaseSchema.extend(artifactSha256PairSchema.shape), inspectionContradictionBaseSchema.extend(artifactMd5PairSchema.shape)]);
		nextProbeSchema = z.strictObject({
			operation: textSchema$3,
			rationale: textSchema$3,
			authority: z.enum([
				"artifact-bytes",
				"managed-static-analysis",
				"native-analysis-provider",
				"ast-static-analysis"
			])
		});
		unexploredBranchSchema = z.strictObject({
			branch_id: prefixedDigestSchema("aib"),
			reason: z.enum(["format-specific-analysis-required", "unknown-format"]),
			detail: textSchema$3,
			next_probe: nextProbeSchema.nullable(),
			evidence_id: evidenceIdSchema$5
		});
		artifactInspectionResultSchema = z.strictObject({
			inspection_id: prefixedDigestSchema("ai"),
			subject: z.strictObject({
				manifest_id: prefixedDigestSchema("agm"),
				root_artifact_id: artifactIdSchema,
				root_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
				root_format: textSchema$3
			}),
			substeps: z.array(z.strictObject({
				substep_id: prefixedDigestSchema("ais"),
				operation: z.literal("inventory_artifact"),
				status: z.literal("completed"),
				evidence_id: evidenceIdSchema$5,
				evidence: evidenceSchema.safeExtend({
					operation: z.literal("inventory_artifact"),
					normalized_result: artifactInventoryResultSchema
				})
			})).min(1),
			observations: z.array(inspectionObservationSchema),
			hypotheses: z.array(inspectionHypothesisSchema),
			contradictions: z.array(inspectionContradictionSchema),
			unexplored_branches: z.array(unexploredBranchSchema),
			next_probes: z.array(nextProbeSchema),
			coverage: z.strictObject({
				status: z.enum([
					"complete-within-substeps",
					"partial",
					"truncated"
				]),
				substeps_completed: z.int().min(1),
				observations_retained: z.int().min(0),
				observations_omitted: z.int().min(0),
				hypotheses_retained: z.int().min(0),
				hypotheses_omitted: z.int().min(0),
				unexplored_branches_retained: z.int().min(0),
				unexplored_branches_omitted: z.int().min(0),
				next_probes_retained: z.int().min(0),
				next_probes_omitted: z.int().min(0)
			}),
			evidence_links: z.array(evidenceIdSchema$5).min(1),
			limitations: z.array(textSchema$3)
		});
		createArtifactInspection = (inventoryInput) => {
			const inventoryEvidence = parseInventoryEvidence(inventoryInput);
			const inventory = artifactInventoryResultSchema.parse(inventoryEvidence.normalized_result);
			const observations = allObservations(inventory, inventoryEvidence.evidence_id);
			const hypotheses = allHypotheses(inventory, inventoryEvidence.evidence_id);
			const nextProbes = probesFor(inventory);
			const branches = allUnexploredBranches(inventory, inventoryEvidence.evidence_id, nextProbes);
			const retained = {
				observations,
				hypotheses,
				branches,
				probes: nextProbes
			};
			const omissions = {
				observations: 0,
				hypotheses: 0,
				branches: 0,
				probes: 0
			};
			const semantic = {
				subject: {
					manifest_id: inventory.manifest.manifest_id,
					root_artifact_id: inventory.manifest.root_artifact_id,
					root_sha256: inventory.manifest.root_sha256,
					root_format: inventory.manifest.root_format
				},
				substeps: [{
					substep_id: `ais_${digestCanonicalValue({
						operation: "inventory_artifact",
						evidence_id: inventoryEvidence.evidence_id
					}, "Artifact inspection")}`,
					operation: "inventory_artifact",
					status: "completed",
					evidence_id: inventoryEvidence.evidence_id,
					evidence: inventoryEvidence
				}],
				observations: retained.observations,
				hypotheses: retained.hypotheses,
				contradictions: contradictions(inventory, inventoryEvidence.evidence_id),
				unexplored_branches: retained.branches,
				next_probes: retained.probes,
				coverage: {
					status: inspectionCoverage(inventory, omissions),
					substeps_completed: 1,
					observations_retained: retained.observations.length,
					observations_omitted: omissions.observations,
					hypotheses_retained: retained.hypotheses.length,
					hypotheses_omitted: omissions.hypotheses,
					unexplored_branches_retained: retained.branches.length,
					unexplored_branches_omitted: omissions.branches,
					next_probes_retained: retained.probes.length,
					next_probes_omitted: omissions.probes
				},
				evidence_links: [inventoryEvidence.evidence_id],
				limitations: uniqueSorted([...inventory.limitations, "Inspection derives bounded static hypotheses and next probes; it does not execute the artifact or claim format-specific semantics."])
			};
			return artifactInspectionResultSchema.parse({
				...semantic,
				inspection_id: `ai_${digestCanonicalValue(semantic, "Artifact inspection")}`
			});
		};
		parseInventoryEvidence = (input) => {
			const evidence = parseEvidence(input);
			if (evidence.operation !== "inventory_artifact") throw new TypeError("Artifact inspection substep requires inventory_artifact Evidence");
			return evidence;
		};
		allObservations = (inventory, evidenceId) => [observation("root-manifest", inventory.manifest.root_artifact_id, inventory.manifest, evidenceId), ...inventory.integrity_contradictions.map((value) => observation("integrity", value.contradiction_id, value, evidenceId))];
		observation = (kind, subject, value, evidenceId) => {
			const semantic = {
				kind,
				subject,
				value: jsonValueSchema.parse(value),
				evidence_id: evidenceId
			};
			return {
				observation_id: `aio_${digestCanonicalValue(semantic, "Artifact inspection")}`,
				...semantic
			};
		};
		allHypotheses = (inventory, evidenceId) => {
			const statements = inventory.manifest.root_format === "pe" ? ["The PE artifact may contain managed CLI metadata or native code; inventory bytes alone do not distinguish them."] : ["asar", "javascript-bundle"].includes(inventory.manifest.root_format) ? ["The artifact may contain a recoverable JavaScript application graph."] : [];
			return statements.map((statement) => {
				const semantic = {
					statement,
					confidence: "low",
					basis_evidence_ids: [evidenceId],
					limitation: "Format classification proposes a bounded follow-up; it is not semantic proof."
				};
				return {
					hypothesis_id: `aih_${digestCanonicalValue(semantic, "Artifact inspection")}`,
					...semantic
				};
			});
		};
		contradictions = (inventory, evidenceId) => inventory.integrity_contradictions.map((value) => {
			const semantic = {
				statement: `Declared integrity for ${value.logical_path} contradicts observed bytes.`,
				occurrence_id: value.occurrence_id,
				...artifactIntegrityPairOf(value),
				evidence_id: evidenceId
			};
			return {
				contradiction_id: `aic_${digestCanonicalValue(semantic, "Artifact inspection")}`,
				...semantic
			};
		});
		probesFor = (inventory) => {
			const format = inventory.manifest.root_format;
			if (format === "node-sea") return inventory.occurrences.some((row) => row.format_metadata?.kind === "node-sea-entry" && row.format_metadata.role === "main-script" && isJavaScriptSourcePath(row.logical_path)) ? [{
				operation: "analyze_javascript_application",
				rationale: "Extract the SEA main script with extract_artifact, then analyze the extracted JavaScript application.",
				authority: "ast-static-analysis"
			}] : [];
			return format === "directory" ? directoryProbes(inventory) : probesForFormat(format);
		};
		DIRECTORY_MEMBER_FORMATS = [
			"asar",
			"javascript-bundle",
			"mach-o-universal",
			"mach-o",
			"elf",
			"pe",
			"plist"
		];
		directoryProbes = (inventory) => {
			const present = new Set(inventory.occurrences.filter(({ entry_kind, artifact_format }) => entry_kind !== "symlink" || artifact_format !== "javascript-bundle").map(({ artifact_format }) => artifact_format));
			const members = DIRECTORY_MEMBER_FORMATS.filter((memberFormat) => present.has(memberFormat));
			const probes = members.flatMap(probesForFormat);
			return probes.filter((probe, index) => probes.findIndex(({ operation }) => operation === probe.operation) === index);
		};
		probesForFormat = (format) => {
			if (["asar", "javascript-bundle"].includes(format)) return [{
				operation: "analyze_javascript_application",
				rationale: "Recover bounded JavaScript modules, source maps, Electron boundaries, and application relationships.",
				authority: "ast-static-analysis"
			}];
			if (format === "pe") return [{
				operation: "inspect_managed_artifact",
				rationale: "Check execution-free CLI metadata before choosing a deep native provider.",
				authority: "managed-static-analysis"
			}, {
				operation: "open_binary",
				rationale: "Open as native code only when managed inspection reports a native or mixed boundary.",
				authority: "native-analysis-provider"
			}];
			if ([
				"mach-o",
				"mach-o-universal",
				"elf"
			].includes(format)) return [{
				operation: "open_binary",
				rationale: "Bind one deep native provider before function-level analysis.",
				authority: "native-analysis-provider"
			}];
			if (format === "plist") return [{
				operation: "inspect_plist",
				rationale: "Parse property-list values without executing the artifact.",
				authority: "artifact-bytes"
			}];
			return [];
		};
		allUnexploredBranches = (inventory, evidenceId, nextProbes) => {
			const branches = [];
			branches.push(...nextProbes.map((probe) => branch("format-specific-analysis-required", `${probe.operation} was not run by provider-neutral artifact inspection.`, probe, evidenceId)));
			if (inventory.manifest.root_format === "unknown") branches.push(branch("unknown-format", "Artifact bytes did not match an admitted format classifier.", null, evidenceId));
			return branches;
		};
		branch = (reason, detail, nextProbe, evidenceId) => {
			const semantic = {
				reason,
				detail,
				next_probe: nextProbe,
				evidence_id: evidenceId
			};
			return {
				branch_id: `aib_${digestCanonicalValue(semantic, "Artifact inspection")}`,
				...semantic
			};
		};
		inspectionCoverage = (inventory, omissions) => {
			if (Object.values(omissions).some((count) => count > 0)) return "truncated";
			if (inventory.coverage.status !== "complete") return "partial";
			return "complete-within-substeps";
		};
		artifactInspectionSources = (inspection) => {
			const substeps = immutableJsonSnapshotMember(inspection, "substeps");
			return Object.freeze(inspection.substeps.map((step, index) => {
				const ownedStep = immutableJsonSnapshotMember(substeps, String(index));
				immutableJsonSnapshotMember(ownedStep, "evidence");
				return step.evidence;
			}));
		};
		readArtifactInspectionSources = (result) => {
			const parsed = readEvidencePayload(artifactInspectionResultSchema, result);
			if (!parsed.ok) return parsed;
			const inspection = canBorrowParsedJsonSnapshot(result, parsed.value) ? result : parsed.value;
			return ok(artifactInspectionSources(inspection));
		};
	})))();
}

//#endregion
//#region dist/domain/zodCollectionSteps.js
/** Elements validated between yields, in the issues and paths a whole-array parse reports. */
function* parseElementSteps(element, values, path, issues) {
	const parsed = [];
	for (const [index, value] of values.entries()) {
		if (index % 64 === 0) yield;
		const result = element.safeParse(value);
		if (result.success) parsed.push(result.data);
		else issues.push(...result.error.issues.map((issue) => ({
			...issue,
			path: [
				...path,
				index,
				...issue.path
			]
		})));
	}
	return parsed;
}
var arrayContainerSchema;
function init_zodCollectionSteps() {
	return (init_zodCollectionSteps = __esmMin((() => {
		arrayContainerSchema = (array) => array.clone({
			...array.def,
			element: z.unknown()
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptApplicationGraph.js
function* checkGraphContentSteps$1(graph, context) {
	sortedUniqueIssue$1(graph.root_node_ids, ["root_node_ids"], "Root nodes", context);
	sortedUniqueIssue$1(graph.nodes.map(({ node_id: id }) => id), ["nodes"], "Nodes", context);
	sortedUniqueIssue$1(graph.edges.map(({ edge_id: id }) => id), ["edges"], "Edges", context);
	sortedUniqueIssue$1(graph.limitations, ["limitations"], "Graph limitations", context);
	sortedUniqueIssue$1(graph.coverage.limits.map(limitKey), ["coverage", "limits"], "Graph limits", context);
	if (graph.coverage.status !== "complete" && graph.limitations.length === 0) context.addIssue({
		code: "custom",
		message: "Non-complete graph coverage requires an explicit limitation",
		path: ["limitations"]
	});
	const nodesById = new Map(graph.nodes.map((node) => [node.node_id, node]));
	for (const root of graph.root_node_ids) if (!nodesById.has(root)) context.addIssue({
		code: "custom",
		message: "Root identifier must name a graph node",
		path: ["root_node_ids"]
	});
	for (const [index, node] of graph.nodes.entries()) {
		if (index % 64 === 0) yield;
		checkNode(node, index, context);
	}
	for (const [index, edge] of graph.edges.entries()) {
		if (index % 64 === 0) yield;
		const { edge_id: identifier, ...semantic } = edge;
		if (identifier !== edgeId(semantic)) context.addIssue({
			code: "custom",
			message: "Edge identifier does not match its semantic content",
			path: [
				"edges",
				index,
				"edge_id"
			]
		});
		if (!nodesById.has(edge.source_node_id) || !nodesById.has(edge.target_node_id)) context.addIssue({
			code: "custom",
			message: "Edge endpoints must name graph nodes",
			path: ["edges", index]
		});
		if (edge.source_node_id === edge.target_node_id) context.addIssue({
			code: "custom",
			message: "Application graph edges cannot be self-referential",
			path: ["edges", index]
		});
		if (edge.relation === "changed_from" && nodesById.get(edge.source_node_id)?.kind !== nodesById.get(edge.target_node_id)?.kind) context.addIssue({
			code: "custom",
			message: "changed_from endpoints must have the same node kind",
			path: [
				"edges",
				index,
				"relation"
			]
		});
		checkEvidenceNormalization(edge.evidence, [
			"edges",
			index,
			"evidence"
		], context);
	}
}
function* parseAndSealApplicationGraphSteps(container) {
	const issues = [];
	const parsed = {
		...container,
		nodes: yield* parseElementSteps(applicationGraphShape.nodes.element, container.nodes, ["nodes"], issues),
		edges: yield* parseElementSteps(applicationGraphShape.edges.element, container.edges, ["edges"], issues)
	};
	if (issues.length > 0) throw new z.ZodError(issues);
	const content = normalizeGraphInput$1(parsed);
	let invalid = false;
	yield* checkGraphContentSteps$1(content, { addIssue: () => {
		invalid = true;
	} });
	if (invalid) {
		javascriptApplicationGraphContentSchema.parse(content);
		throw new TypeError("Application graph checks disagree with its schema");
	}
	return yield* sealValidatedApplicationGraphSteps({
		...content,
		graph_id: `jag_${yield* canonicalJsonDigestSteps(content)}`
	});
}
function* sealValidatedApplicationGraphSteps(graph) {
	yield* freezeOwnedJsonSnapshotSteps(graph);
	validatedImmutableApplicationGraphs.add(graph);
	return graph;
}
var OBSERVATION_IDENTIFIER_STRATEGY, EDGE_IDENTIFIER_STRATEGY, limitKey, normalizeLimits, normalizeEvidence$1, normalizeIdentity, nodeSemantic, nodeId, observationSemantic, observationId, edgeId, sortedUniqueIssue$1, checkEvidenceNormalization, sourceMapObservationMatchesIdentity, observationMatchesIdentity, checkNode, checkGraphContent$1, checkGraphInvariants, javascriptApplicationGraphSchema, javascriptApplicationGraphContentSchema, createJavaScriptApplicationNode, mergeJavaScriptApplicationNodes, createJavaScriptApplicationEdge, createJavaScriptApplicationGraph, normalizeGraphInput$1, validatedImmutableApplicationGraphs, createImmutableJavaScriptApplicationGraphSteps, applicationGraphShape, applicationGraphContainerSchema, sealTransferredJavaScriptApplicationGraphSteps, isValidatedImmutableJavaScriptApplicationGraph, parseJavaScriptApplicationGraph, computeJavaScriptApplicationGraphSha256, serializeJavaScriptApplicationGraph;
function init_javascriptApplicationGraph() {
	return (init_javascriptApplicationGraph = __esmMin((() => {
		init_zodCollectionSteps();
		init_canonicalJsonDigestSteps();
		init_comparisonSemantics();
		init_canonicalDigest();
		init_canonicalOrdering();
		init_unicodeCodePointOrder();
		init_immutableJson();
		init_javascriptApplicationGraphSchemas();
		OBSERVATION_IDENTIFIER_STRATEGY = {
			strategy: "semantic-content-sha256",
			stability: "observation-exact"
		};
		EDGE_IDENTIFIER_STRATEGY = {
			strategy: "semantic-content-sha256",
			stability: "relationship-exact"
		};
		limitKey = (limit) => canonicalJson(limit, "JavaScript Application Graph");
		normalizeLimits = (limits) => [...new Map(limits.map((limit) => [limitKey(limit), limit])).values()].sort((left, right) => compareUnicodeCodePoints(limitKey(left), limitKey(right)));
		normalizeEvidence$1 = (evidence) => ({
			...evidence,
			coverage: {
				...evidence.coverage,
				limits: normalizeLimits(evidence.coverage.limits)
			},
			limitations: uniqueSorted(evidence.limitations),
			evidence_ids: uniqueSorted(evidence.evidence_ids)
		});
		normalizeIdentity = (identity) => identity.strategy === "structural-fingerprint" ? {
			...identity,
			basis: uniqueSorted(identity.basis)
		} : identity;
		nodeSemantic = (node) => ({
			kind: node.kind,
			identity: node.identity
		});
		nodeId = (node) => `jag_node_${digestCanonicalValue(nodeSemantic(node), "JavaScript Application Graph")}`;
		observationSemantic = (nodeIdentifier, observation) => ({
			node_id: nodeIdentifier,
			...observation
		});
		observationId = (nodeIdentifier, observation) => `jag_observation_${digestCanonicalValue(observationSemantic(nodeIdentifier, observation))}`;
		edgeId = (edge) => `jag_edge_${digestCanonicalValue(edge, "JavaScript Application Graph")}`;
		sortedUniqueIssue$1 = (values, path, label, context) => {
			for (let index = 1; index < values.length; index += 1) {
				if (compareUnicodeCodePoints(values[index - 1] ?? "", values[index] ?? "") < 0) continue;
				context.addIssue({
					code: "custom",
					message: `${label} must be sorted and unique by Unicode code point`,
					path: [...path, index]
				});
				return;
			}
		};
		checkEvidenceNormalization = (evidence, path, context) => {
			sortedUniqueIssue$1(evidence.limitations, [...path, "limitations"], "Evidence limitations", context);
			sortedUniqueIssue$1(evidence.evidence_ids, [...path, "evidence_ids"], "Evidence identifiers", context);
			sortedUniqueIssue$1(evidence.coverage.limits.map(limitKey), [
				...path,
				"coverage",
				"limits"
			], "Evidence limits", context);
			const runtimeLocation = evidence.location.available && evidence.location.value.kind === "runtime";
			const staticAuthority = [
				"artifact-bytes",
				"ast-static-analysis",
				"static-relationship-inference",
				"native-analysis-provider",
				"managed-static-analysis"
			].includes(evidence.authority);
			if (runtimeLocation && staticAuthority) context.addIssue({
				code: "custom",
				message: "Static and native authorities cannot claim a runtime location",
				path: [...path, "location"]
			});
		};
		sourceMapObservationMatchesIdentity = (identity, observation) => {
			const { evidence, source_map_reference: reference } = observation;
			const sourceDigests = [observation.properties.content_sha256, observation.properties.source_sha256];
			const hasKnownSourceDigest = identity.source_sha256 !== null;
			const sourceDigestMatches = sourceDigests.every((digest) => digest === undefined || digest === null || digest === identity.source_sha256) && (!hasKnownSourceDigest || sourceDigests.includes(identity.source_sha256));
			const contentAvailabilityMatches = (observation.properties.content_available !== true || hasKnownSourceDigest) && (observation.properties.content_available !== false || !hasKnownSourceDigest);
			return sourceDigestMatches && contentAvailabilityMatches && reference !== null && evidence.state === "observed" && evidence.artifact.available && evidence.artifact.sha256 === identity.source_map_sha256 && reference.source_name === identity.original_source && reference.source_root === identity.source_root && evidence.location.available && evidence.location.value.kind === "artifact-path" && reference.map_path === evidence.location.value.path;
		};
		observationMatchesIdentity = (node, observation) => {
			const { identity } = node;
			const { evidence } = observation;
			if (identity.strategy === "content-digest") return evidence.state === "observed" && evidence.artifact.available && evidence.artifact.sha256 === identity.sha256;
			if (identity.strategy === "source-map-original") return sourceMapObservationMatchesIdentity(identity, observation);
			if (identity.strategy === "canonical-path") return evidence.artifact.available && evidence.artifact.sha256 === identity.artifact_sha256 && evidence.location.available && evidence.location.value.kind === "artifact-path" && evidence.location.value.path === identity.path;
			if (identity.strategy === "artifact-local-key") return evidence.artifact.available && evidence.artifact.sha256 === identity.artifact_sha256;
			if (identity.strategy === "runtime-instance") {
				if (!["passive-cdp-runtime", "controlled-replay"].includes(evidence.authority) || !evidence.location.available || evidence.location.value.kind !== "runtime") return false;
				const location = evidence.location.value;
				return location.capture_sha256 === identity.capture_sha256 && [
					location.target_key,
					location.frame_key,
					location.script_key
				].includes(identity.runtime_key);
			}
			if (identity.strategy === "structural-fingerprint") return evidence.state === "inferred";
			return evidence.state === "observed";
		};
		checkNode = (node, index, context) => {
			if (node.node_id !== nodeId(node)) context.addIssue({
				code: "custom",
				message: "Node identifier does not match its kind and identity",
				path: [
					"nodes",
					index,
					"node_id"
				]
			});
			if (node.identity.strategy === "structural-fingerprint" && canonicalJson(node.identity.basis, "JavaScript Application Graph") !== canonicalJson(uniqueSorted(node.identity.basis), "JavaScript Application Graph")) context.addIssue({
				code: "custom",
				message: "Structural fingerprint basis must be sorted and unique",
				path: [
					"nodes",
					index,
					"identity",
					"basis"
				]
			});
			sortedUniqueIssue$1(node.observations.map(({ observation_id: id }) => id), [
				"nodes",
				index,
				"observations"
			], "Node observations", context);
			for (const [observationIndex, observation] of node.observations.entries()) {
				const { observation_id: identifier, ...semantic } = observation;
				if (identifier !== observationId(node.node_id, semantic)) context.addIssue({
					code: "custom",
					message: "Observation identifier does not match its semantic content",
					path: [
						"nodes",
						index,
						"observations",
						observationIndex,
						"observation_id"
					]
				});
				if (node.identity.strategy === "source-map-original" && !observationMatchesIdentity(node, observation)) context.addIssue({
					code: "custom",
					message: "Source-map observation must retain its exact declaration and map location",
					path: [
						"nodes",
						index,
						"observations",
						observationIndex,
						"source_map_reference"
					]
				});
				checkEvidenceNormalization(observation.evidence, [
					"nodes",
					index,
					"observations",
					observationIndex,
					"evidence"
				], context);
			}
			if (!node.observations.some((observation) => observationMatchesIdentity(node, observation))) context.addIssue({
				code: "custom",
				message: "Node identity is not supported by a compatible observation",
				path: [
					"nodes",
					index,
					"identity"
				]
			});
		};
		checkGraphContent$1 = (graph, context) => {
			const steps = checkGraphContentSteps$1(graph, context);
			while (steps.next().done !== true);
		};
		checkGraphInvariants = (graph, context) => {
			checkGraphContent$1(graph, context);
			const { graph_id: identifier, ...semantic } = graph;
			if (identifier !== `jag_${digestCanonicalValue(semantic, "JavaScript Application Graph")}`) context.addIssue({
				code: "custom",
				message: "Graph identifier does not match its semantic content",
				path: ["graph_id"]
			});
		};
		javascriptApplicationGraphSchema = javascriptApplicationGraphRecordSchema.superRefine(checkGraphInvariants);
		javascriptApplicationGraphContentSchema = javascriptApplicationGraphInputSchema.superRefine(checkGraphContent$1);
		createJavaScriptApplicationNode = (input) => {
			const parsed = applicationNodeInputSchema.parse(input);
			for (const observation of parsed.observations) freezeJsonSnapshot(observation.properties);
			const identity = normalizeIdentity(parsed.identity);
			const identifier = nodeId({
				kind: parsed.kind,
				identity
			});
			const observations = parsed.observations.map((observation) => {
				const semantic = {
					...observation,
					evidence: normalizeEvidence$1(observation.evidence),
					identifier_strategy: OBSERVATION_IDENTIFIER_STRATEGY
				};
				return applicationNodeObservationSchema.parse({
					...semantic,
					observation_id: observationId(identifier, semantic)
				});
			}).sort((left, right) => compareUnicodeCodePoints(left.observation_id, right.observation_id));
			return applicationNodeSchema.parse({
				node_id: identifier,
				kind: parsed.kind,
				identity,
				observations
			});
		};
		mergeJavaScriptApplicationNodes = (nodes) => {
			const groups = new Map();
			for (const node of nodes) {
				const group = groups.get(node.node_id);
				if (group === undefined) {
					groups.set(node.node_id, {
						node,
						observations: new Map(node.observations.map((observation) => [observation.observation_id, observation]))
					});
					continue;
				}
				if (node.kind !== group.node.kind || canonicalJson(node.identity) !== canonicalJson(group.node.identity)) throw new TypeError("Colliding JAG node identifiers disagree");
				for (const observation of node.observations) group.observations.set(observation.observation_id, observation);
			}
			return [...groups.values()].map(({ node, observations }) => createJavaScriptApplicationNode({
				kind: node.kind,
				identity: node.identity,
				observations: [...observations.values()].map(({ observation_id: _id, identifier_strategy: _strategy, ...value }) => value)
			}));
		};
		createJavaScriptApplicationEdge = (input) => {
			const parsed = applicationEdgeInputSchema.parse(input);
			freezeJsonSnapshot(parsed.properties);
			const semantic = {
				...parsed,
				evidence: normalizeEvidence$1(parsed.evidence),
				identifier_strategy: EDGE_IDENTIFIER_STRATEGY
			};
			return applicationEdgeSchema.parse({
				...semantic,
				edge_id: edgeId(semantic)
			});
		};
		createJavaScriptApplicationGraph = (input) => {
			const semantic = normalizeGraphInput$1(javascriptApplicationGraphInputSchema.parse(input));
			const content = javascriptApplicationGraphContentSchema.parse(semantic);
			return {
				...content,
				graph_id: `jag_${digestCanonicalValue(content, "JavaScript Application Graph")}`
			};
		};
		normalizeGraphInput$1 = (parsed) => ({
			...parsed,
			root_node_ids: uniqueSorted(parsed.root_node_ids),
			nodes: [...parsed.nodes].sort((left, right) => compareUnicodeCodePoints(left.node_id, right.node_id)),
			edges: [...parsed.edges].sort((left, right) => compareUnicodeCodePoints(left.edge_id, right.edge_id)),
			coverage: {
				...parsed.coverage,
				limits: normalizeLimits(parsed.coverage.limits)
			},
			limitations: uniqueSorted(parsed.limitations)
		});
		validatedImmutableApplicationGraphs = new WeakSet();
		createImmutableJavaScriptApplicationGraphSteps = (input) => sealValidatedApplicationGraphSteps(createJavaScriptApplicationGraph(input));
		applicationGraphShape = javascriptApplicationGraphInputSchema.shape;
		applicationGraphContainerSchema = javascriptApplicationGraphInputSchema.extend({
			nodes: arrayContainerSchema(applicationGraphShape.nodes),
			edges: arrayContainerSchema(applicationGraphShape.edges)
		});
		sealTransferredJavaScriptApplicationGraphSteps = (input) => parseAndSealApplicationGraphSteps(applicationGraphContainerSchema.parse(input));
		isValidatedImmutableJavaScriptApplicationGraph = (value) => typeof value === "object" && value !== null && validatedImmutableApplicationGraphs.has(value);
		parseJavaScriptApplicationGraph = (input) => javascriptApplicationGraphSchema.parse(input);
		computeJavaScriptApplicationGraphSha256 = (input) => digestCanonicalValue(parseJavaScriptApplicationGraph(input), "JavaScript Application Graph");
		serializeJavaScriptApplicationGraph = (input) => canonicalJson(parseJavaScriptApplicationGraph(input), "JavaScript Application Graph");
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticGraph.js
function* checkCoverageSteps(graph, context) {
	const omittedUnknowns = graph.coverage.omitted_unknown_occurrences ?? [];
	sortedUniqueIssue(omittedUnknowns.map(({ family, reason }) => `${family}:${reason}`), ["coverage", "omitted_unknown_occurrences"], "Unknown omission coverage", context);
	if (omittedUnknowns.length > 0 && (!graph.coverage.truncated || graph.coverage.status !== "partial")) context.addIssue({
		code: "custom",
		path: ["coverage"],
		message: "Omitted unknown occurrences require truncated partial coverage"
	});
	const families = graph.coverage.families.map(({ family }) => family);
	if (canonicalJson(families, "JavaScript semantic graph") !== canonicalJson(JAVASCRIPT_SEMANTIC_RELATION_FAMILIES, "JavaScript semantic graph")) context.addIssue({
		code: "custom",
		path: ["coverage", "families"],
		message: "Coverage must name every semantic relation family once in canonical order"
	});
	if (graph.coverage.status === "complete" && (graph.coverage.truncated || graph.coverage.omitted_nodes !== 0 || graph.coverage.omitted_relations !== 0 || graph.coverage.families.some(({ status }) => status !== "complete"))) context.addIssue({
		code: "custom",
		path: ["coverage"],
		message: "Complete graph coverage cannot omit or truncate semantic facts"
	});
	if (graph.coverage.truncated && graph.coverage.limits.length === 0) context.addIssue({
		code: "custom",
		path: ["coverage", "limits"],
		message: "Truncated graph coverage must identify an effective limit"
	});
	if (graph.coverage.truncated && graph.coverage.status !== "partial") context.addIssue({
		code: "custom",
		path: ["coverage", "status"],
		message: "Truncated semantic graph coverage must be partial"
	});
	if (graph.coverage.truncated && graph.coverage.omitted_nodes === 0 && graph.coverage.omitted_relations === 0 && omittedUnknowns.length === 0) context.addIssue({
		code: "custom",
		path: ["coverage"],
		message: "Truncated semantic graph coverage must acknowledge omitted facts"
	});
	const relationsByFamily = new Map(JAVASCRIPT_SEMANTIC_RELATION_FAMILIES.map((family) => [family, 0]));
	for (const [index, relation] of graph.relations.entries()) {
		if (index % 256 === 0) yield;
		const family = JAVASCRIPT_SEMANTIC_RELATION_FAMILY[relation.relation];
		relationsByFamily.set(family, (relationsByFamily.get(family) ?? 0) + 1);
	}
	const unknownsById = new Map();
	const unknownFamilies = new Set();
	for (const [index, unknown] of graph.unknowns.entries()) {
		if (index % 256 === 0) yield;
		unknownsById.set(unknown.unknown_id, unknown);
		unknownFamilies.add(unknown.family);
	}
	for (const [index, family] of graph.coverage.families.entries()) {
		if (family.retained_relations !== relationsByFamily.get(family.family)) context.addIssue({
			code: "custom",
			path: [
				"coverage",
				"families",
				index,
				"retained_relations"
			],
			message: "Family retained relation count does not match graph content"
		});
		if (family.unknown_ids.some((identifier) => unknownsById.get(identifier)?.family !== family.family)) context.addIssue({
			code: "custom",
			path: [
				"coverage",
				"families",
				index,
				"unknown_ids"
			],
			message: "Family coverage references an unknown from another family"
		});
		if (family.status === "complete" && (family.omitted_relations !== 0 || family.unknown_ids.length > 0 || unknownFamilies.has(family.family) || omittedUnknowns.some((omitted) => omitted.family === family.family))) context.addIssue({
			code: "custom",
			path: [
				"coverage",
				"families",
				index
			],
			message: "Complete family coverage cannot omit or retain unknown facts"
		});
	}
}
function* checkEvidenceContextReferencesSteps(graph, context) {
	const contexts = new Map(graph.evidence_contexts.map((value) => [value.context_id, value]));
	const referenced = new Set();
	const validateReferences = function* (entities, entityKind) {
		for (const [index, { evidence }] of entities.entries()) {
			if (index % 256 === 0) yield;
			referenced.add(evidence.context_id);
			const evidenceContext = contexts.get(evidence.context_id);
			if (evidenceContext === undefined) {
				context.addIssue({
					code: "custom",
					path: [
						entityKind,
						index,
						"evidence",
						"context_id"
					],
					message: "Evidence reference names an absent context"
				});
				continue;
			}
			const { context_id: _contextId, ...evidenceValue } = evidenceContext;
			if (!applicationGraphEvidenceSchema.safeParse({
				...evidenceValue,
				location: evidence.location
			}).success) context.addIssue({
				code: "custom",
				path: [
					entityKind,
					index,
					"evidence"
				],
				message: "Evidence context is incompatible with its fact location"
			});
		}
	};
	yield* validateReferences(graph.nodes, "nodes");
	yield* validateReferences(graph.relations, "relations");
	yield* validateReferences(graph.unknowns, "unknowns");
	yield* validateReferences(graph.fingerprints, "fingerprints");
	for (const [index, evidenceContext] of graph.evidence_contexts.entries()) {
		if (index % 256 === 0) yield;
		const { context_id: identifier, ...value } = evidenceContext;
		if (identifier !== evidenceContextId(value)) context.addIssue({
			code: "custom",
			path: [
				"evidence_contexts",
				index,
				"context_id"
			],
			message: "Evidence context identifier is stale"
		});
		if (!referenced.has(identifier)) context.addIssue({
			code: "custom",
			path: ["evidence_contexts", index],
			message: "Evidence context is not referenced by a graph fact"
		});
	}
}
function* checkNodesSteps(graph, nodes, context) {
	for (const [index, node] of graph.nodes.entries()) {
		if (index % 256 === 0) yield;
		if (node.node_id !== javaScriptSemanticNodeId(node)) context.addIssue({
			code: "custom",
			path: [
				"nodes",
				index,
				"node_id"
			],
			message: "Node identifier is stale"
		});
		if (node.function_node_id !== null && nodes.get(node.function_node_id)?.kind !== "function") context.addIssue({
			code: "custom",
			path: [
				"nodes",
				index,
				"function_node_id"
			],
			message: "Function owner must name a function node"
		});
	}
}
function* checkRootsSteps(graph, nodes, context) {
	for (const [index, root] of graph.root_node_ids.entries()) {
		if (index % 256 === 0) yield;
		if (!nodes.has(root)) context.addIssue({
			code: "custom",
			path: ["root_node_ids"],
			message: "Root identifier must name a semantic node"
		});
	}
}
function* checkRelationsSteps(graph, nodes, evidenceContexts, context) {
	for (const [index, relation] of graph.relations.entries()) {
		if (index % 256 === 0) yield;
		const { relation_id: identifier, ...semantic } = relation;
		if (identifier !== "jsrg_relation_" + digestCanonicalValue(semantic, "JavaScript semantic graph")) context.addIssue({
			code: "custom",
			path: [
				"relations",
				index,
				"relation_id"
			],
			message: "Relation identifier is stale"
		});
		if (!nodes.has(relation.source_node_id) || !nodes.has(relation.target_node_id)) context.addIssue({
			code: "custom",
			path: ["relations", index],
			message: "Relation endpoints must name semantic nodes"
		});
		if (relation.source_node_id === relation.target_node_id) context.addIssue({
			code: "custom",
			path: ["relations", index],
			message: "Semantic relations cannot be self-referential"
		});
		if (relation.resolution === "candidate" && evidenceContexts.get(relation.evidence.context_id)?.state === "observed") context.addIssue({
			code: "custom",
			path: [
				"relations",
				index,
				"evidence",
				"state"
			],
			message: "Candidate relations cannot claim observed resolution"
		});
	}
}
function* checkUnknownsSteps(graph, nodes, evidenceContexts, context) {
	for (const [index, unknown] of graph.unknowns.entries()) {
		if (index % 256 === 0) yield;
		const { unknown_id: identifier, ...semantic } = unknown;
		if (identifier !== "jsrg_unknown_" + digestCanonicalValue(semantic, "JavaScript semantic graph")) context.addIssue({
			code: "custom",
			path: [
				"unknowns",
				index,
				"unknown_id"
			],
			message: "Unknown frontier identifier is stale"
		});
		if (unknown.node_id !== null && !nodes.has(unknown.node_id)) context.addIssue({
			code: "custom",
			path: [
				"unknowns",
				index,
				"node_id"
			],
			message: "Unknown frontier node is absent"
		});
		if (unknown.candidate_node_ids.some((nodeId) => !nodes.has(nodeId))) context.addIssue({
			code: "custom",
			path: [
				"unknowns",
				index,
				"candidate_node_ids"
			],
			message: "Unknown frontier candidate node is absent"
		});
		if (unknown.relation_kinds.some((kind) => JAVASCRIPT_SEMANTIC_RELATION_FAMILY[kind] !== unknown.family)) context.addIssue({
			code: "custom",
			path: [
				"unknowns",
				index,
				"relation_kinds"
			],
			message: "Unknown relation kinds must belong to their declared family"
		});
		const evidenceState = evidenceContexts.get(unknown.evidence.context_id)?.state;
		if (evidenceState !== "unknown" && evidenceState !== "unavailable") context.addIssue({
			code: "custom",
			path: [
				"unknowns",
				index,
				"evidence",
				"state"
			],
			message: "Unknown frontiers require unknown or unavailable evidence"
		});
	}
}
function* checkFingerprintsSteps(graph, nodes, context) {
	for (const [index, fingerprint] of graph.fingerprints.entries()) {
		if (index % 256 === 0) yield;
		if (nodes.get(fingerprint.function_node_id)?.kind !== "function") context.addIssue({
			code: "custom",
			path: [
				"fingerprints",
				index,
				"function_node_id"
			],
			message: "Fingerprint must name a function node"
		});
		if (fingerprint.fingerprint_sha256 !== digestCanonicalValue(fingerprint.components, "JavaScript semantic graph")) context.addIssue({
			code: "custom",
			path: [
				"fingerprints",
				index,
				"fingerprint_sha256"
			],
			message: "Fingerprint component commitment is stale"
		});
		const expectedIdentifier = "jsrg_fingerprint_" + digestCanonicalValue({
			function_node_id: fingerprint.function_node_id,
			algorithm: fingerprint.algorithm,
			fingerprint_sha256: fingerprint.fingerprint_sha256
		}, "JavaScript semantic graph");
		if (fingerprint.fingerprint_id !== expectedIdentifier) context.addIssue({
			code: "custom",
			path: [
				"fingerprints",
				index,
				"fingerprint_id"
			],
			message: "Fingerprint identifier is stale"
		});
		if (fingerprint.status !== "complete" && fingerprint.limitations.length === 0) context.addIssue({
			code: "custom",
			path: [
				"fingerprints",
				index,
				"limitations"
			],
			message: "Incomplete fingerprints require a limitation"
		});
	}
}
function* checkGraphContentSteps(graph, context) {
	checkCanonicalOrder(graph, context);
	yield* checkEvidenceContextReferencesSteps(graph, context);
	const evidenceContexts = new Map(graph.evidence_contexts.map((evidenceContext) => [evidenceContext.context_id, evidenceContext]));
	const nodes = new Map();
	for (const [index, node] of graph.nodes.entries()) {
		if (index % 256 === 0) yield;
		nodes.set(node.node_id, node);
	}
	yield* checkNodesSteps(graph, nodes, context);
	yield* checkRootsSteps(graph, nodes, context);
	yield* checkRelationsSteps(graph, nodes, evidenceContexts, context);
	yield* checkUnknownsSteps(graph, nodes, evidenceContexts, context);
	checkUnknownReferences(graph, context);
	yield* checkFingerprintsSteps(graph, nodes, context);
	yield* checkCoverageSteps(graph, context);
	if (graph.coverage.status !== "complete" && graph.limitations.length === 0) context.addIssue({
		code: "custom",
		path: ["limitations"],
		message: "Non-complete graph coverage requires a limitation"
	});
}
function* parseAndSealSemanticGraphSteps(container) {
	const issues = [];
	const parsed = {
		...container,
		evidence_contexts: yield* parseElementSteps(semanticGraphShape.evidence_contexts.element, container.evidence_contexts, ["evidence_contexts"], issues),
		nodes: yield* parseElementSteps(semanticGraphShape.nodes.element, container.nodes, ["nodes"], issues),
		relations: yield* parseElementSteps(semanticGraphShape.relations.element, container.relations, ["relations"], issues),
		fingerprints: yield* parseElementSteps(semanticGraphShape.fingerprints.element, container.fingerprints, ["fingerprints"], issues),
		unknowns: yield* parseElementSteps(semanticGraphShape.unknowns.element, container.unknowns, ["unknowns"], issues)
	};
	if (issues.length > 0) throw new z.ZodError(issues);
	return yield* validateAndSealSemanticGraphSteps(normalizeGraphInput(parsed));
}
function* validateAndSealSemanticGraphSteps(semantic) {
	const graph = {
		...semantic,
		graph_id: `jsrg_${yield* canonicalJsonDigestSteps(semantic)}`
	};
	const issues = [];
	yield* checkGraphContentSteps(graph, { addIssue: (issue) => {
		issues.push(issue);
	} });
	if (issues.length > 0) throw new z.ZodError(issues);
	yield* freezeOwnedJsonSnapshotSteps(graph);
	validatedImmutableSemanticGraphs.add(graph);
	return graph;
}
var normalizeEvidence, evidenceContextId, JavaScriptSemanticEvidenceContextRegistry, javaScriptSemanticNodeId, createJavaScriptSemanticGraphNode, createJavaScriptSemanticGraphRelation, createJavaScriptSemanticGraphUnknown, createJavaScriptSemanticFingerprint, sortedUniqueIssue, checkCanonicalOrder, checkUnknownReferences, checkGraphContent, checkGraph, javaScriptSemanticGraphSchema, resolveJavaScriptSemanticEvidence, normalizeGraphInput, createJavaScriptSemanticGraph, validatedImmutableSemanticGraphs, semanticGraphShape, semanticGraphContainerSchema, createImmutableJavaScriptSemanticGraphSteps, sealTransferredJavaScriptSemanticGraphSteps, isValidatedImmutableJavaScriptSemanticGraph;
function init_javascriptSemanticGraph() {
	return (init_javascriptSemanticGraph = __esmMin((() => {
		init_comparisonSemantics();
		init_canonicalDigest();
		init_canonicalOrdering();
		init_unicodeCodePointOrder();
		init_canonicalJsonDigestSteps();
		init_immutableJson();
		init_zodCollectionSteps();
		init_javascriptApplicationEvidenceSchemas();
		init_javascriptSemanticGraphSchemas();
		normalizeEvidence = (evidence) => ({
			...evidence,
			coverage: {
				...evidence.coverage,
				limits: [...evidence.coverage.limits].sort((left, right) => compareUnicodeCodePoints(canonicalJson(left, "JavaScript semantic graph"), canonicalJson(right, "JavaScript semantic graph")))
			},
			limitations: uniqueSorted(evidence.limitations),
			evidence_ids: uniqueSorted(evidence.evidence_ids)
		});
		evidenceContextId = (context) => `jsrg_evidence_${digestCanonicalValue(context, "JavaScript semantic evidence context")}`;
		JavaScriptSemanticEvidenceContextRegistry = class {
			#contexts = new Map();
			#idsByCanonicalContext = new Map();
			/** Intern normalized non-location provenance at fact construction. */
			intern(evidence) {
				const normalized = normalizeEvidence(evidence);
				const { location, ...context } = normalized;
				const canonicalContext = canonicalJson(context, "JavaScript semantic graph");
				const internedId = this.#idsByCanonicalContext.get(canonicalContext);
				if (internedId !== undefined) return {
					context_id: internedId,
					location
				};
				const contextId = evidenceContextId(context);
				if (this.#contexts.has(contextId)) throw new TypeError("JavaScript semantic evidence context digest collision");
				this.#contexts.set(contextId, {
					...context,
					context_id: contextId
				});
				this.#idsByCanonicalContext.set(canonicalContext, contextId);
				return {
					context_id: contextId,
					location
				};
			}
			/** Resolve one already interned fact reference for derived evidence. */
			resolve(reference) {
				const context = this.#contexts.get(reference.context_id);
				if (context === undefined) throw new TypeError("Semantic evidence reference names an absent context");
				const { context_id: _contextId, ...evidenceContext } = context;
				return {
					...evidenceContext,
					location: reference.location
				};
			}
			/** Return the deterministic context table owned by this graph projection. */
			get contexts() {
				return [...this.#contexts.values()].sort((left, right) => compareUnicodeCodePoints(left.context_id, right.context_id));
			}
			/** Release interned contexts after the owning graph is finalized. */
			clear() {
				this.#contexts.clear();
				this.#idsByCanonicalContext.clear();
			}
			/** Validate and intern provenance decoded in this realm from an analysis worker. */
			adopt(input) {
				const context = javaScriptSemanticEvidenceContextSchema.parse(input);
				const { context_id: identifier, ...value } = context;
				if (identifier !== evidenceContextId(value)) throw new TypeError("Transferred semantic evidence context identifier is stale");
				const canonical = canonicalJson(value, "JavaScript semantic evidence context");
				const existing = this.#contexts.get(identifier);
				if (existing !== undefined) {
					const { context_id: _existingIdentifier, ...existingValue } = existing;
					if (canonical !== canonicalJson(existingValue, "JavaScript semantic evidence context")) throw new TypeError("Transferred semantic evidence context digest collision");
				}
				this.#contexts.set(identifier, context);
				this.#idsByCanonicalContext.set(canonical, identifier);
			}
		};
		javaScriptSemanticNodeId = (node) => `jsrg_node_${digestCanonicalValue({
			kind: node.kind,
			identity: node.identity
		}, "JavaScript semantic graph")}`;
		createJavaScriptSemanticGraphNode = (input, evidenceContexts) => {
			const parsed = javaScriptSemanticNodeInputSchema.parse(input);
			const semantic = {
				...parsed,
				application_node_ids: uniqueSorted(parsed.application_node_ids),
				evidence: evidenceContexts.intern(parsed.evidence)
			};
			return {
				...semantic,
				node_id: javaScriptSemanticNodeId(semantic)
			};
		};
		createJavaScriptSemanticGraphRelation = (input, evidenceContexts) => {
			const parsed = javaScriptSemanticRelationInputSchema.parse(input);
			const semantic = {
				...parsed,
				evidence: evidenceContexts.intern(parsed.evidence)
			};
			return {
				...semantic,
				relation_id: `jsrg_relation_${digestCanonicalValue(semantic, "JavaScript semantic graph")}`
			};
		};
		createJavaScriptSemanticGraphUnknown = (input, evidenceContexts) => {
			const parsed = javaScriptSemanticUnknownInputSchema.parse(input);
			const semantic = {
				...parsed,
				relation_kinds: uniqueSorted(parsed.relation_kinds),
				candidate_node_ids: uniqueSorted(parsed.candidate_node_ids),
				evidence: evidenceContexts.intern(parsed.evidence)
			};
			return {
				...semantic,
				unknown_id: `jsrg_unknown_${digestCanonicalValue(semantic, "JavaScript semantic graph")}`
			};
		};
		createJavaScriptSemanticFingerprint = (input, evidenceContexts) => {
			const parsed = javaScriptSemanticFingerprintInputSchema.parse(input);
			const semantic = {
				...parsed,
				components: {
					...parsed.components,
					effects: uniqueSorted(parsed.components.effects)
				},
				limitations: uniqueSorted(parsed.limitations),
				evidence: evidenceContexts.intern(parsed.evidence)
			};
			const fingerprintSha256 = digestCanonicalValue(semantic.components, "JavaScript semantic graph");
			return {
				...semantic,
				fingerprint_sha256: fingerprintSha256,
				fingerprint_id: `jsrg_fingerprint_${digestCanonicalValue({
					function_node_id: semantic.function_node_id,
					algorithm: semantic.algorithm,
					fingerprint_sha256: fingerprintSha256
				}, "JavaScript semantic graph")}`
			};
		};
		sortedUniqueIssue = (values, path, label, context) => {
			for (let index = 1; index < values.length; index += 1) {
				if (compareUnicodeCodePoints(values[index - 1] ?? "", values[index] ?? "") < 0) continue;
				context.addIssue({
					code: "custom",
					path: [...path, index],
					message: `${label} must be sorted and unique`
				});
				return;
			}
		};
		checkCanonicalOrder = (graph, context) => {
			sortedUniqueIssue(graph.root_node_ids, ["root_node_ids"], "Root nodes", context);
			sortedUniqueIssue(graph.evidence_contexts.map(({ context_id }) => context_id), ["evidence_contexts"], "Evidence contexts", context);
			sortedUniqueIssue(graph.nodes.map(({ node_id }) => node_id), ["nodes"], "Nodes", context);
			sortedUniqueIssue(graph.relations.map(({ relation_id }) => relation_id), ["relations"], "Relations", context);
			sortedUniqueIssue(graph.fingerprints.map(({ fingerprint_id }) => fingerprint_id), ["fingerprints"], "Fingerprints", context);
			sortedUniqueIssue(graph.unknowns.map(({ unknown_id }) => unknown_id), ["unknowns"], "Unknown frontiers", context);
			sortedUniqueIssue(graph.limitations, ["limitations"], "Limitations", context);
		};
		checkUnknownReferences = (graph, context) => {
			const unknownIds = new Set(graph.unknowns.map(({ unknown_id }) => unknown_id));
			for (const [index, family] of graph.coverage.families.entries()) if (family.unknown_ids.some((identifier) => !unknownIds.has(identifier))) context.addIssue({
				code: "custom",
				path: [
					"coverage",
					"families",
					index,
					"unknown_ids"
				],
				message: "Family coverage references an absent unknown frontier"
			});
		};
		checkGraphContent = (graph, context) => {
			const steps = checkGraphContentSteps(graph, context);
			while (!steps.next().done) {}
		};
		checkGraph = (graph, context) => {
			checkGraphContent(graph, context);
			const { graph_id: identifier, ...semantic } = graph;
			if (identifier !== "jsrg_" + digestCanonicalValue(semantic, "JavaScript semantic graph")) context.addIssue({
				code: "custom",
				path: ["graph_id"],
				message: "Graph identifier is stale"
			});
		};
		javaScriptSemanticGraphSchema = javaScriptSemanticGraphRecordSchema.superRefine(checkGraph);
		resolveJavaScriptSemanticEvidence = (graph, reference) => {
			const context = graph.evidence_contexts.find(({ context_id }) => context_id === reference.context_id);
			if (context === undefined) throw new TypeError("Semantic evidence reference names an absent context");
			const { context_id: _contextId, ...evidenceContext } = context;
			return {
				...evidenceContext,
				location: reference.location
			};
		};
		normalizeGraphInput = (parsed) => ({
			...parsed,
			root_node_ids: uniqueSorted(parsed.root_node_ids),
			evidence_contexts: [...parsed.evidence_contexts].sort((left, right) => compareUnicodeCodePoints(left.context_id, right.context_id)),
			nodes: [...parsed.nodes].sort((left, right) => compareUnicodeCodePoints(left.node_id, right.node_id)),
			relations: [...parsed.relations].sort((left, right) => compareUnicodeCodePoints(left.relation_id, right.relation_id)),
			fingerprints: [...parsed.fingerprints].sort((left, right) => compareUnicodeCodePoints(left.fingerprint_id, right.fingerprint_id)),
			unknowns: [...parsed.unknowns].sort((left, right) => compareUnicodeCodePoints(left.unknown_id, right.unknown_id)),
			coverage: {
				...parsed.coverage,
				limits: [...parsed.coverage.limits].sort((left, right) => compareUnicodeCodePoints(canonicalJson(left, "JavaScript semantic graph"), canonicalJson(right, "JavaScript semantic graph"))),
				...parsed.coverage.omitted_unknown_occurrences === undefined ? {} : { omitted_unknown_occurrences: [...parsed.coverage.omitted_unknown_occurrences].sort((left, right) => compareUnicodeCodePoints(`${left.family}:${left.reason}`, `${right.family}:${right.reason}`)) },
				families: [...parsed.coverage.families].map((family) => ({
					...family,
					unknown_ids: uniqueSorted(family.unknown_ids)
				})).sort((left, right) => compareUnicodeCodePoints(left.family, right.family))
			},
			limitations: uniqueSorted(parsed.limitations)
		});
		createJavaScriptSemanticGraph = (input) => {
			const semantic = normalizeGraphInput(javaScriptSemanticGraphInputSchema.parse(input));
			const record = {
				...semantic,
				graph_id: `jsrg_${digestCanonicalValue(semantic, "JavaScript semantic graph")}`
			};
			const issues = [];
			checkGraphContent(record, { addIssue: (issue) => {
				issues.push(issue);
			} });
			if (issues.length > 0) throw new z.ZodError(issues);
			return record;
		};
		validatedImmutableSemanticGraphs = new WeakSet();
		semanticGraphShape = javaScriptSemanticGraphInputSchema.shape;
		semanticGraphContainerSchema = javaScriptSemanticGraphInputSchema.extend({
			evidence_contexts: arrayContainerSchema(semanticGraphShape.evidence_contexts),
			nodes: arrayContainerSchema(semanticGraphShape.nodes),
			relations: arrayContainerSchema(semanticGraphShape.relations),
			fingerprints: arrayContainerSchema(semanticGraphShape.fingerprints),
			unknowns: arrayContainerSchema(semanticGraphShape.unknowns)
		});
		createImmutableJavaScriptSemanticGraphSteps = (input) => validateAndSealSemanticGraphSteps(normalizeGraphInput(javaScriptSemanticGraphInputSchema.parse(input)));
		sealTransferredJavaScriptSemanticGraphSteps = (input) => parseAndSealSemanticGraphSteps(semanticGraphContainerSchema.parse(input));
		isValidatedImmutableJavaScriptSemanticGraph = (value) => typeof value === "object" && value !== null && validatedImmutableSemanticGraphs.has(value);
	})))();
}

//#endregion
//#region dist/domain/artifactIntegrityPolicy.js
var artifactIntegrityPolicySchema;
function init_artifactIntegrityPolicy() {
	return (init_artifactIntegrityPolicy = __esmMin((() => {
		artifactIntegrityPolicySchema = z.enum(["fail", "record-and-continue"]).default("fail");
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptApplicationAnalysis.js
function* checkApplicationBindingsSteps(result, context) {
	if (result.semantic_graph.application_graph_id !== result.graph.graph_id) context.addIssue({
		code: "custom",
		path: ["semantic_graph", "application_graph_id"],
		message: "Semantic graph must commit the containing application graph"
	});
	if (result.semantic_graph.root_artifact_sha256 !== result.root_artifact_sha256) context.addIssue({
		code: "custom",
		path: ["semantic_graph", "root_artifact_sha256"],
		message: "Semantic graph must commit the containing root artifact"
	});
	const applicationNodeIds = new Set();
	let examined = 0;
	try {
		for (const node of result.graph.nodes) {
			applicationNodeIds.add(node.node_id);
			if (++examined === 4096) {
				examined = 0;
				yield;
			}
		}
		for (const [nodeIndex, node] of result.semantic_graph.nodes.entries()) {
			if (++examined === 4096) {
				examined = 0;
				yield;
			}
			for (const [identifierIndex, identifier] of node.application_node_ids.entries()) {
				if (!applicationNodeIds.has(identifier)) context.addIssue({
					code: "custom",
					path: [
						"semantic_graph",
						"nodes",
						nodeIndex,
						"application_node_ids",
						identifierIndex
					],
					message: "Semantic node references an absent application node"
				});
				if (++examined === 4096) {
					examined = 0;
					yield;
				}
			}
		}
	} finally {
		applicationNodeIds.clear();
	}
}
/** Reuse exact owned graphs while validating metadata and cross-graph bindings. */
function* parseOwnedJavaScriptApplicationAnalysisSteps(input) {
	if (isValidatedImmutableResult(input)) return input;
	const prepared = ownedAnalysisResultShape.safeParse(input);
	if (prepared.success) {
		const issues = [];
		yield* checkApplicationBindingsSteps(prepared.data, { addIssue: (issue) => {
			issues.push(issue);
		} });
		if (issues.length > 0) throw new z.ZodError(issues);
		return prepared.data;
	}
	const result = javascriptApplicationAnalysisResultSchema.parse(input);
	if (canBorrowParsedJsonSnapshot(input, result)) {
		validatedImmutableResults.add(input);
		return input;
	}
	return result;
}
var countSchema$1, analyzeJavaScriptApplicationInputSchema, electronBoundarySummarySchema, reconstructionStatisticsSchema, applicationAnalysisResultShape, javascriptApplicationAnalysisResultSchema, ownedAnalysisResultShape, validatedImmutableResults, isValidatedImmutableResult;
function init_javascriptApplicationAnalysis() {
	return (init_javascriptApplicationAnalysis = __esmMin((() => {
		init_javascriptRouteInventory();
		init_immutableJson();
		init_javascriptApplicationGraph();
		init_javascriptSemanticGraph();
		init_digests();
		init_artifactGraph();
		init_artifactIntegrityPolicy();
		init_localPath();
		init_javascriptAnalysisResourceControls();
		init_javascriptSourceSelection();
		countSchema$1 = z.int().min(0);
		analyzeJavaScriptApplicationInputSchema = z.strictObject({
			input_path: localPathStringSchema,
			format: z.enum([
				"auto",
				"asar",
				"directory"
			]).default("auto"),
			integrity_policy: artifactIntegrityPolicySchema,
			source_paths: javaScriptSourcePathsSchema.optional(),
			...javaScriptAnalysisResourceControlsSchema.shape
		});
		electronBoundarySummarySchema = z.strictObject({
			browser_windows: countSchema$1,
			explicit_web_preferences: countSchema$1,
			preload_entrypoints: countSchema$1,
			context_bridge_apis: countSchema$1,
			exposed_api_members: countSchema$1,
			ipc: z.strictObject({
				operations: countSchema$1,
				literal_channels: countSchema$1,
				dynamic_channel_operations: countSchema$1,
				renderer_transmissions: countSchema$1,
				renderer_listeners: countSchema$1,
				main_handlers: countSchema$1,
				paired_renderer_transmissions: countSchema$1,
				ambiguous_renderer_transmissions: countSchema$1,
				unpaired_literal_renderer_transmissions: countSchema$1
			}),
			sender_validation_observations: countSchema$1,
			utility_processes: countSchema$1,
			resolved_utility_entrypoints: countSchema$1,
			native_addon_bindings: countSchema$1,
			resolved_native_addon_bindings: countSchema$1
		});
		reconstructionStatisticsSchema = z.strictObject({
			relevant_files: countSchema$1,
			nested_asar_containers: countSchema$1,
			text_bytes_read: countSchema$1,
			invalid_utf8_files: countSchema$1,
			parsed_javascript_files: countSchema$1,
			skipped_javascript_files: countSchema$1.exactOptional(),
			visited_ast_nodes: countSchema$1,
			findings: countSchema$1,
			modules: countSchema$1,
			parse_failures: countSchema$1
		});
		applicationAnalysisResultShape = z.strictObject({
			input_path: z.string().min(1),
			format: z.enum(["asar", "directory"]),
			root_artifact_sha256: digestSchema,
			inventory_manifest_id: prefixedDigestSchema("agm"),
			inventory_graph_sha256: digestSchema,
			integrity_contradictions: z.array(integrityContradictionSchema),
			source_selection: javaScriptSourceSelectionSchema.exactOptional(),
			graph: javascriptApplicationGraphSchema,
			summary: electronBoundarySummarySchema,
			statistics: reconstructionStatisticsSchema,
			limitations: z.array(z.string().min(1)),
			semantic_graph: javaScriptSemanticGraphSchema,
			route_inventory: javaScriptRouteInventorySchema.exactOptional()
		});
		javascriptApplicationAnalysisResultSchema = applicationAnalysisResultShape.superRefine((result, context) => {
			const steps = checkApplicationBindingsSteps(result, context);
			while (!steps.next().done) {}
		});
		ownedAnalysisResultShape = applicationAnalysisResultShape.extend({
			graph: z.custom(isValidatedImmutableJavaScriptApplicationGraph),
			semantic_graph: z.custom(isValidatedImmutableJavaScriptSemanticGraph)
		});
		validatedImmutableResults = new WeakSet();
		isValidatedImmutableResult = (input) => typeof input === "object" && input !== null && validatedImmutableResults.has(input);
	})))();
}

//#endregion
//#region dist/domain/browserDeadline.js
var MAX_BROWSER_DEADLINE_MS, DEFAULT_CDP_COMMAND_TIMEOUT_MS, CDP_DISCOVERY_RESPONSE_TIMEOUT_MS, CDP_CLEANUP_GRACE_MS, optionalBrowserDeadlineMs, selectedBrowserDeadlineMs, browserDeadlineIncrease, browserDeadlineRetry, noRuntimeOverrideSentence, webRuntimeCommandTimeoutSchema, COMMAND_TIMEOUT_OPERATIONS, cdpCommandTimeoutIsSelectable, cdpCommandTimeoutUnrelatedControl, cdpDeadlineSubject, cdpCommandDeadlineRecovery, cdpCleanupGraceExpired, selectedCdpCommandTimeoutMs;
function init_browserDeadline() {
	return (init_browserDeadline = __esmMin((() => {
		MAX_BROWSER_DEADLINE_MS = 2147483647;
		DEFAULT_CDP_COMMAND_TIMEOUT_MS = 2e4;
		CDP_DISCOVERY_RESPONSE_TIMEOUT_MS = 1e4;
		CDP_CLEANUP_GRACE_MS = 5e3;
		optionalBrowserDeadlineMs = (description) => z.number().int().min(1).max(MAX_BROWSER_DEADLINE_MS).optional().describe(description);
		selectedBrowserDeadlineMs = (selected, defaultMs) => selected ?? defaultMs;
		browserDeadlineIncrease = (key, timeoutMs, defaultMs, cli) => timeoutMs < 2147483647 ? `Increase ${key} above ${String(timeoutMs)} (integer milliseconds from 1 to ${String(MAX_BROWSER_DEADLINE_MS)}; omitted means ${String(defaultMs)}), or use ${cli} on the CLI.` : `${key} is already at the maximum ${String(MAX_BROWSER_DEADLINE_MS)} ms; do not increase it further.`;
		browserDeadlineRetry = "Applies on the next call. Allow execution, cleanup and delivery headroom in the outer MCP client deadline. Confirm outstanding work and cleanup before retrying.";
		noRuntimeOverrideSentence = (allowance, unrelatedControl) => `${allowance} This release has no runtime override.${unrelatedControl === undefined ? "" : ` ${unrelatedControl} does not raise it.`}`;
		webRuntimeCommandTimeoutSchema = optionalBrowserDeadlineMs(`CDP WebSocket handshake and per-command response deadline in milliseconds (default ${String(DEFAULT_CDP_COMMAND_TIMEOUT_MS)}). Omitted means ${String(DEFAULT_CDP_COMMAND_TIMEOUT_MS)} and applies on the next call. deadlineExpired for a handshake or command is not the caller observation window, not the ${String(CDP_DISCOVERY_RESPONSE_TIMEOUT_MS)} ms CDP discovery response deadline, and not the ${String(CDP_CLEANUP_GRACE_MS)} ms cleanup grace. It also bounds passive script-source collection and the inspection/source-join phase that share this deadline. Does not raise the fixed protocol, retained-event, or source byte budgets. CDP discovery and cleanup grace have no runtime override.`);
		COMMAND_TIMEOUT_OPERATIONS = new Set([
			"inspect_web_page",
			"analyze_web_bundle",
			"observe_web_session",
			"observe_web_execution",
			"inspect_web_event_listeners",
			"discover_webmcp_tools",
			"capture_web_screenshot",
			"inspect_electron_page",
			"capture_browser_scenario"
		]);
		cdpCommandTimeoutIsSelectable = (operation) => COMMAND_TIMEOUT_OPERATIONS.has(operation);
		cdpCommandTimeoutUnrelatedControl = (operation) => cdpCommandTimeoutIsSelectable(operation) ? "command_timeout_ms" : undefined;
		cdpDeadlineSubject = (timeoutMs, phase, method, selectable) => {
			const budget = selectable ? `${String(timeoutMs)} ms command_timeout_ms` : `fixed ${String(timeoutMs)} ms`;
			if (phase === "handshake") return `CDP WebSocket handshake exceeded its ${budget} deadline (deadlineExpired).`;
			if (phase === "source-join") return `The inspection/source-join phase exceeded its ${budget} deadline (deadlineExpired).`;
			return `CDP command ${method ?? "request"} exceeded its ${budget} response deadline (deadlineExpired).`;
		};
		cdpCommandDeadlineRecovery = (timeoutMs, phase, method, selectable = true) => {
			const subject = cdpDeadlineSubject(timeoutMs, phase, method, selectable);
			if (!selectable) {
				const fixed = noRuntimeOverrideSentence(`${subject} This is not the caller observation window and not the ${String(CDP_DISCOVERY_RESPONSE_TIMEOUT_MS)} ms CDP discovery deadline.`);
				return {
					userMessage: fixed,
					remediationAction: fixed
				};
			}
			return {
				userMessage: `${subject} This is not the caller observation window, not the ${String(CDP_DISCOVERY_RESPONSE_TIMEOUT_MS)} ms CDP discovery deadline, and not the ${String(CDP_CLEANUP_GRACE_MS)} ms cleanup grace.`,
				remediationAction: `${browserDeadlineIncrease("command_timeout_ms", timeoutMs, DEFAULT_CDP_COMMAND_TIMEOUT_MS, "--command-timeout-ms")} ${browserDeadlineRetry} command_timeout_ms does not raise the fixed protocol, retained-event, or source byte budgets, the ${String(CDP_DISCOVERY_RESPONSE_TIMEOUT_MS)} ms CDP discovery response deadline, or the ${String(CDP_CLEANUP_GRACE_MS)} ms cleanup grace. Those have no runtime override.`
			};
		};
		cdpCleanupGraceExpired = () => noRuntimeOverrideSentence(`CDP runtime cleanup exceeded its ${String(CDP_CLEANUP_GRACE_MS)} ms cleanup grace.`, "command_timeout_ms");
		selectedCdpCommandTimeoutMs = (selected) => selectedBrowserDeadlineMs(selected, DEFAULT_CDP_COMMAND_TIMEOUT_MS);
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
//#region dist/domain/recordedTransportUrl.js
/** Separator coordinates shared by name projection and selected-value matching. */
function* queryFields(query) {
	let start = query.startsWith("?") ? 1 : 0;
	let equals = query.indexOf("=", start);
	while (start < query.length) {
		const separator = query.indexOf("&", start);
		const end = separator < 0 ? query.length : separator;
		if (end > start) yield [
			start,
			equals >= start && equals < end ? equals : end,
			end
		];
		start = end + 1;
		if (equals >= 0 && equals < start) equals = query.indexOf("=", start);
	}
}
/** Scan one field at a time; selection avoids decoding unrelated values. */
function* iterateUrlQueryParameters(query, selected) {
	for (const [start, nameEnd, end] of queryFields(query)) {
		const name = formComponent(query.slice(start, nameEnd));
		if (selected === undefined || selected.has(name)) yield [name, formComponent(nameEnd < end ? query.slice(nameEnd + 1, end) : "")];
	}
}
/** WHATWG form-query names, preserving order, repeats and empty names without decoding values. */
function* parseUrlQueryParameterNames(query) {
	for (const [start, nameEnd] of queryFields(query)) yield formComponent(query.slice(start, nameEnd));
}
var parseRecordedTransportUrl, formComponent, singleQueryValues, recordedPathSegments;
function init_recordedTransportUrl() {
	return (init_recordedTransportUrl = __esmMin((() => {
		parseRecordedTransportUrl = (value, options = {}) => {
			const prefix = /^[\x00-\x20]*(?:([A-Za-z][A-Za-z0-9+.-]*):)?\/\//u.exec(value);
			const absolute = URL.parse(value);
			const parsed = absolute ?? URL.parse(value, "https://rea.invalid");
			const hasCredentials = parsed !== null && (parsed.username !== "" || parsed.password !== "");
			const origin = absolute !== null && absolute.origin !== "null" ? absolute.origin : null;
			if (prefix === null) return {
				origin,
				path: null,
				credentials: hasCredentials ? "ambiguous" : null
			};
			const authorityStart = prefix[0].length;
			const protocol = parsed?.protocol ?? `${prefix[1]?.toLowerCase() ?? "https"}:`;
			const special = [
				"ftp:",
				"file:",
				"http:",
				"https:",
				"ws:",
				"wss:"
			].includes(protocol);
			let authorityEnd = authorityStart;
			while (authorityEnd < value.length && !"/?#".includes(value[authorityEnd]) && !(special && value[authorityEnd] === "\\")) authorityEnd += 1;
			const authority = value.slice(authorityStart, authorityEnd);
			const stableAuthority = authority.length > 0 && !/[\t\n\r]/u.test(authority);
			const at = authority.lastIndexOf("@");
			const credentials = !stableAuthority && hasCredentials ? "ambiguous" : at >= 0 ? {
				start: authorityStart,
				end: authorityStart + at + 1
			} : hasCredentials ? "ambiguous" : null;
			if (origin === null || !/^[A-Za-z][A-Za-z0-9+.-]*:\/\//u.test(value) || !stableAuthority || special && value[authorityEnd] === "\\") return {
				origin,
				path: null,
				credentials
			};
			const hash = value.indexOf("#", authorityEnd);
			const question = value.indexOf("?", authorityEnd);
			const hasQuery = question >= 0 && (hash < 0 || question < hash);
			const query = options.includeQuery === true ? { query: absolute.search || (hasQuery ? "?" : "") } : {};
			if (value[authorityEnd] !== "/") return {
				origin,
				path: "/",
				credentials,
				...query
			};
			let pathEnd = authorityEnd;
			while (pathEnd < value.length && !"?#".includes(value[pathEnd])) pathEnd += 1;
			return {
				origin,
				path: value.slice(authorityEnd, pathEnd),
				credentials,
				...query
			};
		};
		formComponent = (raw) => {
			if (!/[%+\uD800-\uDFFF]/u.test(raw)) return raw;
			if (!/[\uD800-\uDFFF]/u.test(raw)) {
				try {
					return decodeURIComponent(raw.replaceAll("+", " "));
				} catch {}
			}
			return new URLSearchParams(`value=${raw}`).get("value") ?? "";
		};
		singleQueryValues = (query) => {
			const values = new Map();
			for (const [name, value] of iterateUrlQueryParameters(query ?? "")) {
				if (values.has(name) && values.get(name) !== value) return undefined;
				values.set(name, value);
			}
			return values;
		};
		recordedPathSegments = (path, indexes) => {
			const needed = new Set();
			for (const index of indexes) if (Number.isSafeInteger(index) && index >= 0) needed.add(index);
			const result = new Map();
			if (needed.size === 0) return result;
			let start = path.indexOf("/");
			if (start < 0) return result;
			start += 1;
			let index = 0;
			while (needed.size > 0) {
				const end = path.indexOf("/", start);
				if (needed.delete(index)) result.set(index, path.slice(start, end < 0 ? path.length : end));
				if (end < 0) break;
				start = end + 1;
				index += 1;
			}
			return result;
		};
	})))();
}

//#endregion
//#region dist/domain/artifactIdentity.js
var logicalPathNfc, normalizeJoinedLogicalPath, logicalPathEscapesRoot, artifactIdForContent, occurrenceIdForLocation, artifactGraphDigest, artifactManifestId, artifactContradictionId, artifactEdgeId;
function init_artifactIdentity() {
	return (init_artifactIdentity = __esmMin((() => {
		init_artifactIntegrity();
		init_canonicalDigest();
		logicalPathNfc = (value) => value.normalize("NFC");
		normalizeJoinedLogicalPath = (value) => {
			if (value.includes("\0")) return value;
			return logicalPathNfc(posix.normalize(value).replace(/^\.\//u, ""));
		};
		logicalPathEscapesRoot = (path) => path.includes("\0") || path === ".." || path.startsWith("../") || path.startsWith("/");
		artifactIdForContent = (sha256) => `art_${digestCanonicalValue({ sha256 }, "Artifact")}`;
		occurrenceIdForLocation = (input) => input.logicalPath === "." ? `occ_${digestCanonicalValue({ root: input.rootArtifactId }, "Artifact")}` : `occ_${digestCanonicalValue({
			root_artifact_id: input.rootArtifactId,
			logical_path: input.logicalPath,
			entry_kind: input.entryKind,
			...input.duplicateOrdinal === undefined ? {} : { duplicate_ordinal: input.duplicateOrdinal }
		}, "Artifact")}`;
		artifactGraphDigest = (input) => digestCanonicalValue({
			nodes: input.nodes,
			occurrences: input.occurrences,
			edges: input.edges,
			integrity_contradictions: input.contradictions
		}, "Artifact");
		artifactManifestId = (rootArtifactId, graphSha256) => `agm_${digestCanonicalValue({
			root_artifact_id: rootArtifactId,
			graph_sha256: graphSha256
		}, "Artifact")}`;
		artifactContradictionId = (input) => `ic_${digestCanonicalValue({
			root_artifact_id: input.rootArtifactId,
			logical_path: input.logicalPath,
			...artifactIntegrityPairOf(input.integrity)
		}, "Artifact")}`;
		artifactEdgeId = (edge, occurrence) => `edge_${digestCanonicalValue({
			parent_artifact_id: edge.parent_artifact_id,
			child_artifact_id: occurrence.artifact_id,
			relation: edge.relation,
			occurrence_id: edge.occurrence_id,
			logical_path: occurrence.logical_path
		}, "Artifact")}`;
	})))();
}

//#endregion
//#region dist/domain/artifactInventoryEvidence.js
var hasCompleteInventoryCoverage, ArtifactInventoryValidationError, ArtifactInventoryCompositionError, ArtifactInventoryCarrierError, parseArtifactInventoryEvidence, parseInspectionEvidencePayload, parseArtifactInspectionInventoryResult, parseInspectionInventoryPayload, validateInspectionSubject, parseArtifactInventoryResult, parseInventoryPage, parseInventoryEvidencePage, validateArtifactInventorySubject, validateInventoryPage, assembleInventoryResults, orderedInventory, orderOccurrences, validateCompleteInventory, validateOccurrence, validateEdge, mergeExact, assertUnique;
function init_artifactInventoryEvidence() {
	return (init_artifactInventoryEvidence = __esmMin((() => {
		init_immutableJson();
		init_artifactGraph();
		init_unicodeCodePointOrder();
		init_comparisonSemantics();
		init_artifactIdentity();
		init_evidenceErrors();
		init_evidenceValidation();
		init_artifactInspection();
		hasCompleteInventoryCoverage = (inventory, requiredScope) => inventory.complete && inventory.coverage.scope === requiredScope && inventory.coverage.status === "complete";
		ArtifactInventoryValidationError = class extends TypeError {
			constructor(message, options) {
				super(message, options);
				this.name = "ArtifactInventoryValidationError";
			}
		};
		ArtifactInventoryCompositionError = class extends ArtifactInventoryValidationError {};
		ArtifactInventoryCarrierError = class extends Error {
			index;
			constructor(message, index = undefined, options) {
				super(message, options);
				this.index = index;
				this.name = "ArtifactInventoryCarrierError";
			}
		};
		parseArtifactInventoryEvidence = (input) => {
			const carriers = Array.isArray(input) ? input : [input];
			if (carriers.length === 0) throw new ArtifactInventoryCarrierError("Artifact inventory requires at least one Evidence carrier");
			const evidence = carriers.map((carrier) => {
				const parsed = readEvidence(carrier);
				if (!parsed.ok) throw parsed.error;
				return parsed.value;
			});
			try {
				const pageGroups = evidence.map((carrier, index) => {
					if (carrier.operation === "inventory_artifact") return [parseInventoryEvidencePage(carrier)];
					if (carrier.operation !== "inspect_artifact") throw new ArtifactInventoryCarrierError("Artifact inventory requires inventory_artifact or inspect_artifact Evidence", index);
					return parseInspectionEvidencePayload(carrier.normalized_result, carrier.subject);
				});
				for (const pages of pageGroups) if (pages.length > 1) assembleInventoryResults(pages);
				try {
					return {
						evidence,
						inventory: assembleInventoryResults(pageGroups.flat())
					};
				} catch (cause) {
					if (!(cause instanceof ArtifactInventoryCompositionError)) throw cause;
					if (pageGroups.length === 1) throw cause;
					throw new ArtifactInventoryCarrierError(cause.message, undefined, { cause });
				}
			} catch (cause) {
				if (cause instanceof ArtifactInventoryCarrierError) throw cause;
				if (!(cause instanceof ArtifactInventoryValidationError)) throw cause;
				throw new EvidenceIntegrityError(cause.message, {
					cause,
					userMessage: cause.message
				});
			}
		};
		parseInspectionEvidencePayload = (input, subject) => {
			try {
				return parseInspectionInventoryPayload(input, subject).pages;
			} catch (cause) {
				if (!(cause instanceof z.ZodError)) throw cause;
				throw new ArtifactInventoryValidationError(cause.message, { cause });
			}
		};
		parseArtifactInspectionInventoryResult = (input, subject) => {
			const parsed = parseInspectionInventoryPayload(input, subject);
			return {
				inspection: parsed.inspection,
				inventory: assembleInventoryResults(parsed.pages),
				evidenceIds: parsed.evidenceIds
			};
		};
		parseInspectionInventoryPayload = (input, subject) => {
			const parsedInspection = artifactInspectionResultSchema.parse(input);
			const inspection = canBorrowParsedJsonSnapshot(input, parsedInspection) ? input : isImmutableJsonSnapshot(input) ? freezeJsonSnapshot(parsedInspection) : parsedInspection;
			const sealedSubsteps = immutableJsonSnapshotMember(inspection, "substeps");
			if (inspection.coverage.substeps_completed !== inspection.substeps.length) throw new ArtifactInventoryValidationError("Artifact inspection substep count does not match its coverage declaration");
			const substeps = inspection.substeps.map((step, index) => {
				const sealedStep = immutableJsonSnapshotMember(sealedSubsteps, String(index));
				const sourceEvidence = immutableJsonSnapshotMember(sealedStep, "evidence") ?? step.evidence;
				const parsedEvidence = safeParseEvidence(sourceEvidence);
				if (!parsedEvidence.ok) throw Object.assign(new z.ZodError(parsedEvidence.error.issues.map((issue) => ({
					...issue,
					path: [
						"substeps",
						index,
						"evidence",
						...issue.path
					]
				}))), { cause: parsedEvidence.error });
				const evidence = canBorrowParsedJsonSnapshot(sourceEvidence, parsedEvidence.value) ? sourceEvidence : parsedEvidence.value;
				immutableJsonSnapshotMember(evidence, "normalized_result");
				if (step.evidence_id !== evidence.evidence_id) throw new ArtifactInventoryValidationError("Artifact inspection substep evidence ID does not match nested Evidence");
				return {
					evidenceId: evidence.evidence_id,
					page: parseInventoryEvidencePage(evidence)
				};
			});
			const firstPage = substeps[0]?.page;
			if (firstPage === undefined) throw new ArtifactInventoryValidationError("Artifact inspection requires inventory substeps");
			validateInspectionSubject(subject, inspection, firstPage.manifest);
			return {
				inspection,
				pages: substeps.map(({ page }) => page),
				evidenceIds: substeps.map(({ evidenceId }) => evidenceId)
			};
		};
		validateInspectionSubject = (subject, inspection, manifest) => {
			if (inspection.subject.manifest_id !== manifest.manifest_id || inspection.subject.root_artifact_id !== manifest.root_artifact_id || inspection.subject.root_sha256 !== manifest.root_sha256 || inspection.subject.root_format !== manifest.root_format) throw new ArtifactInventoryValidationError("Artifact inspection subject does not match its inventory manifest");
			if (subject === null || subject.digest.sha256 !== manifest.root_sha256 || subject.format !== manifest.root_format) throw new ArtifactInventoryValidationError("Artifact inspection Evidence subject does not match its root manifest");
		};
		parseArtifactInventoryResult = (input, subject) => assembleInventoryResults([parseInventoryPage(input, subject)]);
		parseInventoryPage = (input, subject) => {
			const parsed = artifactInventoryResultSchema.parse(input);
			const inventory = canBorrowParsedJsonSnapshot(input, parsed) ? input : isImmutableJsonSnapshot(input) ? freezeJsonSnapshot(parsed) : parsed;
			validateArtifactInventorySubject(subject, inventory.manifest);
			validateInventoryPage(inventory);
			return inventory;
		};
		parseInventoryEvidencePage = (evidence) => {
			if (evidence.operation !== "inventory_artifact") throw new ArtifactInventoryValidationError("Artifact inventory page must be inventory_artifact Evidence");
			try {
				return parseInventoryPage(evidence.normalized_result, evidence.subject);
			} catch (cause) {
				if (!(cause instanceof z.ZodError)) throw cause;
				throw new ArtifactInventoryValidationError(cause.message, { cause });
			}
		};
		validateArtifactInventorySubject = (subject, manifest) => {
			if (subject === null || subject.digest.sha256 !== manifest.root_sha256 || subject.format !== manifest.root_format) throw new ArtifactInventoryValidationError("Artifact inventory Evidence subject does not match its root digest");
		};
		validateInventoryPage = (inventory) => {
			assertUnique(inventory.nodes.map(({ artifact_id: id }) => id), "node ID");
			assertUnique(inventory.occurrences.map(({ occurrence_id: id }) => id), "occurrence ID");
			assertUnique(inventory.edges.map(({ edge_id: id }) => id), "edge ID");
			for (const node of inventory.nodes) if (node.artifact_id !== artifactIdForContent(node.sha256)) throw new ArtifactInventoryValidationError("Artifact node ID is not content-addressed");
		};
		assembleInventoryResults = (pages) => {
			const first = pages[0];
			if (first === undefined) throw new ArtifactInventoryValidationError("Artifact inventory requires Evidence pages");
			const manifestJson = canonicalJson(first.manifest, "Artifact inventory");
			const coverageJson = canonicalJson(first.coverage, "Artifact inventory coverage");
			const nodes = new Map();
			const occurrences = new Map();
			const edges = new Map();
			for (const page of pages) {
				if (canonicalJson(page.manifest, "Artifact inventory") !== manifestJson) throw new ArtifactInventoryCompositionError("Artifact inventory pages do not share one manifest");
				if (canonicalJson(page.coverage, "Artifact inventory coverage") !== coverageJson) throw new ArtifactInventoryCompositionError("Artifact inventory pages do not share one coverage declaration");
				if (canonicalJson(page.integrity_contradictions, "Artifact inventory") !== canonicalJson(first.integrity_contradictions, "Artifact inventory")) throw new ArtifactInventoryCompositionError("Artifact inventory pages do not share integrity contradictions");
				for (const node of page.nodes) mergeExact(nodes, node.artifact_id, node, "node");
				for (const occurrence of page.occurrences) {
					mergeExact(occurrences, occurrence.occurrence_id, occurrence, "occurrence");
				}
				for (const edge of page.edges) mergeExact(edges, edge.edge_id, edge, "edge");
			}
			const inventory = orderedInventory(first, pages, {
				nodes,
				occurrences,
				edges
			});
			if (inventory.complete) validateCompleteInventory(inventory);
			return inventory;
		};
		orderedInventory = (first, pages, values) => {
			const nodes = [...values.nodes.values()].sort((left, right) => compareUnicodeCodePoints(left.artifact_id, right.artifact_id));
			const occurrences = orderOccurrences(first.manifest.root_artifact_id, [...values.occurrences.values()]);
			const edges = [...values.edges.values()].sort((left, right) => compareUnicodeCodePoints(left.edge_id, right.edge_id));
			const limitations = [...new Set(pages.flatMap((inventory) => inventory.limitations))].sort(compareUnicodeCodePoints);
			return {
				manifest: first.manifest,
				nodes,
				occurrences,
				edges,
				integrityContradictions: first.integrity_contradictions,
				limitations,
				coverage: first.coverage,
				complete: nodes.length === first.manifest.node_count && occurrences.length === first.manifest.occurrence_count && edges.length === first.manifest.edge_count
			};
		};
		orderOccurrences = (rootArtifactId, occurrences) => {
			const groups = new Map();
			for (const occurrence of occurrences) {
				const group = groups.get(occurrence.logical_path);
				if (group === undefined) groups.set(occurrence.logical_path, [occurrence]);
				else group.push(occurrence);
			}
			return [...groups].sort(([left], [right]) => compareUnicodeCodePoints(left, right)).flatMap(([path, group]) => {
				if (group.length < 2) return group;
				const ordinalById = new Map();
				const kinds = new Set(group.map(({ entry_kind }) => entry_kind));
				for (let ordinal = 0; ordinal < group.length; ordinal++) {
					for (const entryKind of kinds) ordinalById.set(occurrenceIdForLocation({
						rootArtifactId,
						logicalPath: path,
						entryKind,
						...ordinal === 0 ? {} : { duplicateOrdinal: ordinal }
					}), ordinal);
				}
				return group.sort((left, right) => (ordinalById.get(left.occurrence_id) ?? Number.MAX_SAFE_INTEGER) - (ordinalById.get(right.occurrence_id) ?? Number.MAX_SAFE_INTEGER) || compareUnicodeCodePoints(left.occurrence_id, right.occurrence_id));
			});
		};
		validateCompleteInventory = (inventory) => {
			const nodeIds = new Set(inventory.nodes.map(({ artifact_id: id }) => id));
			const occurrenceIds = new Set(inventory.occurrences.map(({ occurrence_id: id }) => id));
			const rootNode = inventory.nodes.find(({ artifact_id: id }) => id === inventory.manifest.root_artifact_id);
			if (rootNode?.sha256 !== inventory.manifest.root_sha256) throw new ArtifactInventoryValidationError("Artifact root node does not match its manifest digest");
			const rootOccurrence = inventory.occurrences.find(({ logical_path }) => logical_path === ".");
			if (rootOccurrence?.artifact_id !== inventory.manifest.root_artifact_id || rootOccurrence.artifact_format !== inventory.manifest.root_format) throw new ArtifactInventoryValidationError("Artifact root occurrence does not match its manifest representation");
			const duplicateOrdinalByPath = new Map();
			for (const occurrence of inventory.occurrences) {
				const ordinal = duplicateOrdinalByPath.get(occurrence.logical_path) ?? 0;
				duplicateOrdinalByPath.set(occurrence.logical_path, ordinal + 1);
				validateOccurrence(occurrence, inventory, nodeIds, occurrenceIds, ordinal);
			}
			const occurrencesById = new Map(inventory.occurrences.map((occurrence) => [occurrence.occurrence_id, occurrence]));
			for (const edge of inventory.edges) validateEdge(edge, nodeIds, occurrencesById);
			for (const contradiction of inventory.integrityContradictions) {
				if (!nodeIds.has(contradiction.parent_artifact_id) || !occurrenceIds.has(contradiction.occurrence_id)) throw new ArtifactInventoryValidationError("Integrity contradiction references a missing graph member");
				const expectedId = artifactContradictionId({
					rootArtifactId: inventory.manifest.root_artifact_id,
					logicalPath: contradiction.logical_path,
					integrity: contradiction
				});
				if (contradiction.contradiction_id !== expectedId) throw new ArtifactInventoryValidationError("Integrity contradiction ID does not match its identity");
			}
			const graphSha256 = artifactGraphDigest({
				nodes: inventory.nodes,
				occurrences: inventory.occurrences,
				edges: inventory.edges,
				contradictions: inventory.integrityContradictions
			});
			if (graphSha256 !== inventory.manifest.graph_sha256) throw new ArtifactInventoryValidationError("Artifact graph commitment does not match its members");
			const manifestId = artifactManifestId(inventory.manifest.root_artifact_id, graphSha256);
			if (manifestId !== inventory.manifest.manifest_id) throw new ArtifactInventoryValidationError("Artifact manifest ID does not match its commitment");
		};
		validateOccurrence = (occurrence, inventory, nodeIds, occurrenceIds, duplicateOrdinal) => {
			if (occurrence.artifact_id !== null && !nodeIds.has(occurrence.artifact_id)) throw new ArtifactInventoryValidationError("Artifact occurrence references a missing node");
			if (occurrence.parent_occurrence_id !== null && !occurrenceIds.has(occurrence.parent_occurrence_id)) throw new ArtifactInventoryValidationError("Artifact occurrence references a missing parent");
			const expectedId = occurrenceIdForLocation({
				rootArtifactId: inventory.manifest.root_artifact_id,
				logicalPath: occurrence.logical_path,
				entryKind: occurrence.entry_kind,
				...duplicateOrdinal === 0 ? {} : { duplicateOrdinal }
			});
			if (occurrence.occurrence_id !== expectedId) throw new ArtifactInventoryValidationError("Artifact occurrence ID does not match its identity");
		};
		validateEdge = (edge, nodeIds, occurrences) => {
			const occurrence = occurrences.get(edge.occurrence_id);
			if (!nodeIds.has(edge.parent_artifact_id) || occurrence?.artifact_id === null || occurrence === undefined || !nodeIds.has(occurrence.artifact_id)) throw new ArtifactInventoryValidationError("Artifact edge references a missing graph member");
			if (edge.edge_id !== artifactEdgeId(edge, occurrence)) throw new ArtifactInventoryValidationError("Artifact edge ID does not match its identity");
		};
		mergeExact = (output, key, value, label) => {
			const previous = output.get(key);
			if (previous !== undefined && canonicalJson(previous, "Artifact inventory") !== canonicalJson(value, "Artifact inventory")) throw new ArtifactInventoryCompositionError(`Artifact inventory has conflicting ${label} pages`);
			output.set(key, value);
		};
		assertUnique = (values, label) => {
			if (new Set(values).size !== values.length) throw new ArtifactInventoryValidationError(`Artifact inventory contains a duplicate ${label}`);
		};
	})))();
}

//#endregion
//#region dist/domain/managed/managedArtifact.js
var managedMetadataTokenSchema, offsetSchema, cliMetadataGuidSchema, publicKeyIdentitySchema, assemblyIdentitySchema, moduleIdentitySchema, managedArtifactReferenceSchema, managedMetadataSummarySchema, managedTokenIdentityScopeSchema, assemblyReferenceSchema, managedResourceSchema, customAttributeSchema, managedSignatureSchema, managedTypeSchema, managedExportedTypeSchema, managedFieldSchema, managedExceptionRegionSchema, managedInstructionAnchorSchema, managedMethodBodySchema, managedMethodSchema, declaringTypeNameSchema, managedMemberReferenceSchema, managedUserStringSchema, managedModuleReferenceSchema, managedNativeImportSchema, managedNativeImplementationSchema, managedCallEdgeSchema, managedFieldAccessSchema, managedParseIssueSchema, managedArtifactInspectionSchema, managedMemberInspectionSchema, managedNativeBoundaryInspectionSchema;
function init_managedArtifact() {
	return (init_managedArtifact = __esmMin((() => {
		init_digests();
		managedMetadataTokenSchema = z.string().regex(/^0x[0-9a-f]{8}$/u);
		offsetSchema = z.int().min(0);
		cliMetadataGuidSchema = z.string().regex(/^[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$/u);
		publicKeyIdentitySchema = z.object({
			kind: z.enum([
				"none",
				"public-key",
				"public-key-token"
			]),
			byte_length: z.int().min(0),
			sha256: digestSchema.nullable(),
			token: z.string().regex(/^[a-f0-9]{16}$/u).nullable()
		});
		assemblyIdentitySchema = z.object({
			name: z.string(),
			version: z.string().regex(/^\d+\.\d+\.\d+\.\d+$/u),
			culture: z.string().nullable(),
			flags: z.int().min(0).max(4294967295),
			hash_algorithm: z.int().min(0).max(4294967295),
			public_key: publicKeyIdentitySchema,
			token: managedMetadataTokenSchema,
			row_offset: offsetSchema
		});
		moduleIdentitySchema = z.object({
			name: z.string(),
			generation: z.int().min(0).max(65535),
			mvid: cliMetadataGuidSchema.nullable(),
			enc_id: cliMetadataGuidSchema.nullable(),
			enc_base_id: cliMetadataGuidSchema.nullable(),
			token: managedMetadataTokenSchema,
			row_offset: offsetSchema
		});
		managedArtifactReferenceSchema = z.object({
			path: z.string().min(1),
			sha256: digestSchema,
			byte_length: z.int().min(0),
			format: z.literal("pe")
		});
		managedMetadataSummarySchema = z.object({
			status: z.enum([
				"absent",
				"complete",
				"partial",
				"malformed"
			]),
			version: z.string().nullable(),
			table_row_counts: z.record(z.string(), z.int().min(0).max(4294967295))
		});
		managedTokenIdentityScopeSchema = z.object({
			token_identity: z.literal("build-local"),
			requires_artifact_sha256: digestSchema,
			requires_mvid: cliMetadataGuidSchema.nullable()
		});
		assemblyReferenceSchema = z.object({
			name: z.string(),
			version: z.string().regex(/^\d+\.\d+\.\d+\.\d+$/u),
			culture: z.string().nullable(),
			flags: z.int().min(0).max(4294967295),
			public_key_or_token: publicKeyIdentitySchema,
			hash_value_sha256: digestSchema.nullable(),
			hash_value_length: z.int().min(0),
			token: managedMetadataTokenSchema,
			row_offset: offsetSchema
		});
		managedResourceSchema = z.object({
			name: z.string(),
			flags: z.int().min(0).max(4294967295),
			visibility: z.enum([
				"public",
				"private",
				"unknown"
			]),
			implementation_token: managedMetadataTokenSchema.nullable(),
			embedded: z.boolean(),
			declared_offset: z.int().min(0).max(4294967295),
			data_length: z.int().min(0).nullable(),
			data_sha256: digestSchema.nullable(),
			token: managedMetadataTokenSchema,
			row_offset: offsetSchema
		});
		customAttributeSchema = z.object({
			parent_token: managedMetadataTokenSchema,
			constructor_token: managedMetadataTokenSchema.nullable(),
			type_name: z.string().nullable(),
			value_length: z.int().min(0),
			value_sha256: digestSchema,
			decoded_fixed_string: z.string().nullable(),
			token: managedMetadataTokenSchema,
			row_offset: offsetSchema
		});
		managedSignatureSchema = z.object({
			raw_length: z.int().min(0),
			raw_sha256: digestSchema,
			resolved_sha256: digestSchema.nullable().default(null).describe("SHA-256 of the raw signature with each TypeDef or TypeRef operand replaced by that type's namespace-qualified name; equals raw_sha256 when the signature names no types. Unlike raw_sha256 it does not depend on build-local metadata rows. Null when the signature could not be decoded or names a type REA could not resolve, such as a TypeSpec."),
			kind: z.enum([
				"method",
				"field",
				"unknown"
			]),
			parse_status: z.enum([
				"decoded",
				"partial",
				"unsupported",
				"malformed"
			]),
			calling_convention: z.string().nullable(),
			generic_parameter_count: z.int().min(0).nullable(),
			parameter_count: z.int().min(0).nullable(),
			return_type: z.string().nullable(),
			parameter_types: z.array(z.string()),
			field_type: z.string().nullable(),
			issue: z.string().nullable()
		});
		managedTypeSchema = z.object({
			token: managedMetadataTokenSchema,
			row_offset: offsetSchema,
			namespace: z.string(),
			name: z.string(),
			full_name: z.string(),
			name_sha256: digestSchema.nullable().default(null).describe("Framed nominal namespace/name/enclosing-name digest, independent of build-local rows. Null for historical Evidence or unresolved nesting; defining assemblies and CLR runtime identity are not established."),
			flags: z.int().min(0).max(4294967295),
			extends_token: managedMetadataTokenSchema.nullable(),
			enclosing_type_token: managedMetadataTokenSchema.nullable().default(null).describe("Observed enclosing TypeDef from NestedClass; null when no enclosing entry was available, which alone does not establish top-level identity."),
			field_list: z.object({
				first_row: z.int().min(1).nullable(),
				last_row: z.int().min(0).nullable(),
				count: z.int().min(0)
			}),
			method_list: z.object({
				first_row: z.int().min(1).nullable(),
				last_row: z.int().min(0).nullable(),
				count: z.int().min(0)
			})
		});
		managedExportedTypeSchema = z.object({
			token: managedMetadataTokenSchema,
			row_offset: offsetSchema,
			namespace: z.string(),
			name: z.string(),
			flags: z.int().min(0).max(4294967295),
			forwarder: z.boolean(),
			type_def_id: z.int().min(0).max(4294967295),
			implementation_token: managedMetadataTokenSchema.nullable()
		});
		managedFieldSchema = z.object({
			token: managedMetadataTokenSchema,
			row_offset: offsetSchema,
			declaring_type_token: managedMetadataTokenSchema.nullable(),
			declaring_type: z.string().nullable(),
			name: z.string(),
			flags: z.int().min(0).max(65535),
			signature: managedSignatureSchema
		});
		managedExceptionRegionSchema = z.object({
			flags: z.int().min(0).max(4294967295),
			try_offset: z.int().min(0),
			try_length: z.int().min(0),
			handler_offset: z.int().min(0),
			handler_length: z.int().min(0),
			class_token: managedMetadataTokenSchema.nullable().describe("Raw build-local catch type token; not a cross-artifact identity"),
			/** Resolved from this artifact's own metadata; raw token remains build-local. */
			class_type: z.string().nullable().default(null),
			class_type_name_sha256: digestSchema.nullable().default(null).describe("Nested nominal TypeDef/TypeRef name digest; assembly scope is compared separately and local tokens are not cross-artifact identities"),
			class_type_identity_resolved: z.boolean().nullable().default(null).describe("Whether this artifact's local token identifies the reported catch type; null when unexamined"),
			filter_offset: z.int().min(0).nullable()
		});
		managedInstructionAnchorSchema = z.object({
			il_offset: z.int().min(0),
			opcode: z.string().min(1),
			operand_kind: z.enum([
				"none",
				"branch",
				"constant",
				"field",
				"method",
				"signature",
				"string",
				"switch",
				"token",
				"type",
				"variable",
				"unknown"
			]),
			operand: z.string().nullable()
		});
		managedMethodBodySchema = z.object({
			status: z.enum([
				"present",
				"partial",
				"absent",
				"malformed"
			]),
			header_format: z.enum([
				"tiny",
				"fat",
				"none",
				"unknown"
			]),
			rva: z.int().min(0).max(4294967295),
			file_offset: offsetSchema.nullable(),
			max_stack: z.int().min(0).nullable(),
			init_locals: z.boolean().nullable(),
			local_var_sig_token: managedMetadataTokenSchema.nullable(),
			il_size: z.int().min(0),
			il_sha256: digestSchema.nullable().describe("SHA-256 of exactly the raw il_size CIL bytes; excludes the method header, locals signature, alignment, and extra sections"),
			normalized_il_sha256: digestSchema.nullable().describe("Member-result-v1 SHA-256 of UTF-8 JSON [opcode, operand_kind, operand] tuples for a complete decode; retains build-local tokens, omits switch targets, and excludes headers, locals, and exception regions"),
			instruction_count: z.int().min(0),
			decoded_instruction_count: z.int().min(0),
			truncated_instructions: z.int().min(0),
			opcode_counts: z.record(z.string(), z.int().min(1)),
			anchors: z.array(managedInstructionAnchorSchema),
			exception_regions: z.array(managedExceptionRegionSchema),
			issue: z.string().nullable()
		});
		managedMethodSchema = z.object({
			token: managedMetadataTokenSchema,
			row_offset: offsetSchema,
			declaring_type_token: managedMetadataTokenSchema.nullable(),
			declaring_type: z.string().nullable(),
			name: z.string(),
			rva: z.int().min(0).max(4294967295),
			impl_flags: z.int().min(0).max(65535),
			flags: z.int().min(0).max(65535),
			signature: managedSignatureSchema,
			body: managedMethodBodySchema
		});
		declaringTypeNameSchema = z.string().nullable().default(null);
		managedMemberReferenceSchema = z.object({
			token: managedMetadataTokenSchema,
			row_offset: offsetSchema,
			parent_token: managedMetadataTokenSchema.nullable(),
			parent_name: declaringTypeNameSchema.describe("Name of a TypeDef, TypeRef, or generic-instantiation TypeSpec parent; null for other parents or when unknown"),
			name: z.string(),
			signature: managedSignatureSchema
		});
		managedUserStringSchema = z.object({
			token: managedMetadataTokenSchema,
			offset: offsetSchema.describe("File offset of the #US item"),
			value: z.string().describe("Decoded UTF-16 code units, excluding the terminal flag byte; unpaired surrogates are kept")
		});
		managedModuleReferenceSchema = z.object({
			token: managedMetadataTokenSchema,
			row_offset: offsetSchema,
			name: z.string()
		});
		managedNativeImportSchema = z.object({
			token: managedMetadataTokenSchema,
			row_offset: offsetSchema,
			mapping_flags: z.int().min(0).max(65535),
			mapping_flags_hex: z.string().regex(/^0x[0-9a-f]{4}$/u),
			member_token: managedMetadataTokenSchema.nullable(),
			member_kind: z.enum([
				"method",
				"field",
				"unknown"
			]),
			member_name: z.string().nullable(),
			import_name: z.string(),
			import_scope_token: managedMetadataTokenSchema.nullable(),
			import_scope_name: z.string().nullable(),
			no_mangle: z.boolean(),
			char_set: z.enum([
				"not-specified",
				"ansi",
				"unicode",
				"auto",
				"unknown"
			]),
			call_convention: z.enum([
				"not-specified",
				"winapi",
				"cdecl",
				"stdcall",
				"thiscall",
				"fastcall",
				"unknown"
			]),
			supports_last_error: z.boolean(),
			best_fit: z.enum([
				"assembly-default",
				"enabled",
				"disabled",
				"unknown"
			]),
			throw_on_unmappable_char: z.enum([
				"assembly-default",
				"enabled",
				"disabled",
				"unknown"
			]),
			verification: z.literal("managed-declaration-only")
		});
		managedNativeImplementationSchema = z.object({
			token: managedMetadataTokenSchema,
			row_offset: offsetSchema,
			name: z.string(),
			rva: z.int().min(0).max(4294967295),
			flags: z.int().min(0).max(65535),
			impl_flags: z.int().min(0).max(65535),
			code_type: z.enum([
				"il",
				"native",
				"optil",
				"runtime",
				"unknown"
			]),
			managed_kind: z.enum([
				"managed",
				"unmanaged",
				"unknown"
			]),
			pinvoke_declared: z.boolean(),
			boundary_kind: z.enum([
				"pinvoke",
				"native-body",
				"runtime-provided",
				"unmanaged-method",
				"mixed-or-unknown"
			]),
			body_interpretation: z.enum([
				"managed-cil",
				"native-or-runtime",
				"not-file-backed",
				"unknown"
			])
		});
		managedCallEdgeSchema = z.object({
			caller_token: managedMetadataTokenSchema,
			il_offset: offsetSchema.nullable().default(null),
			target_identity_sha256: digestSchema.nullable().default(null).describe("Nominal declaring-type/name/signature digest; null when unresolved or unrecorded. Does not establish assembly or runtime binding."),
			caller: z.string().nullable(),
			opcode: z.string(),
			target_token: managedMetadataTokenSchema,
			target_kind: z.enum([
				"method-def",
				"member-ref",
				"method-spec",
				"unknown"
			]),
			target_name: z.string().nullable().describe("Method name; a method-spec target reports its generic method"),
			target_declaring_type: declaringTypeNameSchema.describe("Declaring type of the called method; null when unknown")
		});
		managedFieldAccessSchema = z.object({
			method_token: managedMetadataTokenSchema,
			il_offset: offsetSchema.nullable().default(null),
			target_identity_sha256: digestSchema.nullable().default(null).describe("Nominal declaring-type/name/signature digest; null when unresolved or unrecorded. Does not establish assembly or runtime binding."),
			method: z.string().nullable(),
			opcode: z.string(),
			field_token: managedMetadataTokenSchema,
			field_name: z.string().nullable(),
			field_declaring_type: declaringTypeNameSchema.describe("Declaring type of the accessed field; null when unknown")
		});
		managedParseIssueSchema = z.object({
			code: z.enum([
				"resource-limit",
				"invalid-cli-header",
				"invalid-directory",
				"invalid-metadata-root",
				"invalid-stream",
				"missing-stream",
				"invalid-tables",
				"unsupported-metadata",
				"invalid-row",
				"invalid-heap-index",
				"invalid-string",
				"invalid-blob",
				"unsupported-signature",
				"invalid-guid",
				"invalid-resource"
			]),
			scope: z.string().min(1),
			offset: offsetSchema.nullable(),
			detail: z.string().min(1)
		});
		managedArtifactInspectionSchema = z.object({
			artifact: managedArtifactReferenceSchema,
			pe: z.object({
				machine: z.int().min(0).max(65535),
				machine_hex: z.string().regex(/^0x[0-9a-f]{4}$/u),
				architecture: z.enum([
					"x86",
					"x86_64",
					"arm",
					"arm64"
				]),
				optional_header: z.enum(["pe32", "pe32-plus"]),
				section_count: z.int().min(1).max(65535),
				characteristics: z.int().min(0).max(65535),
				cli: z.object({
					header_offset: offsetSchema,
					header_size: z.int().min(72),
					runtime_version: z.string(),
					flags: z.int().min(0).max(4294967295),
					flag_names: z.array(z.string()),
					entry_point: z.object({
						kind: z.enum([
							"metadata-token",
							"native-rva",
							"none"
						]),
						value: z.string().nullable()
					}),
					metadata_rva: z.int().min(1).max(4294967295),
					metadata_size: z.int().min(1).max(4294967295),
					resources_rva: z.int().min(0).max(4294967295),
					resources_size: z.int().min(0).max(4294967295),
					strong_name_rva: z.int().min(0).max(4294967295),
					strong_name_size: z.int().min(0).max(4294967295),
					managed_native_header_rva: z.int().min(0).max(4294967295),
					managed_native_header_size: z.int().min(0).max(4294967295),
					ready_to_run_signature: z.boolean()
				}).nullable()
			}),
			classification: z.object({
				status: z.enum([
					"managed",
					"not-managed",
					"malformed"
				]),
				container: z.literal("pe"),
				runtime_family: z.enum([
					"dotnet-framework",
					"modern-dotnet",
					"unity-mono",
					"mixed-clr-native",
					"unknown"
				]),
				implementation: z.enum([
					"cil",
					"cil-and-ready-to-run",
					"cpp-cli-mixed",
					"metadata-only",
					"not-managed",
					"unknown"
				]),
				managed_architecture: z.enum([
					"anycpu",
					"anycpu-prefer-32",
					"x86",
					"x86_64",
					"arm",
					"arm64",
					"unknown"
				]),
				evidence: z.array(z.object({
					code: z.string().min(1),
					detail: z.string().min(1),
					file_offset: offsetSchema.nullable()
				}))
			}),
			metadata: z.object({
				status: z.enum([
					"absent",
					"complete",
					"partial",
					"malformed"
				]),
				version: z.string().nullable(),
				stream_names: z.array(z.string()),
				table_row_counts: z.record(z.string(), z.int().min(0).max(4294967295))
			}),
			module: moduleIdentitySchema.nullable(),
			assembly: assemblyIdentitySchema.nullable(),
			target_frameworks: z.array(z.string()),
			references: z.array(assemblyReferenceSchema),
			resources: z.array(managedResourceSchema),
			attributes: z.array(customAttributeSchema),
			coverage: z.object({
				state: z.enum([
					"complete",
					"partial",
					"unavailable"
				]),
				issues: z.array(managedParseIssueSchema)
			}),
			limitations: z.array(z.string())
		});
		managedMemberInspectionSchema = z.object({
			signature_resolution: z.literal("type-names-v1").nullable().default(null).describe("Signature type-name resolution was examined, including unresolved operands; null means no attestation, including historical or capacity-limited Evidence."),
			artifact: managedArtifactReferenceSchema,
			module: moduleIdentitySchema.nullable(),
			assembly: assemblyIdentitySchema.nullable().default(null),
			metadata: managedMetadataSummarySchema,
			identity_scope: managedTokenIdentityScopeSchema,
			types: z.array(managedTypeSchema),
			nesting_read: z.boolean().nullable().default(null).describe("Whether all NestedClass rows were read and valid. Null for historical Evidence; false means current nesting is incomplete. Individual name digests can remain unresolved for missing, cyclic or over-deep enclosing chains."),
			exported_types: z.array(managedExportedTypeSchema).nullable().default(null),
			fields: z.array(managedFieldSchema),
			methods: z.array(managedMethodSchema),
			member_refs: z.array(managedMemberReferenceSchema),
			call_edges: z.array(managedCallEdgeSchema),
			field_accesses: z.array(managedFieldAccessSchema),
			user_strings: z.object({
				state: z.enum(["complete", "partial"]),
				literals: z.array(managedUserStringSchema),
				issues: z.array(managedParseIssueSchema)
			}).nullable().default(null),
			/** Caller-selected declaring types; null when every type was inspected. */
			selection: z.object({
				type_names: z.array(z.string().min(1)).min(1),
				unmatched_type_names: z.array(z.string().min(1))
			}).nullable().default(null),
			method_rows: z.object({
				offset: z.int().nonnegative(),
				count: z.int().nonnegative(),
				total: z.int().nonnegative()
			}).nullable().default(null).describe("Examined zero-based MethodDef row interval before declaring-type selection; null means the row scope was not recorded. Row coordinates are build-local and cannot prove cross-build member absence for a page."),
			coverage: z.object({
				state: z.enum([
					"complete",
					"partial",
					"unavailable"
				]),
				issues: z.array(managedParseIssueSchema)
			}),
			limitations: z.array(z.string())
		});
		managedNativeBoundaryInspectionSchema = z.object({
			artifact: managedArtifactReferenceSchema,
			module: moduleIdentitySchema.nullable(),
			metadata: managedMetadataSummarySchema,
			identity_scope: managedTokenIdentityScopeSchema,
			cli_native: z.object({
				il_only: z.boolean(),
				requires_32bit: z.boolean(),
				strong_name_signed: z.boolean(),
				native_entry_point: z.boolean(),
				ready_to_run_signature: z.boolean(),
				managed_native_header_rva: z.int().min(0).max(4294967295),
				managed_native_header_size: z.int().min(0).max(4294967295)
			}).nullable(),
			module_refs: z.array(managedModuleReferenceSchema),
			pinvoke_imports: z.array(managedNativeImportSchema),
			native_implementations: z.array(managedNativeImplementationSchema),
			summary: z.object({
				module_ref_count: z.int().min(0),
				pinvoke_import_count: z.int().min(0),
				native_implementation_count: z.int().min(0),
				ready_to_run: z.boolean().nullable(),
				mixed_mode_or_native_header: z.boolean().nullable()
			}),
			coverage: z.object({
				state: z.enum([
					"complete",
					"partial",
					"unavailable"
				]),
				issues: z.array(managedParseIssueSchema)
			}),
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/domain/wasm/wasmInterface.js
var kind, valueType, limit, signature, wasmInterfaceSchema, WASM_INTERFACE_REPRESENTATION_BYTES, wasmInterfaceEntryRepresentationBytes;
function init_wasmInterface() {
	return (init_wasmInterface = __esmMin((() => {
		kind = z.enum([
			"func",
			"table",
			"memory",
			"global",
			"tag",
			"unknown"
		]);
		valueType = z.enum([
			"i32",
			"i64",
			"f32",
			"f64",
			"v128",
			"funcref",
			"externref"
		]);
		limit = z.string().regex(/^(?:0|[1-9][0-9]*)$/u);
		signature = z.discriminatedUnion("kind", [
			z.object({
				kind: z.literal("func"),
				params: z.array(valueType),
				results: z.array(valueType)
			}),
			z.object({
				kind: z.literal("tag"),
				params: z.array(valueType),
				results: z.array(valueType)
			}),
			z.object({
				kind: z.literal("table"),
				element: z.enum(["funcref", "externref"]),
				address_type: z.enum(["i32", "i64"]),
				minimum: limit,
				maximum: limit.nullable(),
				shared: z.boolean()
			}),
			z.object({
				kind: z.literal("memory"),
				page_size: limit,
				address_type: z.enum(["i32", "i64"]),
				minimum: limit,
				maximum: limit.nullable(),
				shared: z.boolean()
			}),
			z.object({
				kind: z.literal("global"),
				value_type: valueType,
				mutable: z.boolean()
			})
		]);
		wasmInterfaceSchema = z.object({
			state: z.enum(["complete", "partial"]),
			entries: z.array(z.object({
				direction: z.enum(["import", "export"]),
				module: z.string().nullable(),
				name: z.string(),
				kind,
				index: z.int().nonnegative().max(4294967295).nullable(),
				signature: signature.nullable(),
				wat_form: z.string(),
				issue: z.string().nullable()
			}).superRefine((entry, context) => {
				if (entry.direction === "export" && entry.module !== null || entry.direction === "import" && entry.module === null) context.addIssue({
					code: "custom",
					message: "Interface direction does not match module-name presence"
				});
				if (entry.signature !== null && entry.signature.kind !== entry.kind) context.addIssue({
					code: "custom",
					message: "Interface kind does not match its typed signature"
				});
			})),
			issues: z.array(z.string())
		});
		WASM_INTERFACE_REPRESENTATION_BYTES = 32 * 1024 * 1024;
		wasmInterfaceEntryRepresentationBytes = (entry) => {
			let bytes = 1024 + [
				entry.module,
				entry.name,
				entry.wat_form,
				entry.issue
			].reduce((sum, value) => sum + (value?.length ?? 0) * 6, 0);
			const signature = entry.signature;
			if (signature?.kind === "func" || signature?.kind === "tag") bytes += (signature.params.length + signature.results.length) * 16;
			else if (signature !== null) {
				for (const value of Object.values(signature)) if (typeof value === "string") bytes += value.length * 6;
			}
			return bytes;
		};
	})))();
}

//#endregion
//#region dist/domain/wasm/wasmArtifact.js
var digest, artifact, DEFAULT_WASM_COMMAND_TIMEOUT_MS, MAX_WASM_COMMAND_TIMEOUT_MS, wasmArtifactPathsSchema, inspectWasmArtifactInputSchema, wasmArtifactSchema, wasmArtifactMatchesSubject;
function init_wasmArtifact() {
	return (init_wasmArtifact = __esmMin((() => {
		init_wasmInterface();
		init_localPath();
		digest = z.string().regex(/^[a-f0-9]{64}$/);
		artifact = z.strictObject({
			path: z.string().min(1),
			sha256: digest,
			bytes: z.int().nonnegative()
		});
		DEFAULT_WASM_COMMAND_TIMEOUT_MS = 3e4;
		MAX_WASM_COMMAND_TIMEOUT_MS = 2147483647;
		wasmArtifactPathsSchema = (pathSchema = absoluteLocalPathStringSchema) => z.array(pathSchema).max(16);
		inspectWasmArtifactInputSchema = z.strictObject({
			path: absoluteLocalPathStringSchema.describe("Absolute selected local WASM artifact path"),
			glue_paths: wasmArtifactPathsSchema().default([]),
			candidate_paths: wasmArtifactPathsSchema().default([]),
			command_timeout_ms: z.number().int().min(1).max(MAX_WASM_COMMAND_TIMEOUT_MS).exactOptional().describe(`Deadline in milliseconds for each WABT version/analysis command (default ${String(DEFAULT_WASM_COMMAND_TIMEOUT_MS)}), not the whole inspection. Allow additional client time for all commands, file checks and cleanup. Input/output safety limits remain fixed.`)
		});
		wasmArtifactSchema = z.strictObject({
			artifact,
			validation: z.literal("valid"),
			sections: z.array(z.strictObject({
				kind: z.string().min(1),
				start: z.int().nonnegative(),
				end: z.int().nonnegative(),
				bytes: z.int().nonnegative(),
				description: z.string()
			})),
			interface: wasmInterfaceSchema.exactOptional(),
			imports: z.array(z.string()),
			exports: z.array(z.string()),
			debug_name_metadata: z.enum([
				"unknown",
				"not-present",
				"complete",
				"uninterpretable"
			]).default("unknown"),
			custom_section_warnings: z.array(z.strictObject({
				tool: z.enum([
					"wasm-validate",
					"wasm-objdump",
					"wasm2wat"
				]),
				text: z.string().min(1)
			})).nullable().default(null),
			headers: z.string(),
			details: z.string(),
			wat: z.strictObject({
				text: z.string().min(1),
				sha256: digest,
				representation: z.literal("decoded-wat")
			}),
			tool_profile: z.strictObject({
				source: z.literal("https://github.com/WebAssembly/wabt"),
				release: z.literal("1.0.42"),
				source_commit: z.literal("ff0ef7e0009402740c805a9744c09b05be063e48"),
				commands: z.array(z.strictObject({
					tool: z.enum([
						"wasm-validate",
						"wasm-objdump",
						"wasm2wat"
					]),
					path: z.string().min(1),
					sha256: digest,
					version_banner: z.string(),
					arguments: z.array(z.string())
				})).length(3),
				timeout_ms: z.int().positive(),
				output_budget_bytes: z.int().positive()
			}),
			candidates: z.array(artifact),
			glue: z.array(z.strictObject({
				artifact,
				parse_status: z.enum([
					"complete",
					"partial",
					"failed"
				]),
				references: z.array(z.strictObject({
					value: z.string(),
					line: z.int().positive(),
					column: z.int().nonnegative(),
					candidate_paths: z.array(z.string()),
					association: z.enum([
						"local-path-candidate",
						"basename-candidates",
						"unresolved"
					]),
					evidence_kind: z.literal("static-literal")
				}))
			})),
			runtime_execution: z.literal("not-performed"),
			network_fetch: z.literal("not-performed"),
			limitations: z.array(z.string())
		}).superRefine((value, context) => {
			if (createHash("sha256").update(value.wat.text, "utf8").digest("hex") !== value.wat.sha256) context.addIssue({
				code: "custom",
				path: ["wat", "sha256"],
				message: "Decoded WAT digest does not match its UTF-8 text."
			});
			const selected = value.candidates[0];
			if (selected?.path !== value.artifact.path || selected.sha256 !== value.artifact.sha256 || selected.bytes !== value.artifact.bytes) context.addIssue({
				code: "custom",
				path: ["candidates"],
				message: "Selected candidate does not match artifact identity."
			});
			const tolerantCustomSections = value.tool_profile.commands[0]?.arguments.includes("--ignore-custom-section-errors");
			for (const [index, command] of value.tool_profile.commands.entries()) {
				const expected = [
					"wasm-validate",
					"wasm-objdump",
					"wasm2wat"
				][index];
				const argumentsExpected = command.tool === "wasm-objdump" ? [
					"-h",
					"-x",
					"module.wasm"
				] : tolerantCustomSections ? [
					"--enable-all",
					"--ignore-custom-section-errors",
					"module.wasm"
				] : ["--enable-all", "module.wasm"];
				if (command.tool !== expected || command.version_banner.trim() !== "1.0.42" || JSON.stringify(command.arguments) !== JSON.stringify(argumentsExpected)) context.addIssue({
					code: "custom",
					path: [
						"tool_profile",
						"commands",
						index
					],
					message: "Unexpected WABT command profile."
				});
			}
			for (const [index, section] of value.sections.entries()) if (section.end > value.artifact.bytes || section.end - section.start !== section.bytes) context.addIssue({
				code: "custom",
				path: ["sections", index],
				message: "Section range does not match selected artifact bytes."
			});
		});
		wasmArtifactMatchesSubject = (artifact, subject) => subject != null && subject.path === artifact.path && subject.sha256 === artifact.sha256 && subject.format === "file";
	})))();
}

//#endregion
//#region dist/domain/jsonShape.js
/** Keep traversal scratch proportional to nesting rather than a wide input array. */
function* shapeChildren(value) {
	if (Array.isArray(value)) {
		for (const item of value) yield [arrayElementKey, item];
	} else if (isRecord(value)) {
		for (const key in value) if (Object.hasOwn(value, key)) yield [key, value[key]];
	}
}
var jsonValueTypeSchema, jsonShapePathSegmentSchema, jsonShapeSchema, arrayElementKey, propertyBaseBytes, digits, inferJsonShape, parseJsonObject, jsonValueType, isRecord, orderedChildren;
function init_jsonShape() {
	return (init_jsonShape = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_safeJson();
		init_jsonStringByteLength();
		init_jsonValueByteLength();
		init_result();
		jsonValueTypeSchema = z.enum([
			"object",
			"array",
			"string",
			"number",
			"boolean",
			"null"
		]);
		jsonShapePathSegmentSchema = z.discriminatedUnion("kind", [z.object({
			kind: z.literal("property"),
			name: z.string()
		}), z.object({ kind: z.literal("array-element") })]);
		jsonShapeSchema = z.object({
			root_type: jsonValueTypeSchema,
			node_count: z.int().min(1),
			max_depth_observed: z.int().min(0),
			properties: z.array(z.object({
				path: z.array(jsonShapePathSegmentSchema).min(1),
				types: z.array(jsonValueTypeSchema).min(1),
				observations: z.int().min(1)
			}))
		});
		arrayElementKey = Symbol("array-element");
		propertyBaseBytes = jsonValueByteLength({
			path: [],
			types: [],
			observations: 0
		});
		digits = (value) => String(value).length;
		inferJsonShape = (source, maximumBytes) => {
			if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 0) throw new RangeError("JSON shape byte allowance must be a non-negative safe integer");
			let text;
			try {
				text = typeof source === "string" ? source : new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				}).decode(source);
			} catch {
				return err({ kind: "invalid-json" });
			}
			const parsed = safeParseJson(text);
			if (!parsed.ok) return err({ kind: "invalid-json" });
			const root = parsed.value;
			const rootType = jsonValueType(root);
			let serializedBytes = jsonValueByteLength({
				root_type: rootType,
				node_count: 0,
				max_depth_observed: 0,
				properties: []
			});
			let requiredBytesAtLeast = serializedBytes;
			const capacity = () => err({
				kind: "capacity",
				maximumBytes,
				requiredBytesAtLeast
			});
			const reserve = (bytes) => {
				requiredBytesAtLeast = serializedBytes + bytes;
				if (requiredBytesAtLeast > maximumBytes) return false;
				serializedBytes = requiredBytesAtLeast;
				return true;
			};
			if (serializedBytes > maximumBytes) return capacity();
			const rootShape = {
				depth: 0,
				pathBytes: 2,
				types: new Set(),
				observations: 0
			};
			let propertyCount = 0;
			const childShape = (parent, key) => {
				const existing = parent.children?.get(key);
				if (existing !== undefined) return existing;
				const segment = typeof key === "string" ? {
					kind: "property",
					name: key
				} : { kind: "array-element" };
				const segmentBytes = jsonValueByteLength(segment, maximumBytes - serializedBytes);
				const pathBytes = parent.pathBytes + segmentBytes + (parent.depth === 0 ? 0 : 1);
				if (!reserve(propertyBaseBytes - 2 + pathBytes + (propertyCount === 0 ? 0 : 1))) return undefined;
				const node = {
					parent,
					segment,
					depth: parent.depth + 1,
					pathBytes,
					types: new Set(),
					observations: 0
				};
				(parent.children ??= new Map()).set(key, node);
				propertyCount++;
				return node;
			};
			const pending = [{
				value: root,
				shape: rootShape
			}];
			let nodeCount = 0;
			let maxDepthObserved = 0;
			while (pending.length > 0) {
				const current = pending.at(-1);
				if (current.children === undefined) {
					const nextCount = nodeCount + 1;
					const nextDepth = Math.max(maxDepthObserved, current.shape.depth);
					if (!reserve(digits(nextCount) - digits(nodeCount) + digits(nextDepth) - digits(maxDepthObserved))) return capacity();
					nodeCount = nextCount;
					maxDepthObserved = nextDepth;
					if (current.shape.parent !== undefined) {
						const type = jsonValueType(current.value);
						const newType = !current.shape.types.has(type);
						const nextObservations = current.shape.observations + 1;
						const typeBytes = newType ? jsonStringByteLength(type) + (current.shape.types.size === 0 ? 0 : 1) : 0;
						if (!reserve(typeBytes + digits(nextObservations) - digits(current.shape.observations))) return capacity();
						current.shape.types.add(type);
						current.shape.observations = nextObservations;
					}
					current.children = shapeChildren(current.value);
				}
				const next = current.children.next();
				if (next.done) {
					pending.pop();
					continue;
				}
				const [key, value] = next.value;
				const shape = childShape(current.shape, key);
				if (shape === undefined) return capacity();
				pending.push({
					value,
					shape
				});
			}
			const properties = [];
			const shapes = orderedChildren(rootShape);
			while (shapes.length > 0) {
				const shape = shapes.pop();
				const path = [];
				let ancestor = shape;
				while (ancestor.parent !== undefined && ancestor.segment !== undefined) {
					path.push({ ...ancestor.segment });
					ancestor = ancestor.parent;
				}
				path.reverse();
				properties.push({
					path,
					types: [...shape.types].sort(),
					observations: shape.observations
				});
				for (const child of orderedChildren(shape)) shapes.push(child);
			}
			return ok({
				shape: {
					root_type: rootType,
					node_count: nodeCount,
					max_depth_observed: maxDepthObserved,
					properties
				},
				serializedBytes
			});
		};
		parseJsonObject = (text) => {
			const parsed = safeParseJson(text);
			return parsed.ok && isRecord(parsed.value) ? parsed.value : null;
		};
		jsonValueType = (value) => {
			if (value === null) return "null";
			if (Array.isArray(value)) return "array";
			switch (typeof value) {
				case "string": return "string";
				case "number": return "number";
				case "boolean": return "boolean";
				default: return "object";
			}
		};
		isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		orderedChildren = (node) => [...node.children ?? []].sort(([left], [right]) => left === right ? 0 : left === arrayElementKey ? 1 : right === arrayElementKey ? -1 : compareUnicodeCodePoints(right, left)).map(([, child]) => child);
	})))();
}

//#endregion
//#region dist/domain/emptyArraySchema.js
var emptyArraySchema;
function init_emptyArraySchema() {
	return (init_emptyArraySchema = __esmMin((() => {
		emptyArraySchema = z.array(z.never()).length(0);
	})))();
}

//#endregion
//#region dist/domain/urlComponents.js
var urlDeclaresQueryOrFragment;
function init_urlComponents() {
	return (init_urlComponents = __esmMin((() => {
		urlDeclaresQueryOrFragment = (url) => url.href.includes("?") || url.href.includes("#");
	})))();
}

//#endregion
//#region dist/domain/browserObservation.js
var parseExactOrigin, browserOriginSchema, recordedBrowserOriginSchema, isLiteralLoopbackHostname, HTTP_ENDPOINT_MESSAGE, BROWSER_SOCKET_PATH, REDACTED_BROWSER_SOCKET_PATH, explicitEndpointAuthority, httpDiscoveryOrigin, browserSocketAuthority, browserEndpointSchema, browserObservationEndpointSchema, recordedBrowserObservationEndpointSchema, browserAllowedOriginsSchema, browserInput, listBrowserTargetsInputSchema, inspectWebPageInputFacts, inspectWebPageWithoutSourceSchema, inspectWebPageWithSourceShapeSchema, refineInspectWebPageInput, inspectWebPageWithSourceInputSchema, inspectWebPageInputSchema, sanitizedBrowserUrlSchema, sanitizeBrowserUrl, removeUrlUserInfo, credentialFreeHref, sanitizeEndpointCandidate;
function init_browserObservation() {
	return (init_browserObservation = __esmMin((() => {
		init_browserDeadline();
		init_urlComponents();
		init_recordedTransportUrl();
		parseExactOrigin = (value) => {
			let url;
			try {
				url = new URL(value);
			} catch (cause) {
				void cause;
				return undefined;
			}
			if (url.protocol !== "http:" && url.protocol !== "https:" || url.hostname.includes("*") || url.username !== "" || url.password !== "" || url.pathname !== "/" || urlDeclaresQueryOrFragment(url)) return undefined;
			return url.origin;
		};
		browserOriginSchema = z.string().min(1).transform((value, context) => {
			const origin = parseExactOrigin(value);
			if (origin === undefined) {
				context.addIssue({
					code: "custom",
					message: "Expected one exact HTTP(S) origin without a path or wildcard"
				});
				return z.NEVER;
			}
			return origin;
		});
		recordedBrowserOriginSchema = z.string().superRefine((value, context) => {
			const parsed = browserOriginSchema.safeParse(value);
			if (parsed.success && parsed.data === value) return;
			context.addIssue({
				code: "custom",
				message: "Expected one canonical HTTP(S) origin"
			});
		});
		isLiteralLoopbackHostname = (hostname) => hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
		HTTP_ENDPOINT_MESSAGE = "CDP endpoint must be an explicit-port HTTP URL on 127.0.0.1 or ::1";
		BROWSER_SOCKET_PATH = "/devtools/browser/";
		REDACTED_BROWSER_SOCKET_PATH = `${BROWSER_SOCKET_PATH}[REDACTED]`;
		explicitEndpointAuthority = (value, url) => {
			const authority = /^[a-z][a-z0-9+.-]*:\/\/([^/?#\\]*)/iu.exec(value)?.[1];
			const port = authority === undefined ? undefined : /:([0-9]+)$/u.exec(authority)?.[1];
			return port === undefined ? undefined : `${url.protocol}//${url.hostname}:${String(Number(port))}`;
		};
		httpDiscoveryOrigin = (value, url) => url.protocol === "http:" && isLiteralLoopbackHostname(url.hostname) && url.username === "" && url.password === "" && url.pathname === "/" && !urlDeclaresQueryOrFragment(url) ? explicitEndpointAuthority(value, url) : undefined;
		browserSocketAuthority = (value, url) => {
			const id = url.pathname.slice(BROWSER_SOCKET_PATH.length);
			return url.protocol === "ws:" && isLiteralLoopbackHostname(url.hostname) && url.username === "" && url.password === "" && !urlDeclaresQueryOrFragment(url) && url.pathname.startsWith(BROWSER_SOCKET_PATH) && id.length > 0 && !id.includes("/") ? explicitEndpointAuthority(value, url) : undefined;
		};
		browserEndpointSchema = z.string().min(1).transform((value, context) => {
			const url = URL.parse(value);
			const origin = url === null ? undefined : httpDiscoveryOrigin(value, url);
			if (origin !== undefined) return origin;
			context.addIssue({
				code: "custom",
				message: url === null ? "Invalid CDP endpoint URL" : HTTP_ENDPOINT_MESSAGE
			});
			return z.NEVER;
		});
		browserObservationEndpointSchema = z.string().min(1).describe("Literal loopback CDP endpoint: http://127.0.0.1:PORT, or ws://127.0.0.1:PORT/devtools/browser/ID.").transform((value, context) => {
			const url = URL.parse(value);
			if (url === null) {
				context.addIssue({
					code: "custom",
					message: "Invalid CDP endpoint URL"
				});
				return z.NEVER;
			}
			const origin = httpDiscoveryOrigin(value, url);
			if (origin !== undefined) return {
				transport: "http_discovery",
				url: origin,
				recorded: origin
			};
			const authority = browserSocketAuthority(value, url);
			if (authority !== undefined) return {
				transport: "browser_websocket",
				url: `${authority}${url.pathname}`,
				recorded: `${authority}${REDACTED_BROWSER_SOCKET_PATH}`
			};
			context.addIssue({
				code: "custom",
				message: url.protocol === "ws:" ? "CDP browser WebSocket must be ws://127.0.0.1:PORT/devtools/browser/ID or ws://[::1]:PORT/devtools/browser/ID" : HTTP_ENDPOINT_MESSAGE
			});
			return z.NEVER;
		});
		recordedBrowserObservationEndpointSchema = z.string().min(1).refine((value) => {
			const url = URL.parse(value);
			return url !== null && (httpDiscoveryOrigin(value, url) !== undefined || browserSocketAuthority(value, url) !== undefined && url.pathname === REDACTED_BROWSER_SOCKET_PATH);
		}, { message: "Recorded CDP endpoint must be a loopback HTTP origin or a redacted browser WebSocket URL" });
		browserAllowedOriginsSchema = z.array(browserOriginSchema).transform((origins) => Array.from(new Set(origins)).sort()).default([]);
		browserInput = {
			cdp_endpoint: browserObservationEndpointSchema,
			allowed_origins: browserAllowedOriginsSchema
		};
		listBrowserTargetsInputSchema = z.strictObject({ ...browserInput });
		inspectWebPageInputFacts = {
			...browserInput,
			target_id: z.string().trim().min(1),
			command_timeout_ms: webRuntimeCommandTimeoutSchema,
			observation_ms: z.int().min(0).default(500),
			include_accessibility_text: z.boolean().default(false),
			include_console_text: z.boolean().default(false),
			include_json_body_shapes: z.boolean().default(false),
			include_websocket_shapes: z.boolean().default(false),
			include_storage_keys: z.boolean().default(false),
			include_storage_fingerprints: z.boolean().default(false)
		};
		inspectWebPageWithoutSourceSchema = z.strictObject({
			...inspectWebPageInputFacts,
			include_script_sources: z.literal(false).optional().default(false)
		});
		inspectWebPageWithSourceShapeSchema = z.strictObject({
			...inspectWebPageInputFacts,
			include_script_sources: z.literal(true).default(true)
		});
		refineInspectWebPageInput = (input, context) => {
			if (input.include_storage_fingerprints && !input.include_storage_keys) context.addIssue({
				code: "custom",
				path: ["include_storage_fingerprints"],
				message: "Storage fingerprints require storage key capture"
			});
		};
		inspectWebPageWithSourceInputSchema = inspectWebPageWithSourceShapeSchema.superRefine(refineInspectWebPageInput);
		inspectWebPageInputSchema = z.discriminatedUnion("include_script_sources", [inspectWebPageWithoutSourceSchema.superRefine(refineInspectWebPageInput), inspectWebPageWithSourceShapeSchema.extend({ include_script_sources: z.literal(true) }).superRefine(refineInspectWebPageInput)]);
		sanitizedBrowserUrlSchema = z.object({
			url: z.string(),
			origin: z.string().nullable(),
			query_parameter_names: z.array(z.string()),
			redacted: z.boolean()
		});
		sanitizeBrowserUrl = (value) => {
			let parsed;
			try {
				parsed = new URL(value);
			} catch (cause) {
				void cause;
				return {
					url: value,
					origin: null,
					query_parameter_names: [],
					redacted: false
				};
			}
			const hadCredentials = parsed.username !== "" || parsed.password !== "";
			const names = [...parseUrlQueryParameterNames(parsed.search)];
			const sanitizedUrl = hadCredentials ? removeUrlUserInfo(value, parsed) : value;
			return {
				url: sanitizedUrl,
				origin: parsed.origin === "null" ? null : parsed.origin,
				query_parameter_names: names,
				redacted: hadCredentials
			};
		};
		removeUrlUserInfo = (value, parsed) => {
			const { credentials } = parseRecordedTransportUrl(value);
			return credentials === null || credentials === "ambiguous" ? credentialFreeHref(parsed) : `${value.slice(0, credentials.start)}${value.slice(credentials.end)}`;
		};
		credentialFreeHref = (parsed) => {
			parsed.username = "";
			parsed.password = "";
			return parsed.href;
		};
		sanitizeEndpointCandidate = (value) => {
			return sanitizeBrowserUrl(value).url;
		};
	})))();
}

//#endregion
//#region dist/domain/browserCompleteness.js
var browserSectionSchema, browserExclusionReasonSchema, browserExclusionSchema, browserDroppedEventsSchema, browserCompletenessConditionSchema, browserCompletenessSchema, classifyBrowserCompleteness, sortedSections, canonicalExclusions;
function init_browserCompleteness() {
	return (init_browserCompleteness = __esmMin((() => {
		init_unicodeCodePointOrder();
		browserSectionSchema = z.enum([
			"frames",
			"dom",
			"accessibility",
			"scripts",
			"script_sources",
			"resources",
			"network_requests",
			"network_initiators",
			"console_events",
			"console_text",
			"websocket_connections",
			"websocket_frames",
			"websocket_shapes",
			"json_body_shapes",
			"workers",
			"storage",
			"storage_keys",
			"metadata",
			"webmcp_tools",
			"screenshot",
			"source_maps",
			"timeline"
		]);
		browserExclusionReasonSchema = z.enum([
			"disallowed_origin",
			"unsupported_url",
			"unattributed_origin",
			"not_approved",
			"out_of_target_scope",
			"unattributed_target",
			"unknown_target_relationship",
			"provider_unavailable",
			"invalid_protocol_value",
			"resource_budget_exhausted"
		]);
		browserExclusionSchema = z.object({
			section: browserSectionSchema,
			reason: browserExclusionReasonSchema,
			count: z.int().min(0).nullable()
		});
		browserDroppedEventsSchema = z.object({
			scripts: z.int().min(0),
			network_requests: z.int().min(0),
			console_events: z.int().min(0),
			websocket_connections: z.int().min(0),
			websocket_frames: z.int().min(0),
			webmcp_tools: z.int().min(0),
			timeline_events: z.int().min(0),
			total: z.int().min(0)
		});
		browserCompletenessConditionSchema = z.enum([
			"complete_within_window",
			"policy_filtered",
			"attach_limited",
			"truncated"
		]);
		browserCompletenessSchema = z.object({
			status: browserCompletenessConditionSchema,
			conditions: z.array(browserCompletenessConditionSchema).min(1).max(3),
			policy_filtered_sections: z.array(browserSectionSchema),
			attach_limited_sections: z.array(browserSectionSchema),
			truncated_sections: z.array(browserSectionSchema),
			unavailable_sections: z.array(browserSectionSchema),
			excluded: z.array(browserExclusionSchema),
			dropped_events: browserDroppedEventsSchema
		});
		classifyBrowserCompleteness = (input) => {
			const policyFiltered = input.policyFilteredSections.size > 0;
			const truncated = input.truncatedSections.size > 0 || Object.values(input.droppedEvents).some((count) => count > 0);
			const attachLimited = input.attachLimitedSections.size > 0 || input.unavailableSections.size > 0;
			const status = truncated ? "truncated" : policyFiltered ? "policy_filtered" : attachLimited ? "attach_limited" : "complete_within_window";
			const conditions = [
				...attachLimited ? ["attach_limited"] : [],
				...policyFiltered ? ["policy_filtered"] : [],
				...truncated ? ["truncated"] : []
			];
			const droppedTotal = Object.values(input.droppedEvents).reduce((sum, count) => sum + count, 0);
			return browserCompletenessSchema.parse({
				status,
				conditions: conditions.length === 0 ? ["complete_within_window"] : conditions,
				policy_filtered_sections: sortedSections(input.policyFilteredSections),
				attach_limited_sections: sortedSections(input.attachLimitedSections),
				truncated_sections: sortedSections(input.truncatedSections),
				unavailable_sections: sortedSections(input.unavailableSections),
				excluded: canonicalExclusions(input.excluded),
				dropped_events: {
					...input.droppedEvents,
					total: droppedTotal
				}
			});
		};
		sortedSections = (sections) => [...sections].sort();
		canonicalExclusions = (exclusions) => [...exclusions].sort((left, right) => compareUnicodeCodePoints(left.section, right.section) || compareUnicodeCodePoints(left.reason, right.reason));
	})))();
}

//#endregion
//#region dist/domain/webContentArtifact.js
var webTextArtifactMetadataSchema, webTextArtifactSchema, createWebTextArtifact;
function init_webContentArtifact() {
	return (init_webContentArtifact = __esmMin((() => {
		webTextArtifactMetadataSchema = z.object({
			sha256: z.string().regex(/^[a-f0-9]{64}$/u),
			bytes: z.int().min(0),
			media_type: z.string().min(1),
			charset: z.literal("utf-8")
		});
		webTextArtifactSchema = webTextArtifactMetadataSchema.extend({ text: z.string() }).superRefine((artifact, context) => {
			const bytes = Buffer.byteLength(artifact.text);
			const digest = createHash("sha256").update(artifact.text).digest("hex");
			if (artifact.bytes !== bytes) context.addIssue({
				code: "custom",
				path: ["bytes"],
				message: "Byte count mismatch"
			});
			if (artifact.sha256 !== digest) context.addIssue({
				code: "custom",
				path: ["sha256"],
				message: "Digest mismatch"
			});
		});
		createWebTextArtifact = (text, mediaType) => {
			const sha256 = createHash("sha256").update(text).digest("hex");
			return {
				sha256,
				bytes: Buffer.byteLength(text),
				media_type: mediaType,
				charset: "utf-8",
				text
			};
		};
	})))();
}

//#endregion
//#region dist/domain/cdpObservationSchemas.js
var cdpDomNodeSchema, cdpScriptSourceSchema, cdpScriptMetadataSchema;
function init_cdpObservationSchemas() {
	return (init_cdpObservationSchemas = __esmMin((() => {
		init_webContentArtifact();
		cdpDomNodeSchema = z.object({
			index: z.number().int().min(0),
			parent_index: z.number().int().min(-1),
			node_type: z.number().int().min(0),
			node_name: z.string(),
			node_value_length: z.number().int().min(0),
			attribute_names: z.array(z.string())
		});
		cdpScriptSourceSchema = z.discriminatedUnion("included", [z.object({
			included: z.literal(false),
			reason: z.string()
		}), z.object({
			included: z.literal(true),
			artifact: webTextArtifactSchema
		})]);
		cdpScriptMetadataSchema = z.object({
			cdp_hash: z.string().nullable().describe("Producer-reported script hash; null when unavailable."),
			length: z.number().int().min(0).nullable().describe("Producer-reported script length; null when unavailable."),
			is_module: z.boolean().nullable().describe("Producer-reported module classification; null when unavailable."),
			language: z.string().nullable()
		});
	})))();
}

//#endregion
//#region dist/domain/browserObservationSchemas.js
var browserVersionSchema, browserTargetSchema, browserTargetListSchema, browserFrameSchema, browserAxNodeSchema, browserResourceReconciliationSchema, browserScriptSchema, browserResourceSchema, browserNetworkRequestSchema, browserConsoleEventSchema, browserWebSocketFrameSchema, browserWebSocketConnectionSchema, browserWorkerSchema, browserCspSourceSchema, browserLinkMetadataSchema, browserAgentHintSchema, browserSafeMetadataSchema, webPageInspectionSchema;
function init_browserObservationSchemas() {
	return (init_browserObservationSchemas = __esmMin((() => {
		init_browserCompleteness();
		init_cdpObservationSchemas();
		init_jsonShape();
		init_digests();
		browserVersionSchema = z.object({
			product: z.string(),
			protocol_version: z.string(),
			revision: z.string(),
			user_agent: z.string(),
			js_version: z.string()
		});
		browserTargetSchema = z.object({
			target_id: z.string(),
			type: z.string(),
			title: z.string(),
			url: z.string(),
			origin: z.string(),
			attached: z.boolean().nullable().describe("Discovery-reported debugger attachment state; null means unknown")
		});
		browserTargetListSchema = z.object({
			browser: browserVersionSchema,
			targets: z.array(browserTargetSchema),
			excluded: z.object({
				disallowed_origin: z.int().min(0),
				unsupported_url: z.int().min(0),
				non_page: z.int().min(0)
			}),
			limitations: z.array(z.string())
		});
		browserFrameSchema = z.object({
			frame_id: z.string(),
			parent_frame_id: z.string().nullable(),
			url: z.string(),
			origin: z.string().nullable()
		});
		browserAxNodeSchema = z.object({
			node_id: z.string(),
			parent_id: z.string().nullable(),
			role: z.string().nullable(),
			name: z.string().nullable(),
			description: z.string().nullable(),
			ignored: z.boolean(),
			states: z.array(z.object({
				name: z.string(),
				value: z.union([
					z.boolean(),
					z.number(),
					z.string()
				])
			})).default([])
		});
		browserResourceReconciliationSchema = z.discriminatedUnion("status", [
			z.object({
				status: z.literal("exact"),
				resource_key: z.string()
			}),
			z.object({
				status: z.literal("ambiguous"),
				candidate_resource_keys: z.array(z.string())
			}),
			z.object({
				status: z.literal("unmatched"),
				reason: z.literal("no_exact_sanitized_url")
			})
		]);
		browserScriptSchema = z.object({
			script_key: z.string().regex(/^scr_[a-f0-9]{64}(?:_[0-9]+)?$/u),
			frame_id: z.string().nullable().default(null),
			url: z.string(),
			origin: z.string().nullable(),
			...cdpScriptMetadataSchema.shape,
			source_map_url: z.string().nullable(),
			resource_reconciliation: browserResourceReconciliationSchema,
			source: cdpScriptSourceSchema
		});
		browserResourceSchema = z.object({
			resource_key: prefixedDigestSchema("res"),
			url: z.string(),
			origin: z.string().nullable(),
			type: z.string(),
			mime_type: z.string(),
			content_size: z.number().min(0).nullable()
		});
		browserNetworkRequestSchema = z.object({
			request_id: z.string(),
			url: z.string(),
			origin: z.string().nullable(),
			method: z.string(),
			resource_type: z.string().nullable(),
			status: z.number().nullable(),
			mime_type: z.string().nullable(),
			encoded_data_length: z.number().min(0).nullable(),
			redirects: z.array(z.object({
				url: z.string(),
				response_url: z.string(),
				method: z.string(),
				resource_type: z.string().nullable(),
				status: z.number().nullable(),
				mime_type: z.string().nullable(),
				encoded_data_length: z.number().min(0).nullable(),
				request_timestamp: z.number().nullable(),
				redirect_event_timestamp: z.number().nullable()
			})).optional(),
			initiator: z.object({
				type: z.string(),
				url: z.string().nullable(),
				line: z.int().min(0).nullable(),
				column: z.int().min(0).nullable()
			}),
			body_shapes: z.object({
				status: z.enum([
					"not_approved",
					"included",
					"partial",
					"unavailable"
				]),
				request: jsonShapeSchema.nullable(),
				response: jsonShapeSchema.nullable()
			})
		});
		browserConsoleEventSchema = z.object({
			type: z.string(),
			timestamp: z.number().nullable().describe("CDP Runtime.Timestamp in milliseconds since Unix epoch; null when the producer value is absent or invalid."),
			argument_types: z.array(z.string()).nullable().describe("CDP argument types by argument position; null when the producer argument inventory is absent or not an array."),
			url: z.string().nullable(),
			line: z.int().min(0).nullable(),
			column: z.int().min(0).nullable(),
			text_capture: z.object({
				status: z.enum([
					"not_approved",
					"included",
					"unavailable"
				]),
				values: z.array(z.object({
					argument_index: z.int().min(0),
					type: z.string(),
					text: z.string()
				})),
				retained_bytes: z.int().min(0)
			})
		});
		browserWebSocketFrameSchema = z.object({
			direction: z.enum(["sent", "received"]),
			opcode: z.int().min(0).max(15).nullable(),
			payload_bytes: z.int().min(0).nullable(),
			payload_shape: z.object({
				format: z.enum([
					"json",
					"text",
					"binary"
				]),
				json_shape: jsonShapeSchema.nullable()
			}).nullable()
		});
		browserWebSocketConnectionSchema = z.object({
			request_id: z.string(),
			url: z.string(),
			events: z.array(browserWebSocketFrameSchema)
		});
		browserWorkerSchema = z.object({
			target_id: z.string(),
			type: z.string(),
			url: z.string(),
			origin: z.string().nullable(),
			attached: z.boolean(),
			opener_target_id: z.string().nullable().default(null),
			parent_frame_id: z.string().nullable().default(null)
		});
		browserCspSourceSchema = z.object({
			kind: z.enum([
				"keyword",
				"scheme",
				"approved_origin",
				"external_origin",
				"other"
			]),
			value: z.string().nullable()
		});
		browserLinkMetadataSchema = z.object({
			href: z.string().nullable(),
			destination_scope: z.enum([
				"approved",
				"outside_policy",
				"unsupported"
			]),
			context_url: z.string().nullable().optional(),
			context_scope: z.enum([
				"approved",
				"outside_policy",
				"unsupported"
			]).optional(),
			rel: z.array(z.string()),
			as: z.string().nullable(),
			type: z.string().nullable(),
			crossorigin: z.string().nullable()
		});
		browserAgentHintSchema = z.object({
			mechanism: z.enum([
				"link_rel",
				"dom_link_rel",
				"well_known_resource",
				"response_header"
			]),
			declaration: z.string(),
			url: z.string().nullable(),
			trust: z.literal("page-declared-untrusted")
		});
		browserSafeMetadataSchema = z.object({
			responses: z.array(z.object({
				request_id: z.string(),
				url: z.string(),
				mime_type: z.string().nullable(),
				content_length: z.int().min(0).nullable(),
				content_encoding: z.string().nullable(),
				csp: z.object({
					directives: z.array(z.object({
						name: z.string(),
						sources: z.array(browserCspSourceSchema)
					})),
					nonce_count: z.int().min(0),
					hash_count: z.int().min(0)
				}),
				links: z.array(browserLinkMetadataSchema),
				policies: z.object({
					coop: z.string().nullable(),
					coep: z.string().nullable(),
					corp: z.string().nullable(),
					referrer_policy: z.string().nullable(),
					x_content_type_options: z.string().nullable(),
					permissions_policy_features: z.array(z.string())
				})
			})),
			dom_urls: z.array(z.object({
				node_index: z.int().min(0),
				attribute: z.enum([
					"href",
					"src",
					"action",
					"formaction",
					"poster"
				]),
				url: z.string().nullable(),
				destination_scope: z.enum([
					"approved",
					"outside_policy",
					"unsupported"
				])
			})),
			agent_hints: z.array(browserAgentHintSchema),
			excluded_dom_urls: z.int().min(0),
			headers_allowlisted: z.literal(true)
		});
		webPageInspectionSchema = z.object({
			browser: browserVersionSchema,
			target: browserTargetSchema,
			capture_window: z.object({
				started_at: z.iso.datetime(),
				ended_at: z.iso.datetime(),
				observation_ms: z.int().min(0)
			}),
			completeness: browserCompletenessSchema,
			frames: z.array(browserFrameSchema),
			dom: z.object({
				total_nodes: z.int().min(0),
				nodes: z.array(cdpDomNodeSchema)
			}),
			accessibility: z.object({
				total_nodes: z.int().min(0),
				text_capture: z.object({
					status: z.enum([
						"not_approved",
						"included",
						"unavailable"
					]),
					retained_bytes: z.int().min(0),
					excluded_fields: z.int().min(0)
				}),
				nodes: z.array(browserAxNodeSchema)
			}),
			scripts: z.object({
				total: z.int().min(0),
				items: z.array(browserScriptSchema)
			}),
			resources: z.array(browserResourceSchema),
			network: z.object({
				requests: z.array(browserNetworkRequestSchema),
				websocket_connections: z.array(browserWebSocketConnectionSchema),
				coverage_started_at: z.iso.datetime(),
				prior_activity_available: z.literal(false)
			}),
			console: z.object({
				events: z.array(browserConsoleEventSchema),
				coverage_started_at: z.iso.datetime(),
				prior_activity_available: z.literal(false)
			}),
			workers: z.array(browserWorkerSchema),
			metadata: browserSafeMetadataSchema,
			storage: z.object({
				origin: z.string(),
				usage_bytes: z.number().min(0).nullable(),
				quota_bytes: z.number().min(0).nullable(),
				local_storage_keys: z.array(z.string()),
				session_storage_keys: z.array(z.string()),
				indexed_db_names: z.array(z.string()),
				cache_names: z.array(z.string()),
				content_fingerprints: z.array(z.object({
					scope: z.enum([
						"cookie",
						"local_storage",
						"session_storage",
						"indexed_db_schema",
						"indexed_db_record",
						"cache_entry"
					]),
					identity_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
					value_sha256: z.string().regex(/^[a-f0-9]{64}$/u).nullable(),
					projection_version: z.literal(2).optional().describe("IndexedDB schema projection including database version; absent on historical store-only fingerprints."),
					complete: z.boolean()
				})).default([]),
				fingerprint_algorithm: z.literal("sha256").default("sha256"),
				fingerprints_complete: z.boolean().default(false),
				values_redacted: z.literal(true)
			}),
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/domain/offsetDateTime.js
var offsetDateTimeSchema, parseOffsetDateTimeInstant, readRecordedDateTime, offsetDateTimeInstantFromEpochMilliseconds, fractionalSecondFromMilliseconds, compareOffsetDateTimeInstants;
function init_offsetDateTime() {
	return (init_offsetDateTime = __esmMin((() => {
		offsetDateTimeSchema = z.string().regex(/^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|(?:[+\x2d](?:[01]\d|2[0-3]):[0-5]\d)))$/u, "Use an ISO-8601 date-time with an explicit UTC offset");
		parseOffsetDateTimeInstant = (value) => {
			const match = /^(.*?)(?:\.(\d+))?(Z|[+\x2d]\d{2}:\d{2})$/u.exec(value);
			if (match === null) throw new TypeError("Expected a validated offset date-time.");
			const [, dateTime, fractionalDigits, offset] = match;
			if (dateTime === undefined || offset === undefined) throw new TypeError("Expected a validated offset date-time.");
			const wholeSecondMilliseconds = Date.parse(`${dateTime}${offset}`);
			if (!Number.isSafeInteger(wholeSecondMilliseconds) || wholeSecondMilliseconds % 1e3 !== 0) throw new TypeError("Offset date-time is outside the supported time range.");
			return {
				epochSecond: wholeSecondMilliseconds / 1e3,
				fraction: fractionalDigits?.replace(/0+$/u, "") ?? ""
			};
		};
		readRecordedDateTime = (value) => {
			const match = /^(\d{4}-\d{2}-\d{2})([T ])(\d{2}:\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:?\d{2})?$/u.exec(value);
			if (match === null) return undefined;
			const [, date, separator, time, seconds, fraction = "", zone = ""] = match;
			const offset = zone === "" ? "Z" : zone === "Z" || zone.includes(":") ? zone : `${zone.slice(0, 3)}:${zone.slice(3)}`;
			const normalized = offsetDateTimeSchema.safeParse(`${date}T${time}${seconds === undefined ? "" : `:${seconds}`}${fraction === "" ? "" : `.${fraction}`}${offset}`);
			if (!normalized.success) return undefined;
			return {
				instant: parseOffsetDateTimeInstant(normalized.data),
				spelling: {
					separator,
					secondsPresent: seconds !== undefined,
					fractionDigits: fraction.length,
					zone
				}
			};
		};
		offsetDateTimeInstantFromEpochMilliseconds = (epochMilliseconds) => {
			if (!Number.isFinite(epochMilliseconds)) throw new TypeError("Expected finite epoch milliseconds.");
			if (Math.abs(epochMilliseconds) > Number.MAX_SAFE_INTEGER) return {
				epochSecond: epochMilliseconds / 1e3,
				fraction: ""
			};
			const epochSecond = Math.floor(epochMilliseconds / 1e3);
			const millisecondsWithinSecond = epochMilliseconds - epochSecond * 1e3;
			return {
				epochSecond,
				fraction: fractionalSecondFromMilliseconds(millisecondsWithinSecond)
			};
		};
		fractionalSecondFromMilliseconds = (milliseconds) => {
			if (milliseconds === 0) return "";
			const [coefficient = "", exponentText] = String(milliseconds).toLowerCase().split("e");
			const exponent = exponentText === undefined ? 0 : Number(exponentText);
			const point = coefficient.indexOf(".");
			const decimalPosition = (point < 0 ? coefficient.length : point) + exponent - 3;
			const digits = coefficient.replace(".", "");
			const fraction = decimalPosition <= 0 ? `0.${"0".repeat(-decimalPosition)}${digits}` : decimalPosition < digits.length ? `${digits.slice(0, decimalPosition)}.${digits.slice(decimalPosition)}` : `${digits}${"0".repeat(decimalPosition - digits.length)}`;
			return (fraction.includes(".") ? fraction.slice(fraction.indexOf(".") + 1) : "").replace(/0+$/u, "");
		};
		compareOffsetDateTimeInstants = (left, right) => {
			if (left.epochSecond !== right.epochSecond) return left.epochSecond < right.epochSecond ? -1 : 1;
			const length = Math.max(left.fraction.length, right.fraction.length);
			for (let index = 0; index < length; index += 1) {
				const leftDigit = left.fraction.charCodeAt(index) || 48;
				const rightDigit = right.fraction.charCodeAt(index) || 48;
				if (leftDigit !== rightDigit) return leftDigit < rightDigit ? -1 : 1;
			}
			return 0;
		};
	})))();
}

//#endregion
//#region dist/cliCommandNames.js
var CLI_COMMANDS, CLI_COMMAND_NAMES;
function init_cliCommandNames() {
	return (init_cliCommandNames = __esmMin((() => {
		CLI_COMMANDS = Object.freeze({
			inspectPacketFields: "inspect-packet-fields",
			inspectPacketCapture: "inspect-packet-capture",
			inspectSignalDecoders: "inspect-signal-decoders",
			decodeSignalRecording: "decode-signal-recording",
			matchNativeFunctions: "match-native-functions",
			compareWasmInterfaces: "compare-wasm-interfaces",
			inspectWasmArtifact: "inspect-wasm-artifact",
			inspectApkSignature: "inspect-apk-signature",
			inspectSqliteDatabase: "inspect-sqlite-database",
			inspectEvmInterface: "inspect-evm-interface",
			inspectWebNetworkCapture: "inspect-web-network-capture",
			observeWebExecution: "observe-web-execution",
			inspectWebEventListeners: "inspect-web-event-listeners",
			traceWebSourceLocation: "trace-web-source-location",
			traceWebModuleImports: "trace-web-module-imports",
			analyze: "analyze",
			inspect: "inspect",
			decompile: "decompile",
			decompileAll: "decompile-all",
			setup: "setup",
			doctor: "doctor",
			uninstall: "uninstall",
			update: "update",
			xrefs: "xrefs",
			trace: "trace",
			traceNativeUiAction: "trace-native-ui-action",
			inspectNativeDispatchMetadata: "inspect-native-dispatch-metadata",
			capabilities: "capabilities",
			providers: "providers",
			function: "function",
			annotateNativeFunction: "annotate-native-function",
			inspectNativeApi: "inspect-native-api",
			instructions: "instructions",
			search: "search",
			importReferenceSource: "import-reference-source",
			inspectArtifact: "inspect-artifact",
			extractArtifact: "extract-artifact",
			decodeInterfaceBuilder: "decode-interface-builder",
			inspectKeyedArchive: "inspect-keyed-archive",
			traceDylibResolution: "trace-dylib-resolution",
			inspectNativeDataType: "inspect-native-data-type",
			inspectNativeLoadImage: "inspect-native-load-image",
			readBytes: "read-bytes",
			searchBytes: "search-bytes",
			addressToFileOffset: "address-to-file-offset",
			traceNativeValues: "trace-native-values",
			inspectNativeInstruction: "inspect-native-instruction",
			resolveNativeCallTargets: "resolve-native-call-targets",
			inspectAssetCatalog: "inspect-asset-catalog",
			inspectManagedArtifact: "inspect-managed-artifact",
			inspectRecordedCrash: "inspect-recorded-crash",
			inspectByteEntropy: "inspect-byte-entropy",
			inspectBinaryLayout: "inspect-binary-layout",
			listCutterSessions: "list-cutter-sessions",
			cutterCommand: "cutter-command",
			inspectWithObjdump: "inspect-with-objdump",
			listObjdumpArchitectures: "list-objdump-architectures",
			executeRizinCommand: "execute-rizin-command",
			debugWithGdb: "debug-with-gdb",
			debugWithRizin: "debug-with-rizin",
			inspectDesktopApplication: "inspect-desktop-application",
			inspectGoBinary: "inspect-go-binary",
			inspectIl2cppMetadata: "inspect-il2cpp-metadata",
			inspectModelArtifact: "inspect-model-artifact",
			inspectGpuCodeObjects: "inspect-gpu-code-objects",
			inspectRustBinary: "inspect-rust-binary",
			inspectPythonPyc: "inspect-python-pyc",
			inspectErlangBeam: "inspect-erlang-beam",
			inspectPeResources: "inspect-pe-resources",
			inspectPeCertificates: "inspect-pe-certificates",
			inspectPeImports: "inspect-pe-imports",
			inspectNativeExports: "inspect-native-exports",
			inspectDevicetree: "inspect-devicetree",
			inspectElfNotes: "inspect-elf-notes",
			inspectAppleIps: "inspect-apple-ips",
			inspectKernelModule: "inspect-kernel-module",
			inspectPeLoadConfig: "inspect-pe-load-config",
			inspectAnalysisView: "inspect-analysis-view",
			listFridaDevices: "list-frida-devices",
			listFridaProcesses: "list-frida-processes",
			instrumentWithFrida: "instrument-with-frida",
			inspectEvidenceBundle: "inspect-evidence-bundle",
			inspectFirmwareRegions: "inspect-firmware-regions",
			extractFirmware: "extract-firmware",
			inspectAndroidPackage: "inspect-android-package",
			inspectPcapClient: "inspect-pcap-client",
			inspectPcapCapture: "inspect-pcap-capture",
			identifyFlutterBuild: "identify-flutter-build",
			inspectDartAot: "inspect-dart-aot",
			inspectApktoolClient: "inspect-apktool-client",
			decodeAndroidResources: "decode-android-resources",
			inspectAdbClient: "inspect-adb-client",
			listAdbDevices: "list-adb-devices",
			inspectAdbDevice: "inspect-adb-device",
			listAdbPackages: "list-adb-packages",
			pullAdbPackage: "pull-adb-package",
			readAdbLogcat: "read-adb-logcat",
			inspectAdbPackage: "inspect-adb-package",
			pullAdbFile: "pull-adb-file",
			pushAdbFile: "push-adb-file",
			captureAdbScreen: "capture-adb-screen",
			listAdbProcesses: "list-adb-processes",
			listAdbDirectory: "list-adb-directory",
			listAdbFeatures: "list-adb-features",
			listAdbServices: "list-adb-services",
			inspectAdbDisplay: "inspect-adb-display",
			inspectAdbWindow: "inspect-adb-window",
			readAdbSetting: "read-adb-setting",
			collectAdbBugreport: "collect-adb-bugreport",
			resolveAdbPackages: "resolve-adb-packages",
			installAdbPackage: "install-adb-package",
			uninstallAdbPackage: "uninstall-adb-package",
			startAdbApp: "start-adb-app",
			startAdbActivity: "start-adb-activity",
			stopAdbApp: "stop-adb-app",
			searchAndroidClasses: "search-android-classes",
			inspectAndroidClass: "inspect-android-class",
			inspectAndroidMethod: "inspect-android-method",
			traceAndroidReferences: "trace-android-references",
			inspectJebClient: "inspect-jeb-client",
			openJebProject: "open-jeb-project",
			listJebUnits: "list-jeb-units",
			decompileJebItem: "decompile-jeb-item",
			inspectManagedMembers: "inspect-managed-members",
			inspectManagedNativeBoundaries: "inspect-managed-native-boundaries",
			compareManagedMembers: "compare-managed-members",
			verifyManagedNativeBoundaries: "verify-managed-native-boundaries",
			importManagedReconstruction: "import-managed-reconstruction",
			projectManagedApplicationGraph: "project-managed-application-graph",
			observeNativeUi: "observe-native-ui",
			observeNativeCalls: "observe-native-calls",
			captureNativeUiScenario: "capture-native-ui-scenario",
			inspectMacho: "inspect-macho",
			inspectSignature: "inspect-signature",
			listArchitectures: "list-architectures",
			inspectPlist: "inspect-plist",
			demangleSwift: "demangle-swift",
			evidenceImport: "evidence-import",
			evidenceExport: "evidence-export",
			environmentServe: "environment-serve",
			environmentExport: "environment-export",
			environmentCompare: "environment-compare",
			environmentBuild: "environment-build",
			compare: "compare",
			captureProcess: "capture-process",
			compareProcessCaptures: "compare-process-captures",
			listBrowserTargets: "list-browser-targets",
			inspectWebPage: "inspect-web-page",
			analyzeWebBundle: "analyze-web-bundle",
			exportWebScripts: "export-web-scripts",
			recoverJavaScriptSources: "recover-javascript-sources",
			observeWebSession: "observe-web-session",
			discoverWebMcpTools: "discover-webmcp-tools",
			compareWebCaptures: "compare-web-captures",
			captureWebScreenshot: "capture-web-screenshot",
			compareWebScreenshots: "compare-web-screenshots",
			captureBrowserScenario: "capture-browser-scenario",
			listElectronTargets: "list-electron-targets",
			inspectElectronPage: "inspect-electron-page",
			inspectElectronFuses: "inspect-electron-fuses",
			captureElectronScenario: "capture-electron-scenario",
			listJavaScriptRuntimeTargets: "list-javascript-runtime-targets",
			observeJavaScriptRuntime: "observe-javascript-runtime",
			analyzeJavaScriptApplication: "analyze-javascript-application",
			reconcileJavaScriptRuntime: "reconcile-javascript-runtime",
			traceApplicationFeature: "trace-application-feature",
			traceJavaScriptSemantics: "trace-javascript-semantics",
			compareApplicationVersions: "compare-application-versions",
			compareSourceToBundle: "compare-source-to-bundle",
			compareJavaScriptExportShapes: "compare-javascript-export-shapes",
			buildReconstructionObligationLedger: "build-reconstruction-obligation-ledger",
			evaluateReconstructionCoverage: "evaluate-reconstruction-coverage",
			projectAndroidApplicationGraph: "project-android-application-graph",
			projectAppleApplicationGraph: "project-apple-application-graph",
			projectHarmonyApplicationGraph: "project-harmony-application-graph"
		});
		CLI_COMMAND_NAMES = Object.freeze(Object.values(CLI_COMMANDS));
	})))();
}

//#endregion
//#region dist/domain/native/procedureInfo.js
var procedureInfoSchema;
function init_procedureInfo() {
	return (init_procedureInfo = __esmMin((() => {
		init_nativeSymbol();
		init_hopperValues();
		procedureInfoSchema = z.object({
			name: z.string(),
			symbol: nativeSymbolMetadataSchema.nullable().exactOptional(),
			entrypoint: z.string(),
			basicblock_count: z.number().int().min(0),
			length: z.number().min(0),
			signature: z.string().nullable(),
			locals: z.array(localVariableSchema),
			classification: procedureClassificationSchema.nullable(),
			body: functionBodySchema
		});
	})))();
}

//#endregion
//#region dist/domain/process/processEvidenceProvider.js
var PROCESS_PROVIDER, isProcessEvidenceProvider;
function init_processEvidenceProvider() {
	return (init_processEvidenceProvider = __esmMin((() => {
		PROCESS_PROVIDER = {
			id: "rea-process",
			name: "REA process capture",
			version: "3"
		};
		isProcessEvidenceProvider = (provider) => provider.id === PROCESS_PROVIDER.id && provider.version === PROCESS_PROVIDER.version && (provider.name === PROCESS_PROVIDER.name || provider.name === "REA deterministic process harness");
	})))();
}

//#endregion
//#region dist/domain/analysisResourceLimits.js
var DEFAULT_ASAR_MAX_HEADER_BYTES, MAXIMUM_ASAR_MAX_HEADER_BYTES, DEFAULT_GHIDRA_STARTUP_TIMEOUT_MS, DEFAULT_HOPPER_STARTUP_TIMEOUT_MS, MAX_PROVIDER_STARTUP_TIMEOUT_MS, MAX_GHIDRA_DECOMPILE_TIMEOUT_SECONDS, DEFAULT_REGEX_MATCHING_DEADLINE_MS, MAXIMUM_REGEX_MATCHING_DEADLINE_MS, DEFAULT_REGEX_WORKER_HEAP_REQUEST_MIB, MINIMUM_REGEX_WORKER_HEAP_REQUEST_MIB, MAXIMUM_REGEX_WORKER_HEAP_REQUEST_MIB, DEFAULT_CAPTURE_DECODER_OLD_GENERATION_MIB, CAPTURE_DECODER_SEMI_SPACE_MIB, MAXIMUM_CAPTURE_DECODER_OLD_GENERATION_MIB, DEFAULT_JADX_OPERATION_TIMEOUT_MS;
function init_analysisResourceLimits() {
	return (init_analysisResourceLimits = __esmMin((() => {
		DEFAULT_ASAR_MAX_HEADER_BYTES = 16 * 1024 * 1024;
		MAXIMUM_ASAR_MAX_HEADER_BYTES = 256 * 1024 * 1024;
		DEFAULT_GHIDRA_STARTUP_TIMEOUT_MS = 33e4;
		DEFAULT_HOPPER_STARTUP_TIMEOUT_MS = 12e4;
		MAX_PROVIDER_STARTUP_TIMEOUT_MS = 2147483647;
		MAX_GHIDRA_DECOMPILE_TIMEOUT_SECONDS = Math.floor(MAX_PROVIDER_STARTUP_TIMEOUT_MS / 1e3);
		DEFAULT_REGEX_MATCHING_DEADLINE_MS = 5e3;
		MAXIMUM_REGEX_MATCHING_DEADLINE_MS = 2147483647;
		DEFAULT_REGEX_WORKER_HEAP_REQUEST_MIB = 128;
		MINIMUM_REGEX_WORKER_HEAP_REQUEST_MIB = 7;
		MAXIMUM_REGEX_WORKER_HEAP_REQUEST_MIB = 16384;
		DEFAULT_CAPTURE_DECODER_OLD_GENERATION_MIB = 192;
		CAPTURE_DECODER_SEMI_SPACE_MIB = 8;
		MAXIMUM_CAPTURE_DECODER_OLD_GENERATION_MIB = 16384;
		DEFAULT_JADX_OPERATION_TIMEOUT_MS = 12e4;
	})))();
}

//#endregion
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
//#region dist/domain/zipPackageFormat.js
var ZIP_PACKAGE_FORMATS, isZipPackageFormat, hasZipSignature, END_OF_CENTRAL_DIRECTORY, CENTRAL_DIRECTORY_HEADER, LOCAL_FILE_HEADER, END_RECORD_BYTES, MAXIMUM_COMMENT_BYTES, CENTRAL_HEADER_BYTES, locateTrailingZipArchive, zipPackageFormatForPath, zipRootPackageFormat, ZIP_NON_ENTRY_LIMITATION;
function init_zipPackageFormat() {
	return (init_zipPackageFormat = __esmMin((() => {
		ZIP_PACKAGE_FORMATS = [
			"zip",
			"ipa",
			"apk",
			"msix",
			"appx",
			"hap",
			"hsp",
			"app-pack"
		];
		isZipPackageFormat = (format) => ZIP_PACKAGE_FORMATS.some((candidate) => candidate === format);
		hasZipSignature = (bytes) => bytes.length >= 4 && bytes[0] === 80 && bytes[1] === 75 && (bytes[2] === 3 && bytes[3] === 4 || bytes[2] === 5 && bytes[3] === 6 || bytes[2] === 6 && bytes[3] === 6 || bytes[2] === 7 && bytes[3] === 8);
		END_OF_CENTRAL_DIRECTORY = 101010256;
		CENTRAL_DIRECTORY_HEADER = 33639248;
		LOCAL_FILE_HEADER = 67324752;
		END_RECORD_BYTES = 22;
		MAXIMUM_COMMENT_BYTES = 65535;
		CENTRAL_HEADER_BYTES = 46;
		locateTrailingZipArchive = async (size, read) => {
			if (!Number.isSafeInteger(size) || size < END_RECORD_BYTES) return undefined;
			const tailStart = Math.max(0, size - END_RECORD_BYTES - MAXIMUM_COMMENT_BYTES);
			const tail = Buffer.from(await read(tailStart, size - tailStart));
			if (tail.length !== size - tailStart) return undefined;
			for (let record = tail.length - END_RECORD_BYTES; record >= 0; record -= 1) {
				if (tail.readUInt32LE(record) !== END_OF_CENTRAL_DIRECTORY || record + END_RECORD_BYTES + tail.readUInt16LE(record + 20) !== tail.length) continue;
				const entriesOnDisk = tail.readUInt16LE(record + 8);
				const directoryBytes = tail.readUInt32LE(record + 12);
				const declaredDirectory = tail.readUInt32LE(record + 16);
				if (tail.readUInt16LE(record + 4) !== 0 || tail.readUInt16LE(record + 6) !== 0 || entriesOnDisk === 0 || entriesOnDisk === 65535 || entriesOnDisk !== tail.readUInt16LE(record + 10) || directoryBytes === 4294967295 || declaredDirectory === 4294967295) continue;
				const directory = tailStart + record - directoryBytes;
				const shift = directory - declaredDirectory;
				if (directory < 0 || shift < 0) continue;
				const header = Buffer.from(await read(directory, CENTRAL_HEADER_BYTES));
				if (header.length !== CENTRAL_HEADER_BYTES || header.readUInt32LE(0) !== CENTRAL_DIRECTORY_HEADER) continue;
				const firstLocal = header.readUInt32LE(42) + shift;
				if (firstLocal === 0 || firstLocal >= directory) continue;
				const local = Buffer.from(await read(firstLocal, 4));
				if (local.length === 4 && local.readUInt32LE(0) === LOCAL_FILE_HEADER) return { leadingBytes: firstLocal };
			}
			return undefined;
		};
		zipPackageFormatForPath = (path) => {
			const lower = path.toLowerCase();
			if (lower.endsWith(".zip")) return "zip";
			if (lower.endsWith(".ipa")) return "ipa";
			if (lower.endsWith(".apk")) return "apk";
			if (lower.endsWith(".msix") || lower.endsWith(".msixbundle")) return "msix";
			if (lower.endsWith(".appx") || lower.endsWith(".appxbundle")) return "appx";
			if (lower.endsWith(".hap")) return "hap";
			if (lower.endsWith(".hsp")) return "hsp";
			return undefined;
		};
		zipRootPackageFormat = (path) => {
			const lower = path.toLowerCase();
			return lower.endsWith(".app") ? "app-pack" : zipPackageFormatForPath(lower) ?? "zip";
		};
		ZIP_NON_ENTRY_LIMITATION = "ZIP inventory lists central-directory entries only. Non-entry bytes, including leading bytes before the first entry such as a self-extractor stub, an APK Signing Block before the central directory or a ZIP comment after it, are not occurrences.";
	})))();
}

//#endregion
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
//#region dist/domain/javascript/javascriptSemanticResourceLimits.js
var SEMANTIC_PRIMITIVE_CANDIDATE_LIMIT, SEMANTIC_EXPRESSION_DEPTH_LIMIT, SEMANTIC_GETTER_EXPANSION_LIMIT, SEMANTIC_ALIAS_SELECTION_LIMIT, SEMANTIC_PRIMITIVE_JSON_BYTES_LIMIT, RESOURCE_LIMIT_REASON, jsonStringBytesFromLength, exceedsSemanticPrimitiveStringByteBudget, exceedsSemanticPrimitiveAdditionByteBudget, exceedsSemanticTemplateByteBudget, semanticResourceLimitUnknown, semanticResourceLimitReason;
function init_javascriptSemanticResourceLimits() {
	return (init_javascriptSemanticResourceLimits = __esmMin((() => {
		SEMANTIC_PRIMITIVE_CANDIDATE_LIMIT = 256;
		SEMANTIC_EXPRESSION_DEPTH_LIMIT = 256;
		SEMANTIC_GETTER_EXPANSION_LIMIT = 512;
		SEMANTIC_ALIAS_SELECTION_LIMIT = 512;
		SEMANTIC_PRIMITIVE_JSON_BYTES_LIMIT = 1048576;
		RESOURCE_LIMIT_REASON = {
			"primitive-candidates": "Primitive candidate budget exceeded (maximum 256 alternatives).",
			"primitive-bytes": "Primitive string-byte budget exceeded (maximum 1048576 estimated JSON bytes).",
			"expression-depth": "Semantic expression depth budget exceeded (maximum 256 nested expressions).",
			"getter-expansion": "Getter expansion was conservatively bounded (maximum 512 scheduled states or a growing receiver cycle).",
			"alias-selections": "Alias selection expansion was conservatively bounded (maximum 512 additional selector states); selected paths remain unknown."
		};
		jsonStringBytesFromLength = (codeUnits) => codeUnits * 6 + 2;
		exceedsSemanticPrimitiveStringByteBudget = (strings) => {
			let total = 0;
			for (const value of strings) {
				total += jsonStringBytesFromLength(value.length);
				if (total > 1048576) return true;
			}
			return false;
		};
		exceedsSemanticPrimitiveAdditionByteBudget = (left, right) => {
			let total = 0;
			for (const leftValue of left) {
				for (const rightValue of right) {
					if (typeof leftValue !== "string" && typeof rightValue !== "string") continue;
					const length = String(leftValue).length + String(rightValue).length;
					total += jsonStringBytesFromLength(length);
					if (total > 1048576) return true;
				}
			}
			return false;
		};
		exceedsSemanticTemplateByteBudget = (prefixes, suffixes) => {
			let total = 0;
			for (const prefix of prefixes) {
				for (const suffix of suffixes) {
					total += jsonStringBytesFromLength(prefix.length + suffix.length);
					if (total > 1048576) return true;
				}
			}
			return false;
		};
		semanticResourceLimitUnknown = (resourceLimit) => ({
			status: "unknown",
			reason: RESOURCE_LIMIT_REASON[resourceLimit],
			resourceLimit
		});
		semanticResourceLimitReason = (resourceLimit) => RESOURCE_LIMIT_REASON[resourceLimit];
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptAstValues.js
/** Visit binding and member leaves in direct and destructuring write targets. */
function* semanticWriteTargets(root) {
	const pending = [root];
	while (pending.length > 0) {
		const next = pending.pop();
		if (next === undefined) break;
		const node = unwrapJavaScriptExpression(next).node;
		if (t.isIdentifier(node) || t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) yield node;
		else if (t.isRestElement(node)) pending.push(node.argument);
		else if (t.isAssignmentPattern(node)) pending.push(node.left);
		else if (t.isArrayPattern(node)) {
			for (const element of node.elements.toReversed()) if (element !== null) pending.push(element);
		} else if (t.isObjectPattern(node)) {
			for (const property of node.properties.toReversed()) pending.push(t.isRestElement(property) ? property.argument : property.value);
		}
	}
}
var isRuntimeJavaScriptClassProperty, runtimeFunctionParameters, javaScriptExpressionWrapperTarget, unwrapJavaScriptExpression, readExactJavaScriptLiteral, propertyName, semanticStaticPropertyName, semanticStaticPropertyKey, staticJavaScriptTruthiness, isNullishJavaScriptSyntax, UNKNOWN_STATIC_OBJECT_MEMBER, isObjectPrototypeSetter, appendStaticObjectMembers, staticObjectMembers, staticObjectProperty, staticObjectPropertyNames, semanticFinalObjectProperty, semanticFinalObjectStringProperty, semanticObjectPatternKeys, semanticWriteSiteTarget, semanticWriteSiteReadsFirst, semanticWrappedWriteSite, javascriptDisplayText, semanticMemberChain;
function init_javascriptAstValues() {
	return (init_javascriptAstValues = __esmMin((() => {
		init_javascriptSemanticResourceLimits();
		isRuntimeJavaScriptClassProperty = (node) => t.isClassProperty(node) && node.declare !== true && node.abstract !== true;
		runtimeFunctionParameters = (node) => t.isIdentifier(node.params[0], { name: "this" }) ? node.params.slice(1) : node.params;
		javaScriptExpressionWrapperTarget = (node) => t.isParenthesizedExpression(node) || t.isTSAsExpression(node) || t.isTSTypeAssertion(node) || t.isTSNonNullExpression(node) || t.isTSSatisfiesExpression(node) || t.isTSInstantiationExpression(node) || t.isTypeCastExpression(node) ? node.expression : undefined;
		unwrapJavaScriptExpression = (node, options) => {
			let current = node;
			let depth = 0;
			for (;;) {
				const target = javaScriptExpressionWrapperTarget(current);
				if (target === undefined) break;
				if (options?.stopAtParentheses === true && (t.isParenthesizedExpression(current) || current.extra?.parenthesized === true)) break;
				current = target;
				depth += 1;
			}
			return {
				node: current,
				depth
			};
		};
		readExactJavaScriptLiteral = (node) => {
			node = unwrapJavaScriptExpression(node).node;
			if (t.isStringLiteral(node)) return {
				found: true,
				value: node.value
			};
			if (t.isNumericLiteral(node) && Number.isFinite(node.value)) return {
				found: true,
				value: node.value
			};
			if (t.isBooleanLiteral(node)) return {
				found: true,
				value: node.value
			};
			if (t.isNullLiteral(node)) return {
				found: true,
				value: null
			};
			if (t.isTemplateLiteral(node) && node.expressions.length === 0 && node.quasis.length === 1) {
				const cooked = node.quasis[0]?.value.cooked;
				return cooked === null || cooked === undefined ? { found: false } : {
					found: true,
					value: cooked
				};
			}
			return { found: false };
		};
		propertyName = (node) => {
			if (t.isIdentifier(node)) return node.name;
			if (t.isStringLiteral(node) || t.isNumericLiteral(node)) return String(node.value);
			return "";
		};
		semanticStaticPropertyName = (property, computed) => semanticStaticPropertyKey(property, computed) ?? "";
		semanticStaticPropertyKey = (property, computed) => {
			property = unwrapJavaScriptExpression(property).node;
			if (t.isStringLiteral(property) || t.isNumericLiteral(property) || t.isBooleanLiteral(property)) return String(property.value);
			if (t.isNullLiteral(property)) return "null";
			if (t.isBigIntLiteral(property)) return String(property.value);
			if (t.isUnaryExpression(property, { operator: "void" })) return "undefined";
			if (t.isUnaryExpression(property, { operator: "+" })) {
				const argument = unwrapJavaScriptExpression(property.argument).node;
				if (t.isNumericLiteral(argument)) return String(argument.value);
			}
			if (t.isUnaryExpression(property, { operator: "-" })) {
				const argument = unwrapJavaScriptExpression(property.argument).node;
				if (t.isNumericLiteral(argument)) return String(-argument.value);
				if (t.isBigIntLiteral(argument)) return String(-BigInt(argument.value));
			}
			if (t.isTemplateLiteral(property) && property.expressions.length === 0 && property.quasis.length === 1) {
				const cooked = property.quasis[0]?.value.cooked;
				return cooked === null || cooked === undefined ? null : cooked;
			}
			return !computed && t.isIdentifier(property) ? property.name : null;
		};
		staticJavaScriptTruthiness = (node) => {
			const value = unwrapJavaScriptExpression(node).node;
			if (t.isBooleanLiteral(value)) return value.value;
			if (t.isNullLiteral(value)) return false;
			if (t.isStringLiteral(value)) return value.value.length > 0;
			if (t.isNumericLiteral(value)) return value.value !== 0 && !Number.isNaN(value.value);
			if (t.isObjectExpression(value) || t.isArrayExpression(value) || t.isFunctionExpression(value) || t.isArrowFunctionExpression(value)) return true;
			return undefined;
		};
		isNullishJavaScriptSyntax = (node) => {
			node = unwrapJavaScriptExpression(node).node;
			return t.isNullLiteral(node) || t.isUnaryExpression(node, { operator: "void" });
		};
		UNKNOWN_STATIC_OBJECT_MEMBER = { kind: "unknown" };
		isObjectPrototypeSetter = (property) => !property.computed && !property.shorthand && semanticStaticPropertyKey(property.key, false) === "__proto__";
		appendStaticObjectMembers = (members, object, depth, isNullish) => {
			for (const property of object.properties) {
				if (!t.isSpreadElement(property)) {
					if (t.isObjectProperty(property) && isObjectPrototypeSetter(property)) {
						if (depth === 0) members.push({ kind: "prototype-setter" });
						continue;
					}
					members.push({
						kind: "property",
						property
					});
					continue;
				}
				const { node: spread, depth: wrappers } = unwrapJavaScriptExpression(property.argument);
				if (t.isObjectExpression(spread)) {
					const nextDepth = depth + wrappers + 1;
					if (nextDepth > 256 || spread.properties.some((entry) => t.isObjectMethod(entry, { kind: "get" }))) {
						members.push(UNKNOWN_STATIC_OBJECT_MEMBER);
						continue;
					}
					appendStaticObjectMembers(members, spread, nextDepth, isNullish);
					continue;
				}
				if (t.isBooleanLiteral(spread) || t.isNumericLiteral(spread) || t.isBigIntLiteral(spread) || isNullish?.(property.argument) === true) continue;
				members.push(UNKNOWN_STATIC_OBJECT_MEMBER);
			}
		};
		staticObjectMembers = (object, depth, isNullish) => {
			const members = [];
			appendStaticObjectMembers(members, object, depth, isNullish);
			return members;
		};
		staticObjectProperty = (object, name, isNullish) => {
			if (object === undefined) return { status: "missing" };
			if (!t.isObjectExpression(object)) return { status: "dynamic" };
			let prototypeMaySupply = false;
			for (const member of staticObjectMembers(object, 0, isNullish).toReversed()) {
				if (member.kind === "prototype-setter") {
					prototypeMaySupply = true;
					continue;
				}
				if (member.kind === "unknown") return { status: "dynamic" };
				const { property } = member;
				const key = semanticStaticPropertyKey(property.key, property.computed);
				if (key === null) return { status: "dynamic" };
				if (key !== name) continue;
				return t.isObjectProperty(property) ? {
					status: "explicit",
					property
				} : { status: "dynamic" };
			}
			return prototypeMaySupply ? { status: "dynamic" } : { status: "missing" };
		};
		staticObjectPropertyNames = (object, isNullish) => {
			if (object === undefined) return { status: "missing" };
			if (!t.isObjectExpression(object)) return { status: "dynamic" };
			const names = new Set();
			let complete = true;
			for (const member of staticObjectMembers(object, 0, isNullish)) {
				if (member.kind === "prototype-setter") continue;
				if (member.kind === "unknown") {
					complete = false;
					continue;
				}
				const key = semanticStaticPropertyKey(member.property.key, member.property.computed);
				if (key === null) {
					complete = false;
					continue;
				}
				names.add(key);
			}
			return complete ? {
				status: "complete",
				names: [...names]
			} : {
				status: "partial",
				names: [...names]
			};
		};
		semanticFinalObjectProperty = (node, key) => {
			const property = staticObjectProperty(node, key);
			return property.status === "explicit" ? property.property.value : undefined;
		};
		semanticFinalObjectStringProperty = (node, key) => {
			const value = semanticFinalObjectProperty(node, key);
			return t.isStringLiteral(value) ? value.value : undefined;
		};
		semanticObjectPatternKeys = (pattern) => pattern.properties.flatMap((property) => {
			if (t.isRestElement(property)) return [];
			const key = semanticStaticPropertyKey(property.key, property.computed);
			return key === null ? [] : [key];
		});
		semanticWriteSiteTarget = (node) => {
			if (t.isAssignmentExpression(node)) return node.left;
			if (t.isUpdateExpression(node)) return node.argument;
			if (t.isUnaryExpression(node, { operator: "delete" })) return node.argument;
			if (t.isForOfStatement(node) || t.isForInStatement(node)) return node.left;
			return null;
		};
		semanticWriteSiteReadsFirst = (site) => t.isAssignmentExpression(site) && site.operator !== "=" || t.isUpdateExpression(site);
		semanticWrappedWriteSite = (node, parent, ancestors) => {
			const chain = ancestors.at(-1) === parent ? ancestors : [...ancestors, parent];
			for (let index = chain.length - 1; index >= 0; index -= 1) {
				const candidate = chain[index];
				if (candidate === undefined) return null;
				const target = semanticWriteSiteTarget(candidate);
				if (target !== null) return unwrapJavaScriptExpression(target).node === node ? candidate : null;
				if (unwrapJavaScriptExpression(candidate).depth === 0) return null;
			}
			return null;
		};
		javascriptDisplayText = (value) => value === "" ? "\"\"" : value;
		semanticMemberChain = (node, admit) => {
			const members = [];
			let current = node;
			while (current !== null && current !== undefined) {
				current = unwrapJavaScriptExpression(current).node;
				if (admit?.(current) === false) return undefined;
				if (!t.isMemberExpression(current) && !t.isOptionalMemberExpression(current)) break;
				const member = semanticStaticPropertyKey(current.property, current.computed);
				if (member === null || !t.isNode(current.object)) return undefined;
				members.push(member);
				current = current.object;
			}
			return {
				root: current,
				members: members.reverse()
			};
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptModuleDeclaration.js
var isErasedJavaScriptDeclaration, isUnmodeledJavaScriptRuntimeScope, isTypeOnlyImportDeclaration, isTypeOnlyExportDeclaration, semanticImportEqualsSpecifier, isTypeOnlyImportSpecifier, isTypeOnlyExportSpecifier, semanticRuntimeExportValueSources, hasOnlyInlineTypeImportSpecifiers, hasOnlyInlineTypeExportSpecifiers, hasUncertainTypeOnlyModuleSideEffect;
function init_javascriptModuleDeclaration() {
	return (init_javascriptModuleDeclaration = __esmMin((() => {
		init_javascriptAstValues();
		isErasedJavaScriptDeclaration = (node) => t.isTSInterfaceDeclaration(node) || t.isTSTypeAliasDeclaration(node) || t.isTSDeclareFunction(node) || (t.isVariableDeclaration(node) || t.isClassDeclaration(node) || t.isTSEnumDeclaration(node) || t.isTSModuleDeclaration(node)) && node.declare === true;
		isUnmodeledJavaScriptRuntimeScope = (node) => t.isTSModuleDeclaration(node) || t.isTSEnumDeclaration(node);
		isTypeOnlyImportDeclaration = (node) => node.importKind === "type" || node.importKind === "typeof";
		isTypeOnlyExportDeclaration = (node) => node.exportKind === "type" || t.isExportNamedDeclaration(node) && node.declaration != null && isErasedJavaScriptDeclaration(node.declaration);
		semanticImportEqualsSpecifier = (node) => node.importKind !== "type" && t.isTSExternalModuleReference(node.moduleReference) && t.isStringLiteral(node.moduleReference.expression) ? node.moduleReference.expression.value : null;
		isTypeOnlyImportSpecifier = (node) => node.importKind === "type" || node.importKind === "typeof";
		isTypeOnlyExportSpecifier = (node) => node.exportKind === "type";
		semanticRuntimeExportValueSources = (node) => {
			if (t.isExportDefaultDeclaration(node)) return isErasedJavaScriptDeclaration(node.declaration) ? [] : [node.declaration];
			if (!t.isExportNamedDeclaration(node) || node.source != null || isTypeOnlyExportDeclaration(node)) return [];
			const values = [];
			if (t.isVariableDeclaration(node.declaration)) for (const declaration of node.declaration.declarations) values.push(...semanticWriteTargets(declaration.id));
			else if ((t.isFunctionDeclaration(node.declaration) || t.isClassDeclaration(node.declaration)) && node.declaration.id != null) values.push(node.declaration.id);
			for (const specifier of node.specifiers) if (t.isExportSpecifier(specifier) && !isTypeOnlyExportSpecifier(specifier)) values.push(specifier.local);
			return values;
		};
		hasOnlyInlineTypeImportSpecifiers = (node) => !isTypeOnlyImportDeclaration(node) && node.specifiers.length > 0 && node.specifiers.every((specifier) => t.isImportSpecifier(specifier) && isTypeOnlyImportSpecifier(specifier));
		hasOnlyInlineTypeExportSpecifiers = (node) => !isTypeOnlyExportDeclaration(node) && node.source != null && node.specifiers.length > 0 && node.specifiers.every((specifier) => t.isExportSpecifier(specifier) && isTypeOnlyExportSpecifier(specifier));
		hasUncertainTypeOnlyModuleSideEffect = (program) => program.body.some((node) => t.isImportDeclaration(node) && hasOnlyInlineTypeImportSpecifiers(node) || t.isExportNamedDeclaration(node) && hasOnlyInlineTypeExportSpecifiers(node));
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSourceParser.js
var runtimeContextByProgram, javaScriptRuntimeContext, javaScriptProgramStrictness, hasRuntimeModuleDeclaration, parseWithRuntimeContext, parserPluginsForPath, isExplicitModuleSourcePath, runtimeSourceTypeForPath, parseRecoveredJavaScript, parseJavaScriptSource;
function init_javascriptSourceParser() {
	return (init_javascriptSourceParser = __esmMin((() => {
		init_javascriptModuleDeclaration();
		runtimeContextByProgram = new WeakMap();
		javaScriptRuntimeContext = (program) => runtimeContextByProgram.get(program) ?? "unknown";
		javaScriptProgramStrictness = (program) => {
			if (program.directives.some(({ value }) => value.value === "use strict")) return "strict";
			const context = javaScriptRuntimeContext(program);
			return context === "module" ? "strict" : context === "commonjs" ? "sloppy" : "unknown";
		};
		hasRuntimeModuleDeclaration = (program) => program.body.some((node) => {
			if (t.isTSImportEqualsDeclaration(node)) return semanticImportEqualsSpecifier(node) !== null;
			if (t.isImportDeclaration(node)) return !isTypeOnlyImportDeclaration(node) && !hasOnlyInlineTypeImportSpecifiers(node);
			if (t.isExportNamedDeclaration(node) || t.isExportAllDeclaration(node)) return !isTypeOnlyExportDeclaration(node) && (!t.isExportNamedDeclaration(node) || !hasOnlyInlineTypeExportSpecifiers(node) && (node.declaration == null || !isErasedJavaScriptDeclaration(node.declaration)));
			return t.isExportDefaultDeclaration(node) && !isErasedJavaScriptDeclaration(node.declaration);
		});
		parseWithRuntimeContext = (source, sourcePath, options, packageContext) => {
			const file = parse(source, options);
			runtimeContextByProgram.set(file.program, /\.c[jt]s$/iu.test(sourcePath ?? "") ? /\.d\.cts$/iu.test(sourcePath ?? "") ? "unknown" : "commonjs" : isExplicitModuleSourcePath(sourcePath) ? "module" : packageContext === "module" || packageContext === "commonjs" ? packageContext : packageContext === "unspecified" && /\.js$/iu.test(sourcePath ?? "") ? file.program.sourceType === "module" ? "module" : "commonjs" : file.program.body.some((node) => t.isTSExportAssignment(node)) ? "commonjs" : file.program.sourceType === "module" && hasRuntimeModuleDeclaration(file.program) ? "module" : "unknown");
			return file;
		};
		parserPluginsForPath = (sourcePath) => {
			const path = sourcePath ?? "";
			const syntax = ["decorators-legacy", "sourcePhaseImports"];
			if (/\.(?:js|jsx|mjs|cjs)$/iu.test(path)) return [...syntax, "jsx"];
			const dts = /\.d\.(?:ts|mts|cts)$/iu.test(path);
			const isTsLike = /\.(?:ts|cts|mts)$/iu.test(path);
			const isTsx = /\.tsx$/iu.test(path);
			const isMts = /\.mts$/iu.test(path);
			const typescript = ["typescript", {
				dts,
				...isMts ? { disallowAmbiguousJSXLike: true } : {}
			}];
			const jsxCapable = !dts && (isTsx || !isTsLike);
			return jsxCapable ? [
				...syntax,
				"jsx",
				typescript
			] : [...syntax, typescript];
		};
		isExplicitModuleSourcePath = (path) => /\.m[jt]s$/iu.test(path ?? "");
		runtimeSourceTypeForPath = (path) => /\.cjs$/iu.test(path ?? "") ? "commonjs" : isExplicitModuleSourcePath(path) ? "module" : "unambiguous";
		parseRecoveredJavaScript = (source, sourcePath, options, observedPackageType) => {
			const filenameType = runtimeSourceTypeForPath(sourcePath);
			const packageContext = /\.(?:js|ts)$/iu.test(sourcePath ?? "") && !/\.d\.ts$/iu.test(sourcePath ?? "") ? observedPackageType : undefined;
			const sourceType = filenameType !== "unambiguous" ? filenameType : packageContext === "module" ? "module" : packageContext === "commonjs" && /\.js$/iu.test(sourcePath ?? "") ? "commonjs" : "unambiguous";
			if (sourceType !== "unambiguous") {
				const normalizedOptions = { ...options };
				if (sourceType === "commonjs") {
					delete normalizedOptions.allowAwaitOutsideFunction;
					delete normalizedOptions.allowReturnOutsideFunction;
					delete normalizedOptions.allowNewTargetOutsideFunction;
				}
				return {
					file: parseWithRuntimeContext(source, sourcePath, {
						...normalizedOptions,
						sourceType,
						errorRecovery: true
					}, packageContext),
					moduleOnlyErrors: []
				};
			}
			const file = parseWithRuntimeContext(source, sourcePath, {
				...options,
				sourceType: "unambiguous",
				errorRecovery: true
			}, packageContext);
			if (file.program.sourceType !== "script" || file.errors.length === 0) return {
				file,
				moduleOnlyErrors: []
			};
			const script = parseWithRuntimeContext(source, sourcePath, {
				...options,
				sourceType: "script",
				errorRecovery: true
			}, packageContext);
			const scriptErrors = new Set(script.errors.map((error) => error.message));
			return {
				file: script,
				moduleOnlyErrors: javaScriptRuntimeContext(script.program) === "commonjs" ? [] : file.errors.map((error) => error.message).filter((message) => !scriptErrors.has(message))
			};
		};
		parseJavaScriptSource = (source, sourcePath) => {
			try {
				const runtimeSourceType = runtimeSourceTypeForPath(sourcePath);
				const commonjs = runtimeSourceType === "commonjs";
				const options = {
					errorRecovery: true,
					attachComment: false,
					plugins: parserPluginsForPath(sourcePath)
				};
				const file = parseWithRuntimeContext(source, sourcePath, {
					...options,
					sourceType: commonjs ? "unambiguous" : runtimeSourceType,
					allowReturnOutsideFunction: commonjs,
					allowNewTargetOutsideFunction: commonjs
				});
				return commonjs && file.program.sourceType === "script" && file.errors.length > 0 ? parseWithRuntimeContext(source, sourcePath, {
					...options,
					sourceType: "commonjs"
				}) : file;
			} catch (cause) {
				void cause;
				return null;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticTraversal.js
/** Cooperative value-only view of the same deterministic AST traversal. */
function* traverseJavaScriptValueAstSteps(root, erasedSyntaxNodes, visitor) {
	if (erasedSyntaxNodes.has(root)) return;
	yield* traverseJavaScriptAstSteps(root, {
		...visitor,
		skip: (node) => erasedSyntaxNodes.has(node) || visitor.skip?.(node) === true
	});
}
/**
* {@link traverseJavaScriptAst} with a yield every 1,024 visited nodes, so a
* caller can serve control messages during one large traversal. Visit order
* and callbacks are identical.
*/
function* traverseJavaScriptAstSteps(root, visitor) {
	const ancestors = [];
	const enter = (node, parent) => {
		visitor.enter(node, parent, () => [...ancestors]);
		ancestors.push(node);
		return {
			node,
			parent,
			children: childNodes(node),
			nextIndex: 0
		};
	};
	const pending = [enter(root, null)];
	let visited = 1;
	while (pending.length > 0) {
		const current = pending.at(-1);
		if (current === undefined) break;
		const child = current.children[current.nextIndex];
		if (child !== undefined) {
			current.nextIndex += 1;
			if (visited % 1024 === 0) yield;
			visited += 1;
			if (visitor.skip?.(child) === true) continue;
			pending.push(enter(child, current.node));
		} else {
			visitor.exit?.(current.node, current.parent);
			ancestors.pop();
			pending.pop();
		}
	}
}
var isErasedJavaScriptValueChild, traverseJavaScriptAst, traverseJavaScriptValueAst, completeSemanticSteps, childNodes, javaScriptAstChildKeys;
function init_javascriptSemanticTraversal() {
	return (init_javascriptSemanticTraversal = __esmMin((() => {
		init_javascriptModuleDeclaration();
		isErasedJavaScriptValueChild = (node, parent) => {
			if (isErasedJavaScriptDeclaration(node) || t.isTSType(node) || t.isTSTypeElement(node) || t.isTSDeclareMethod(node) || t.isTSTypeAnnotation(node) || t.isTSTypeParameterDeclaration(node) || t.isTSTypeParameterInstantiation(node) || t.isTSClassImplements(node) || t.isTSInterfaceHeritage(node) || t.isTSInterfaceBody(node) || t.isImportDeclaration(node) && isTypeOnlyImportDeclaration(node) || (t.isExportNamedDeclaration(node) || t.isExportAllDeclaration(node)) && isTypeOnlyExportDeclaration(node) || t.isImportSpecifier(node) && isTypeOnlyImportSpecifier(node) || t.isExportSpecifier(node) && isTypeOnlyExportSpecifier(node) || t.isTSImportEqualsDeclaration(node) && node.importKind === "type") return true;
			return t.isClassProperty(parent) && (parent.declare === true || parent.abstract === true) && !t.isDecorator(node) && !(node === parent.key && parent.computed === true && (parent.decorators?.length ?? 0) > 0);
		};
		traverseJavaScriptAst = (root, visitor) => completeSemanticSteps(traverseJavaScriptAstSteps(root, visitor));
		traverseJavaScriptValueAst = (root, erasedSyntaxNodes, visitor) => completeSemanticSteps(traverseJavaScriptValueAstSteps(root, erasedSyntaxNodes, visitor));
		completeSemanticSteps = (steps) => {
			for (;;) {
				const step = steps.next();
				if (step.done === true) return step.value;
			}
		};
		childNodes = (node) => {
			const keys = javaScriptAstChildKeys(node);
			const children = [];
			for (const key of keys) {
				const value = Reflect.get(node, key);
				if (t.isNode(value)) {
					children.push(value);
					continue;
				}
				if (!Array.isArray(value)) continue;
				for (const item of value) {
					if (t.isNode(item)) children.push(item);
				}
			}
			return children;
		};
		javaScriptAstChildKeys = (node) => t.VISITOR_KEYS[node.type] ?? [];
	})))();
}

//#endregion
//#region dist/domain/apkSignature/apkV1MetadataName.js
var APK_V1_META_INF_PREFIX, APK_V1_MANIFEST_PATH, META_INF_PREFIX_BYTES, BLOCK_SUFFIXES, isV1SignatureFileName, isV1SignatureBlockName, v1SignatureFileNameForBlock, isV1SignatureMetadataName, startsWithV1MetaInfPrefix;
function init_apkV1MetadataName() {
	return (init_apkV1MetadataName = __esmMin((() => {
		APK_V1_META_INF_PREFIX = "META-INF/";
		APK_V1_MANIFEST_PATH = `${APK_V1_META_INF_PREFIX}MANIFEST.MF`;
		META_INF_PREFIX_BYTES = Uint8Array.from([...APK_V1_META_INF_PREFIX].map((character) => character.charCodeAt(0)));
		BLOCK_SUFFIXES = [
			".RSA",
			".DSA",
			".EC"
		];
		isV1SignatureFileName = (name) => name.endsWith(".SF");
		isV1SignatureBlockName = (name) => BLOCK_SUFFIXES.some((suffix) => name.endsWith(suffix));
		v1SignatureFileNameForBlock = (block) => `${block.slice(0, block.lastIndexOf("."))}.SF`;
		isV1SignatureMetadataName = (name) => name.startsWith("META-INF/") && (name === APK_V1_MANIFEST_PATH || isV1SignatureFileName(name) || isV1SignatureBlockName(name));
		startsWithV1MetaInfPrefix = (bytes, start, length) => {
			if (length < META_INF_PREFIX_BYTES.length) return false;
			for (let index = 0; index < META_INF_PREFIX_BYTES.length; index += 1) if (bytes[start + index] !== META_INF_PREFIX_BYTES[index]) return false;
			return true;
		};
	})))();
}

//#endregion
//#region dist/config/mcpInputSchemaProfile.js
var COMPACT_INPUT_SCHEMA_BUDGET_BYTES, mcpInputSchemaProfileSchema, resolveMcpInputSchemaProfile, compactPresentationForMcpInputSchemaProfile, profileConstraint$1, parseMcpInputSchemaProfile;
function init_mcpInputSchemaProfile() {
	return (init_mcpInputSchemaProfile = __esmMin((() => {
		init_configurationErrors();
		init_result();
		COMPACT_INPUT_SCHEMA_BUDGET_BYTES = 13 * 1024;
		mcpInputSchemaProfileSchema = z.enum(["full", "compact"]);
		resolveMcpInputSchemaProfile = (profile) => profile ?? "compact";
		compactPresentationForMcpInputSchemaProfile = (profile) => resolveMcpInputSchemaProfile(profile) === "full" ? undefined : { budgetBytes: COMPACT_INPUT_SCHEMA_BUDGET_BYTES };
		profileConstraint$1 = "REA_MCP_INPUT_SCHEMA_PROFILE must be \"compact\" (default) or \"full\". The compact profile advertises bounded input schemas with fewer nested annotations; full preserves complete advertised input guidance.";
		parseMcpInputSchemaProfile = (value) => {
			if (value === undefined) return ok(undefined);
			const parsed = mcpInputSchemaProfileSchema.safeParse(value);
			return parsed.success ? ok(parsed.data) : err(new ConfigurationError(profileConstraint$1, { settings: [{
				setting: "REA_MCP_INPUT_SCHEMA_PROFILE",
				constraint: profileConstraint$1
			}] }));
		};
	})))();
}

//#endregion
//#region dist/config/mcpOutputSchemaProfile.js
var mcpOutputSchemaProfileSchema, profileConstraint, parseMcpOutputSchemaProfile;
function init_mcpOutputSchemaProfile() {
	return (init_mcpOutputSchemaProfile = __esmMin((() => {
		init_configurationErrors();
		init_result();
		mcpOutputSchemaProfileSchema = z.enum(["full", "off"]);
		profileConstraint = "REA_MCP_OUTPUT_SCHEMA_PROFILE must be \"full\" (default) or \"off\". The off profile omits output schemas from tools/list while REA validates every successful result against its canonical tool contract and returns complete structured content.";
		parseMcpOutputSchemaProfile = (value) => {
			if (value === undefined) return ok(undefined);
			const parsed = mcpOutputSchemaProfileSchema.safeParse(value);
			return parsed.success ? ok(parsed.data) : err(new ConfigurationError(profileConstraint, { settings: [{
				setting: "REA_MCP_OUTPUT_SCHEMA_PROFILE",
				constraint: profileConstraint
			}] }));
		};
	})))();
}

//#endregion
//#region dist/config/mcpStartupBudgets.js
var MCP_PHASE_BUDGET_FLOOR_MS, MCP_PHASE_BUDGET_MAXIMUM_MS, PHASES, phaseConstraint, decimalInteger, withinPhaseBudgetRange, phaseBudgetSchema, mcpInitializeBudgetMsSchema, mcpToolsListBudgetMsSchema, mcpFirstCatalogBudgetMsSchema, mcpDoctorDeadlineMsSchema, defaultBudget, parsePhaseBudget, parseMcpStartupBudgets, resolveMcpStartupBudgets, mcpPhaseBudgetRecovery;
function init_mcpStartupBudgets() {
	return (init_mcpStartupBudgets = __esmMin((() => {
		init_configurationErrors();
		init_result();
		MCP_PHASE_BUDGET_FLOOR_MS = 1;
		MCP_PHASE_BUDGET_MAXIMUM_MS = 2147483647;
		PHASES = [
			{
				key: "initialize",
				setting: "REA_MCP_INITIALIZE_BUDGET_MS",
				phase: "MCP initialize phase budget",
				defaultMilliseconds: 15e3
			},
			{
				key: "toolsList",
				setting: "REA_MCP_TOOLS_LIST_BUDGET_MS",
				phase: "MCP tools/list phase budget",
				defaultMilliseconds: 5e3
			},
			{
				key: "firstCatalog",
				setting: "REA_MCP_FIRST_CATALOG_BUDGET_MS",
				phase: "MCP first-catalog phase budget",
				defaultMilliseconds: 2e4
			},
			{
				key: "doctor",
				setting: "REA_MCP_DOCTOR_DEADLINE_MS",
				phase: "MCP doctor startup deadline",
				defaultMilliseconds: 3e4
			}
		];
		phaseConstraint = (phase) => `${phase.setting} must be a positive decimal integer from ${String(1)} to ${String(MCP_PHASE_BUDGET_MAXIMUM_MS)} ms; the default is ${String(phase.defaultMilliseconds)} ms. Node schedules a delay above that maximum as 1 ms, so a larger value is refused.`;
		decimalInteger = /^[1-9]\d*$/u;
		withinPhaseBudgetRange = (value) => {
			if (!decimalInteger.test(value)) return true;
			const parsed = BigInt(value);
			return parsed >= BigInt(1) && parsed <= BigInt(2147483647);
		};
		phaseBudgetSchema = (phase) => {
			const constraint = phaseConstraint(phase);
			return z.string().regex(decimalInteger, { error: constraint }).refine(withinPhaseBudgetRange, { error: constraint }).transform(Number);
		};
		mcpInitializeBudgetMsSchema = phaseBudgetSchema(PHASES[0]);
		mcpToolsListBudgetMsSchema = phaseBudgetSchema(PHASES[1]);
		mcpFirstCatalogBudgetMsSchema = phaseBudgetSchema(PHASES[2]);
		mcpDoctorDeadlineMsSchema = phaseBudgetSchema(PHASES[3]);
		defaultBudget = (phase) => ({
			setting: phase.setting,
			phase: phase.phase,
			milliseconds: phase.defaultMilliseconds,
			source: "default",
			defaultMilliseconds: phase.defaultMilliseconds,
			floorMilliseconds: 1,
			maximumMilliseconds: MCP_PHASE_BUDGET_MAXIMUM_MS
		});
		parsePhaseBudget = (phase, value) => {
			if (value === undefined) return ok(defaultBudget(phase));
			const parsed = phaseBudgetSchema(phase).safeParse(value);
			return parsed.success ? ok({
				setting: phase.setting,
				phase: phase.phase,
				milliseconds: parsed.data,
				source: "setting",
				defaultMilliseconds: phase.defaultMilliseconds,
				floorMilliseconds: 1,
				maximumMilliseconds: MCP_PHASE_BUDGET_MAXIMUM_MS
			}) : err(new ConfigurationError(phaseConstraint(phase), { settings: [{
				setting: phase.setting,
				constraint: phaseConstraint(phase)
			}] }));
		};
		parseMcpStartupBudgets = (environment) => {
			const issues = [];
			const budgets = new Map();
			for (const phase of PHASES) {
				const parsed = parsePhaseBudget(phase, environment[phase.setting]);
				if (!parsed.ok) issues.push(...parsed.error.settings);
				else budgets.set(phase.key, parsed.value);
			}
			if (issues.length > 0) return err(new ConfigurationError(issues.map(({ constraint }) => constraint).join(" "), { settings: issues }));
			const initialize = budgets.get("initialize");
			const toolsList = budgets.get("toolsList");
			const firstCatalog = budgets.get("firstCatalog");
			const doctor = budgets.get("doctor");
			if (initialize === undefined || toolsList === undefined || firstCatalog === undefined || doctor === undefined) throw new Error("MCP startup budget resolution dropped a phase");
			return ok({
				initialize,
				toolsList,
				firstCatalog,
				doctor
			});
		};
		resolveMcpStartupBudgets = (environment) => {
			const parsed = parseMcpStartupBudgets(environment);
			if (!parsed.ok) throw parsed.error;
			return parsed.value;
		};
		mcpPhaseBudgetRecovery = (budget) => [`The effective ${budget.setting} value for the ${budget.phase} is ${String(budget.milliseconds)} ms (source ${budget.source}; default ${String(budget.defaultMilliseconds)} ms, floor ${String(budget.floorMilliseconds)} ms, maximum ${String(budget.maximumMilliseconds)} ms).`, `Set ${budget.setting} in the environment that starts REA to a positive decimal integer from ${String(budget.floorMilliseconds)} to ${String(budget.maximumMilliseconds)}, then restart REA.`].join(" ");
	})))();
}

//#endregion
//#region dist/domain/nativeConvention.js
var foldSegment, REACT_NATIVE_SEGMENTS, FLUTTER_SEGMENTS, UNITY_SEGMENTS, DESKTOP_IL2CPP_LIBRARIES, nativeRuntimeConvention, isSwiftRuntimeLibrary, desktopPathConventions;
function init_nativeConvention() {
	return (init_nativeConvention = __esmMin((() => {
		foldSegment = (segment) => segment.toLocaleLowerCase("en-US");
		REACT_NATIVE_SEGMENTS = new Set([
			"react.framework",
			"reactnative.framework",
			"libreactnative.so",
			"libreactnativejni.so",
			"libhermes_executor.so",
			"libhermes.so",
			"hermes.framework"
		]);
		FLUTTER_SEGMENTS = new Set(["libflutter.so", "flutter.framework"]);
		UNITY_SEGMENTS = new Set(["libunity.so", "unityframework.framework"]);
		DESKTOP_IL2CPP_LIBRARIES = new Set([
			"gameassembly.dll",
			"gameassembly.so",
			"gameassembly.dylib",
			"libil2cpp.so"
		]);
		nativeRuntimeConvention = (path) => {
			const segments = path.split("/");
			for (const [index, segment] of segments.entries()) {
				const folded = foldSegment(segment);
				if (index !== segments.length - 1 && !folded.endsWith(".framework")) continue;
				if (REACT_NATIVE_SEGMENTS.has(folded)) return "react-native";
				if (FLUTTER_SEGMENTS.has(folded)) return "flutter";
				if (UNITY_SEGMENTS.has(folded)) return "unity";
			}
			return null;
		};
		isSwiftRuntimeLibrary = (path) => path.split("/").some((segment) => /^libswift.+\.dylib$/u.test(foldSegment(segment)));
		desktopPathConventions = (path) => {
			const segments = path.split("/");
			const folded = segments.map(foldSegment);
			let unityManagedDirectory = null;
			for (let index = 0; index + 2 < folded.length; index++) {
				const segment = folded[index];
				const namedDataDirectory = segment !== undefined && segment.length > 5 && segment.endsWith("_data");
				const bundleDataDirectory = segment === "data" && folded[index - 1] === "resources" && folded[index - 2] === "contents";
				if ((namedDataDirectory || bundleDataDirectory) && folded[index + 1] === "managed") unityManagedDirectory = segments.slice(0, index + 2).join("/");
			}
			const name = folded.at(-1) ?? "";
			return {
				unityManagedDirectory,
				il2cppLibrary: DESKTOP_IL2CPP_LIBRARIES.has(name),
				electronArchive: folded.at(-2) === "resources" && (name === "app.asar" || name === "default_app.asar"),
				unrealContainer: (name.endsWith(".pak") || name.endsWith(".utoc")) && folded.some((segment, index) => segment === "content" && folded[index + 1] === "paks" && index + 2 < folded.length)
			};
		};
	})))();
}

//#endregion
//#region dist/domain/apple/machoCpuIdentity.js
var CPU_SUBTYPE_CAPABILITY_MASK, machoCpuSubtypeBase, machoArchitectureName, machoArchitectureFamily;
function init_machoCpuIdentity() {
	return (init_machoCpuIdentity = __esmMin((() => {
		CPU_SUBTYPE_CAPABILITY_MASK = 4278190080;
		machoCpuSubtypeBase = (cpuSubtype) => cpuSubtype & ~CPU_SUBTYPE_CAPABILITY_MASK;
		machoArchitectureName = (cpuType, cpuSubtype) => {
			const subtype = machoCpuSubtypeBase(cpuSubtype);
			if (cpuType === 16777228) {
				if (subtype === 12) return "arm64e.x1";
				if (subtype === 2) return "arm64e";
				if (subtype === 1) return "arm64v8";
				return "arm64";
			}
			if (cpuType === 33554444) return "arm64_32";
			if (cpuType === 16777223) return subtype === 8 ? "x86_64h" : "x86_64";
			if (cpuType === 7) return "i386";
			if (cpuType === 12) return "arm";
			return `cpu-${cpuType.toString(16)}`;
		};
		machoArchitectureFamily = (architecture) => {
			if (architecture === "arm64e.x1") return "arm64e";
			if (architecture === "arm64v8") return "arm64";
			return architecture;
		};
	})))();
}

//#endregion
//#region dist/domain/native/peResources.js
var uint, range$1, identity, MAX_INSPECT_PE_FILE_BYTES, MAX_INSPECT_PE_DIRECTORY_ENTRIES, inspectPeResourcesInputSchema, peResourcesSchema;
function init_peResources() {
	return (init_peResources = __esmMin((() => {
		init_localPath();
		uint = z.number().int().min(0).max(4294967295);
		range$1 = z.strictObject({
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
			location: range$1
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
				location: range$1,
				data_directory_location: range$1
			}).nullable(),
			directories: z.array(z.strictObject({
				path: z.array(identity).max(2).describe("Type/name identities leading to this directory; [] for the root"),
				entry_locations: z.array(range$1).max(2).describe("Incoming entry file ranges corresponding to path"),
				location: range$1,
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
				entry_locations: z.array(range$1).length(3),
				data_entry_location: range$1,
				code_page: uint,
				reserved: uint,
				payload: z.strictObject({
					rva: uint,
					location: range$1,
					sha256: z.string().regex(/^[a-f0-9]{64}$/)
				})
			})),
			icon_groups: z.array(z.strictObject({
				resource_index: uint,
				images: z.array(z.strictObject({
					location: range$1,
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
//#region dist/identity.js
var PRODUCT_IDENTITY, SDK_IDENTITY;
function init_identity() {
	return (init_identity = __esmMin((() => {
		PRODUCT_IDENTITY = {
			displayName: "REA",
			packageName: PACKAGE_METADATA.name,
			packageSpecifier: `${PACKAGE_METADATA.name}@latest`,
			registrationPackageSpecifier: `${PACKAGE_METADATA.name}@${PACKAGE_METADATA.version}`,
			packageVersion: PACKAGE_METADATA.version,
			cliBinary: "rea",
			mcpCommand: `npx -y ${PACKAGE_METADATA.name}@${PACKAGE_METADATA.version} mcp`,
			mcpServerKey: "rea",
			skillName: "reverse-engineer-anything",
			skillVersion: PACKAGE_METADATA.skillVersion,
			configFileName: "rea.json"
		};
		SDK_IDENTITY = {
			server: PACKAGE_METADATA.serverSdkVersion,
			client_test: PACKAGE_METADATA.clientSdkVersion,
			core: PACKAGE_METADATA.coreSdkVersion
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptElectronMemberWrites.js
/**
* Index writes through possible lexical object identities. Resolve the complete
* object before appending the written key: self-reference properties can denote
* the same object, while replacing that property is a distinct write.
*/
function* collectJavaScriptIdentityWritesSteps(program, erasedSyntaxNodes, origin, intrinsicInvocation, staticString, freshObject, retain, observeInvocation) {
	const objectMutators = new Set([
		"defineProperty",
		"defineProperties",
		"assign",
		"setPrototypeOf"
	]);
	const reflectMutators = new Set([
		"set",
		"deleteProperty",
		"defineProperty",
		"setPrototypeOf"
	]);
	const keyedMutators = new Set([
		"set",
		"deleteProperty",
		"defineProperty"
	]);
	yield* traverseJavaScriptValueAstSteps(program, erasedSyntaxNodes, { enter: (node) => {
		if (t.isCallExpression(node) || t.isOptionalCallExpression(node) || t.isNewExpression(node) || t.isTaggedTemplateExpression(node)) {
			const invocation = t.isNewExpression(node) || t.isTaggedTemplateExpression(node) ? undefined : intrinsicInvocation(node);
			observeInvocation?.(node, invocation);
			if (t.isNewExpression(node) || t.isTaggedTemplateExpression(node)) return;
			if (invocation?.kind === "opaque") {
				for (const scope of origin(node, "opaque-call", node)) retain(node, scope);
				return;
			}
			const callee = invocation?.path;
			const arguments_ = invocation?.arguments;
			const method = callee?.at(-1);
			const owner = callee?.length === 3 ? callee[1] : undefined;
			if (owner === "Object" && objectMutators.has(method ?? "") || owner === "Reflect" && reflectMutators.has(method ?? "")) {
				const targets = owner === "Reflect" && method === "set" && arguments_ !== undefined && (arguments_.length >= 4 || arguments_.some(t.isSpreadElement)) ? [arguments_[0], arguments_.some(t.isSpreadElement) ? undefined : arguments_[3]] : [arguments_?.[0]];
				for (const target of targets) {
					if (target === undefined || t.isSpreadElement(target)) {
						for (const scope of origin(node, "opaque-call", node)) retain(node, scope);
					}
					if (t.isNode(target) && !t.isSpreadElement(target)) {
						const identities = origin(target, "member", node);
						if (identities.length > 0) {
							const key = keyedMutators.has(method ?? "") ? [staticString(arguments_?.[1]) ?? null] : [null];
							for (const identity of identities) retain(node, [...identity, ...key]);
						} else if (!freshObject(target)) {
							for (const scope of origin(node, "opaque-call", node)) retain(node, scope);
						}
					}
				}
			}
		}
		const target = semanticWriteSiteTarget(node);
		if (target === null) return;
		for (const leaf of semanticWriteTargets(target)) {
			if (t.isIdentifier(leaf)) {
				for (const identity of origin(leaf, "binding", node)) retain(node, identity);
				continue;
			}
			const member = unwrapJavaScriptExpression(leaf).node;
			if (!t.isMemberExpression(member) && !t.isOptionalMemberExpression(member)) continue;
			const key = semanticStaticPropertyKey(member.property, member.computed);
			for (const identity of origin(member.object, "member", node)) retain(node, [...identity, key]);
		}
	} });
}
var ELECTRON_MODULE, electronExportPath, ELECTRON_IDENTITY_LIMITATION, electronMemberPath;
function init_javascriptElectronMemberWrites() {
	return (init_javascriptElectronMemberWrites = __esmMin((() => {
		init_javascriptAstValues();
		init_javascriptSemanticTraversal();
		ELECTRON_MODULE = /^electron(?:\/(?:common|main|renderer|utility))?$/u;
		electronExportPath = (importedPath) => importedPath[0] === "default" ? importedPath.slice(1) : importedPath;
		ELECTRON_IDENTITY_LIMITATION = "Electron API identity follows proven lexical module aliases and structurally verified module-namespace interop. Other reassignments, dynamic selections, and visibly overwritten namespace members are unresolved; missing findings do not establish absence. Arbitrary call side effects and runtime registration are not evaluated.";
		electronMemberPath = (node) => {
			let root = unwrapJavaScriptExpression(node).node;
			const members = [];
			while (t.isMemberExpression(root) || t.isOptionalMemberExpression(root)) {
				members.push(semanticStaticPropertyKey(root.property, root.computed));
				root = unwrapJavaScriptExpression(root.object).node;
			}
			return {
				root,
				members: members.toReversed()
			};
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticEvaluationOrder.js
var preserveGrouping, semanticComputedMethodKey, semanticIterationCardinality, delayedInstanceFieldValue, semanticBranchMayBeSkipped, optionalChainMayShortCircuit, emptyAbruptLabels, emptyAbruptSummary, abruptSummaries, abruptPrefixes, abruptSummary, semanticPriorStatementMayExit;
function init_javascriptSemanticEvaluationOrder() {
	return (init_javascriptSemanticEvaluationOrder = __esmMin((() => {
		init_javascriptAstValues();
		init_javascriptSemanticTraversal();
		preserveGrouping = { stopAtParentheses: true };
		semanticComputedMethodKey = (parent, child) => (t.isObjectMethod(parent) || t.isClassMethod(parent)) && parent.computed && parent.key === child;
		semanticIterationCardinality = (loop, prototypeMayAffectEnumeration) => {
			const iterable = unwrapJavaScriptExpression(loop.right).node;
			const literal = readExactJavaScriptLiteral(iterable);
			if (t.isForOfStatement(loop)) {
				if (prototypeMayAffectEnumeration !== false) return "unknown";
				if (t.isArrayExpression(iterable)) {
					if (iterable.elements.length === 0) return "empty";
					if (iterable.elements.some((element) => element === null || !t.isSpreadElement(element))) return "nonempty";
					return "unknown";
				}
				if (literal.found && typeof literal.value === "string") return literal.value.length === 0 ? "empty" : "nonempty";
				return "unknown";
			}
			if (t.isObjectExpression(iterable)) {
				let prototype;
				for (const property of iterable.properties) {
					if (t.isSpreadElement(property)) return "unknown";
					const key = semanticStaticPropertyKey(property.key, property.computed);
					if (t.isObjectProperty(property) && !property.computed && !property.shorthand && key === "__proto__") {
						prototype = unwrapJavaScriptExpression(property.value).node;
						continue;
					}
					if (key === null) return "unknown";
					return "nonempty";
				}
				if (t.isNullLiteral(prototype)) return "empty";
				if (prototype !== undefined && !readExactJavaScriptLiteral(prototype).found) return "unknown";
				return prototypeMayAffectEnumeration === false ? "empty" : "unknown";
			}
			if (literal.found && literal.value === null) return "empty";
			if (literal.found && typeof literal.value === "string" && literal.value.length > 0) return "nonempty";
			if (literal.found) return prototypeMayAffectEnumeration === false ? "empty" : "unknown";
			return "unknown";
		};
		delayedInstanceFieldValue = (parent, child) => (t.isClassProperty(parent) || t.isClassPrivateProperty(parent) || t.isClassAccessorProperty(parent)) && !parent.static && parent.value === child;
		semanticBranchMayBeSkipped = (parent, child) => {
			if (delayedInstanceFieldValue(parent, child)) return true;
			if (t.isIfStatement(parent)) return child === parent.consequent || child === parent.alternate;
			if (t.isSwitchCase(parent)) return true;
			if (t.isTryStatement(parent)) return child === parent.block || child === parent.handler;
			if (t.isForStatement(parent)) return child === parent.body || child === parent.update;
			if (t.isWhileStatement(parent)) return child === parent.body;
			if (t.isDoWhileStatement(parent)) return child === parent.test;
			if (t.isForInStatement(parent) || t.isForOfStatement(parent)) return child === parent.left || child === parent.body;
			if (t.isLogicalExpression(parent)) return child === parent.right;
			if (t.isAssignmentPattern(parent)) return child === parent.right;
			if (t.isAssignmentExpression(parent)) return [
				"&&=",
				"||=",
				"??="
			].includes(parent.operator) && child === parent.right;
			if (t.isConditionalExpression(parent)) return child === parent.consequent || child === parent.alternate;
			if (t.isOptionalCallExpression(parent) || t.isCallExpression(parent)) return parent.arguments.includes(child) && (t.isOptionalCallExpression(parent) && parent.optional || optionalChainMayShortCircuit(parent.callee));
			if (t.isOptionalMemberExpression(parent)) return parent.computed && child === parent.property && (parent.optional || optionalChainMayShortCircuit(parent.object));
			return false;
		};
		optionalChainMayShortCircuit = (expression) => {
			let current = expression;
			while (true) {
				if (current.extra?.parenthesized === true) return false;
				const unwrapped = unwrapJavaScriptExpression(current, preserveGrouping).node;
				if (unwrapped !== current) {
					current = unwrapped;
					continue;
				}
				if (t.isOptionalMemberExpression(current)) {
					if (current.optional) return true;
					current = current.object;
				} else if (t.isMemberExpression(current)) current = current.object;
				else if (t.isOptionalCallExpression(current)) {
					if (current.optional) return true;
					current = current.callee;
				} else if (t.isCallExpression(current)) current = current.callee;
				else return false;
			}
		};
		emptyAbruptLabels = new Set();
		emptyAbruptSummary = {
			breaks: emptyAbruptLabels,
			continues: emptyAbruptLabels
		};
		abruptSummaries = new WeakMap();
		abruptPrefixes = new WeakMap();
		abruptSummary = (root) => {
			const pending = [{
				node: root,
				visited: false
			}];
			while (pending.length > 0) {
				const { node, visited } = pending.pop();
				if (abruptSummaries.has(node)) continue;
				const children = t.isFunction(node) || t.isClass(node) ? [] : childNodes(node).filter((child) => t.isStatement(child) || t.isSwitchCase(child) || t.isCatchClause(child));
				if (!visited) {
					pending.push({
						node,
						visited: true
					});
					for (const child of children) if (!abruptSummaries.has(child)) pending.push({
						node: child,
						visited: false
					});
					continue;
				}
				let breaks, continues;
				if (t.isBreakStatement(node)) (breaks ??= new Set()).add(node.label?.name ?? null);
				if (t.isContinueStatement(node)) (continues ??= new Set()).add(node.label?.name ?? null);
				for (const child of children) {
					const summary = abruptSummaries.get(child);
					for (const label of summary.breaks) (breaks ??= new Set()).add(label);
					for (const label of summary.continues) (continues ??= new Set()).add(label);
				}
				if (t.isLoop(node) || t.isSwitchStatement(node)) breaks?.delete(null);
				if (t.isLoop(node)) continues?.delete(null);
				if (t.isLabeledStatement(node)) {
					breaks?.delete(node.label.name);
					continues?.delete(node.label.name);
				}
				abruptSummaries.set(node, (breaks?.size ?? 0) > 0 || (continues?.size ?? 0) > 0 ? {
					breaks: breaks ?? emptyAbruptLabels,
					continues: continues ?? emptyAbruptLabels
				} : emptyAbruptSummary);
			}
			return abruptSummaries.get(root);
		};
		semanticPriorStatementMayExit = (parent, child) => {
			if (!t.isBlockStatement(parent) && !t.isProgram(parent)) return false;
			let skipped = abruptPrefixes.get(parent);
			if (skipped === undefined) {
				const prefixes = new Set();
				let exits = false;
				for (const statement of parent.body) {
					if (exits) prefixes.add(statement);
					const summary = abruptSummary(statement);
					exits ||= summary.breaks.size > 0 || summary.continues.size > 0;
				}
				skipped = prefixes;
				abruptPrefixes.set(parent, skipped);
			}
			return skipped.has(child);
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticMutationInitializers.js
var initializerPositionCaches, initializerPositionCache, statementPosition, positionPrecedes, semanticTopLevelEffectFollowsCapture, scopeExitMarkers, scopeExitOwners, semanticScopeExitEffect, withinScopeExit, semanticEffectFollowsReference, semanticEffectTiming, semanticEnclosingIteration, expressionSiblings, expressionChildIndices, expressionEvaluationOrder, computeDirectInitializerPosition, directInitializerPosition, computeDirectMutationPosition, directMutationPosition, semanticDefiniteEffectPrecedesReference, semanticReadPrecedesEffectWithinActivation, semanticEffectTimingWithinActivation, computeReferenceInitializerPosition, referenceInitializerPosition, initializerPosition, semanticMutationInitializers, bindingReadPosition, semanticCaptureOrderingIdentity, semanticBindingAtRead, selectInitializers, initializerMayRetainEntry, retainedInitializerOrigins, semanticCapturePosition, semanticBindingPrecedesCapture, semanticBindingEffectFollowsCapture, semanticBindingEffectFollowsRead, semanticEscapeFollowsCapture;
function init_javascriptSemanticMutationInitializers() {
	return (init_javascriptSemanticMutationInitializers = __esmMin((() => {
		init_javascriptSemanticEvaluationOrder();
		init_javascriptAstValues();
		init_javascriptSemanticState();
		initializerPositionCaches = new WeakMap();
		initializerPositionCache = (parents) => {
			const cached = initializerPositionCaches.get(parents);
			if (cached !== undefined) return cached;
			const created = {
				direct: new WeakMap(),
				mutation: new WeakMap(),
				reference: new WeakMap(),
				read: new WeakMap(),
				evaluationChildren: new WeakMap(),
				expressionAncestry: undefined
			};
			initializerPositionCaches.set(parents, created);
			return created;
		};
		statementPosition = (statement, parents, declarator) => {
			const directParent = parents.get(statement);
			const enclosing = (t.isExportNamedDeclaration(directParent) || t.isExportDefaultDeclaration(directParent)) && directParent.declaration === statement ? directParent : statement;
			const parent = parents.get(enclosing);
			if (!t.isProgram(parent) && !t.isBlockStatement(parent)) return null;
			const index = parent.body.indexOf(enclosing);
			return index < 0 ? null : {
				body: parent.body,
				index,
				declaratorIndex: t.isVariableDeclaration(statement) && declarator !== undefined ? statement.declarations.indexOf(declarator) : -1
			};
		};
		positionPrecedes = (left, right) => left.body === right.body && (left.index < right.index || left.index === right.index && left.declaratorIndex >= 0 && left.declaratorIndex < right.declaratorIndex);
		semanticTopLevelEffectFollowsCapture = (capture, effect, parents) => {
			const position = (node) => {
				let selected = null;
				let declarator;
				let child;
				while (node !== undefined) {
					if (t.isFunction(node) || t.isLoop(node)) return null;
					if (delayedInstanceFieldValue(node, child)) return null;
					if (t.isVariableDeclarator(node)) declarator = node;
					if (t.isStatement(node)) {
						const enclosing = statementPosition(node, parents, declarator);
						if (enclosing !== null) selected = enclosing;
					}
					if (t.isProgram(node)) return selected;
					child = node;
					node = parents.get(node);
				}
				return null;
			};
			const before = position(capture);
			const after = position(effect);
			if (before === null || after === null) return false;
			if (positionPrecedes(before, after)) return true;
			if (before.body !== after.body || before.index !== after.index || before.declaratorIndex !== after.declaratorIndex) return false;
			return expressionEvaluationOrder(capture, effect, parents) === "before";
		};
		scopeExitMarkers = new WeakMap();
		scopeExitOwners = new WeakMap();
		semanticScopeExitEffect = (scope) => {
			const cached = scopeExitMarkers.get(scope);
			if (cached !== undefined) return cached;
			const marker = t.emptyStatement();
			if (scope.end !== undefined) {
				marker.start = scope.end;
				marker.end = scope.end;
			}
			if (scope.loc != null) marker.loc = {
				...scope.loc,
				start: scope.loc.end,
				end: scope.loc.end
			};
			scopeExitMarkers.set(scope, marker);
			scopeExitOwners.set(marker, scope);
			return marker;
		};
		withinScopeExit = (reference, scope, parents) => {
			for (let node = reference; node !== undefined; node = parents.get(node)) {
				if (node === scope) {
					for (let owner = parents.get(scope); owner !== undefined; owner = parents.get(owner)) {
						if (t.isLoop(owner)) return false;
						if (t.isFunction(owner)) break;
					}
					return !t.isLoop(scope);
				}
				if (t.isFunction(node) || t.isLoop(node)) return false;
			}
			return false;
		};
		semanticEffectFollowsReference = (reference, effect, parents) => {
			if (reference === effect) return false;
			const exit = effect === undefined ? undefined : scopeExitOwners.get(effect);
			if (exit !== undefined) {
				if (withinScopeExit(reference, exit, parents)) return true;
				effect = exit;
			}
			let current = reference;
			let child;
			while (current !== undefined && current !== effect) {
				if (t.isFunction(current)) break;
				child = current;
				current = parents.get(current);
			}
			const loopInput = (t.isForInStatement(effect) || t.isForOfStatement(effect)) && child === effect.right;
			let once = current;
			child = undefined;
			while (once !== undefined) {
				const initialLoopInput = t.isForStatement(once) && child === once.init || (t.isForInStatement(once) || t.isForOfStatement(once)) && child === once.right || once === effect && loopInput;
				if (t.isFunction(once) || t.isLoop(once) && !initialLoopInput || delayedInstanceFieldValue(once, child)) break;
				child = once;
				once = parents.get(once);
			}
			return current === effect && once === undefined && (t.isAssignmentExpression(effect) || t.isUpdateExpression(effect) || t.isVariableDeclarator(effect) || t.isCallExpression(effect) || t.isOptionalCallExpression(effect) || t.isNewExpression(effect)) || current === effect && once === undefined && loopInput || semanticTopLevelEffectFollowsCapture(reference, effect, parents);
		};
		semanticEffectTiming = (site, effect, state) => {
			if (effect === undefined) return "unknown";
			const exit = scopeExitOwners.get(effect);
			if (exit !== undefined) {
				if (withinScopeExit(site, exit, state.parentsByNode)) return "after";
				effect = exit;
			}
			if (site === effect && (t.isCallExpression(site) || t.isOptionalCallExpression(site) || t.isNewExpression(site))) return "after";
			const loop = semanticEnclosingIteration(effect, state);
			if (loop !== undefined) {
				const cardinality = semanticIterationCardinality(loop, state.prototypeEnumerationMayAffect);
				if (cardinality === "empty") return "after";
				if (cardinality === "nonempty") {
					const loopParent = state.parentsByNode.get(loop);
					const crossesFunction = (node) => {
						let current = node;
						while (current !== undefined) {
							if (t.isFunction(current)) return true;
							current = state.parentsByNode.get(current);
						}
						return false;
					};
					if (loopParent === state.program && !crossesFunction(site) && typeof loop.start === "number" && typeof loop.end === "number" && typeof site.start === "number") {
						if (site.start > loop.end) return "before";
						if (site.start < loop.start) return "after";
					}
				}
			}
			if (semanticEffectFollowsReference(site, effect, state.parentsByNode)) return "after";
			if (semanticEffectFollowsReference(effect, site, state.parentsByNode)) return "before";
			return "unknown";
		};
		semanticEnclosingIteration = (node, state) => {
			let current = node;
			while (current !== undefined) {
				if (t.isForInStatement(current) || t.isForOfStatement(current)) return current;
				if (t.isFunction(current)) return undefined;
				current = state.parentsByNode.get(current);
			}
			return undefined;
		};
		expressionSiblings = (earlier, later, parents) => {
			const cache = initializerPositionCache(parents);
			let context = cache.expressionAncestry;
			if (context?.source !== earlier) {
				const ancestors = new Map();
				let child;
				for (let node = earlier; node !== undefined; node = parents.get(node)) {
					ancestors.set(node, child);
					child = node;
				}
				context = {
					source: earlier,
					ancestors,
					siblings: new WeakMap()
				};
				cache.expressionAncestry = context;
			}
			const path = [];
			let result = null;
			for (let node = later; node !== undefined; node = parents.get(node)) {
				if (context.ancestors.has(node)) {
					const sourceChild = context.ancestors.get(node);
					const readChild = path.at(-1);
					if (sourceChild !== undefined && readChild !== undefined) result = {
						common: node,
						earlier: sourceChild,
						later: readChild
					};
					break;
				}
				const cached = context.siblings.get(node);
				if (cached !== undefined) {
					result = cached;
					break;
				}
				path.push(node);
			}
			for (const node of path) context.siblings.set(node, result);
			return result;
		};
		expressionChildIndices = (node, parents) => {
			const cache = initializerPositionCache(parents).evaluationChildren;
			const cached = cache.get(node);
			if (cached !== undefined) return cached;
			const children = (() => {
				if (t.isSequenceExpression(node)) return node.expressions;
				if (t.isArrayExpression(node)) return node.elements;
				if (t.isObjectExpression(node)) return node.properties;
				if (t.isObjectProperty(node)) return node.computed ? [node.key, node.value] : [node.value];
				if (t.isCallExpression(node) || t.isOptionalCallExpression(node) || t.isNewExpression(node)) return node.arguments;
				if (t.isBinaryExpression(node) || t.isLogicalExpression(node)) return [node.left, node.right];
				if (t.isConditionalExpression(node)) return [node.test];
				return null;
			})();
			if (children === null) {
				cache.set(node, null);
				return null;
			}
			const indices = new Map();
			let index = 0;
			if (t.isCallExpression(node) || t.isOptionalCallExpression(node) || t.isNewExpression(node)) indices.set(node.callee, index++);
			for (const child of children) {
				if (child !== null) indices.set(child, index);
				index++;
			}
			cache.set(node, indices);
			return indices;
		};
		expressionEvaluationOrder = (earlier, later, parents) => {
			if (later === undefined) return "unresolved";
			const siblings = expressionSiblings(earlier, later, parents);
			if (siblings === null) return "unresolved";
			const children = expressionChildIndices(siblings.common, parents);
			const earlierIndex = children?.get(siblings.earlier);
			const laterIndex = children?.get(siblings.later);
			if (earlierIndex === undefined || laterIndex === undefined || earlierIndex === laterIndex) return "unresolved";
			return earlierIndex < laterIndex ? "before" : "after";
		};
		computeDirectInitializerPosition = (node, parents) => {
			if (t.isClassDeclaration(node) && node.id !== null) return statementPosition(node, parents);
			if (t.isAssignmentExpression(node) && t.isIdentifier(unwrapJavaScriptExpression(node.left).node) || t.isUpdateExpression(node)) return directMutationPosition(node, parents);
			const parent = parents.get(node);
			if (t.isVariableDeclarator(parent) && parent.init === node) {
				const declaration = parents.get(parent);
				return t.isVariableDeclaration(declaration) ? statementPosition(declaration, parents, parent) : null;
			}
			if (t.isAssignmentExpression(parent) && parent.right === node && t.isIdentifier(parent.left)) {
				return directMutationPosition(parent, parents);
			}
			return null;
		};
		directInitializerPosition = (node, parents) => {
			const cache = initializerPositionCache(parents);
			const cached = cache.direct.get(node);
			if (cached !== undefined) return cached;
			const computed = computeDirectInitializerPosition(node, parents);
			cache.direct.set(node, computed);
			return computed;
		};
		computeDirectMutationPosition = (node, parents) => {
			if (t.isForOfStatement(node)) return statementPosition(node, parents);
			if (t.isVariableDeclarator(node)) {
				const declaration = parents.get(node);
				return t.isVariableDeclaration(declaration) ? statementPosition(declaration, parents, node) : null;
			}
			if (t.isSpreadElement(node)) {
				const array = parents.get(node);
				return t.isArrayExpression(array) ? semanticCapturePosition(array, parents) : null;
			}
			if (!t.isAssignmentExpression(node) && !t.isUpdateExpression(node) && !t.isUnaryExpression(node, { operator: "delete" }) && !t.isCallExpression(node) && !t.isOptionalCallExpression(node) && !t.isNewExpression(node) && !t.isTaggedTemplateExpression(node)) return null;
			let current = node;
			while (true) {
				const parent = parents.get(current);
				if (parent === undefined || t.isFunction(parent) || semanticBranchMayBeSkipped(parent, current)) return null;
				if (t.isStatement(parent)) return statementPosition(parent, parents);
				if (t.isVariableDeclarator(parent)) {
					const declaration = parents.get(parent);
					return t.isVariableDeclaration(declaration) ? statementPosition(declaration, parents, parent) : null;
				}
				current = parent;
			}
		};
		directMutationPosition = (node, parents) => {
			const cache = initializerPositionCache(parents);
			const cached = cache.mutation.get(node);
			if (cached !== undefined) return cached;
			const computed = computeDirectMutationPosition(node, parents);
			cache.mutation.set(node, computed);
			return computed;
		};
		semanticDefiniteEffectPrecedesReference = (effect, reference, parents) => {
			const before = directMutationPosition(effect, parents);
			const after = bindingReadPosition(reference, parents);
			if (before === null || after.position === null || after.repeatingLoop) return false;
			if (positionPrecedes(before, after.position)) return true;
			return before.body === after.position.body && before.index === after.position.index && before.declaratorIndex === after.position.declaratorIndex && expressionEvaluationOrder(effect, reference, parents) === "before";
		};
		semanticReadPrecedesEffectWithinActivation = (read, effect, parents) => {
			const before = bindingReadPosition(read, parents);
			const after = directMutationPosition(effect, parents);
			if (before.position === null || before.repeatingLoop || after === null) return false;
			if (positionPrecedes(before.position, after)) return true;
			return before.position.body === after.body && before.position.index === after.index && before.position.declaratorIndex === after.declaratorIndex && expressionEvaluationOrder(read, effect, parents) === "before";
		};
		semanticEffectTimingWithinActivation = (site, effect, state) => {
			if (effect !== undefined) {
				if (semanticDefiniteEffectPrecedesReference(site, effect, state.parentsByNode)) return "after";
				if (semanticDefiniteEffectPrecedesReference(effect, site, state.parentsByNode)) return "before";
			}
			return semanticEffectTiming(site, effect, state);
		};
		computeReferenceInitializerPosition = (node, parents) => {
			let current = node;
			while (true) {
				const direct = directInitializerPosition(current, parents);
				if (direct !== null) return direct;
				const parent = parents.get(current);
				if (t.isAssignmentExpression(parent, { operator: "=" }) && (t.isObjectPattern(parent.left) || t.isArrayPattern(parent.left))) return directMutationPosition(parent, parents);
				if (t.isFunction(parent)) return t.isBlockStatement(parent.body) ? {
					body: parent.body.body,
					index: -1,
					declaratorIndex: -1
				} : null;
				if (parent === undefined || t.isStatement(parent) || delayedInstanceFieldValue(parent, current)) return null;
				if (t.isVariableDeclarator(parent)) {
					const declaration = parents.get(parent);
					return t.isVariableDeclaration(declaration) ? statementPosition(declaration, parents, parent) : null;
				}
				current = parent;
			}
		};
		referenceInitializerPosition = (node, parents) => {
			const cache = initializerPositionCache(parents);
			const cached = cache.reference.get(node);
			if (cached !== undefined) return cached;
			const computed = computeReferenceInitializerPosition(node, parents);
			cache.reference.set(node, computed);
			return computed;
		};
		initializerPosition = (initializer, parents, reference = false) => {
			if (initializer.entryBody !== undefined) return {
				body: initializer.entryBody.body,
				index: -1,
				declaratorIndex: -1
			};
			return reference ? referenceInitializerPosition(initializer.node, parents) : directInitializerPosition(initializer.node, parents);
		};
		semanticMutationInitializers = (binding, mutation, parents) => {
			const mutationPosition = directMutationPosition(mutation, parents) ?? referenceInitializerPosition(mutation, parents);
			if (mutationPosition === null) return binding;
			const origins = [...binding.initializers.map((initializer) => ({
				initializer,
				position: initializerPosition(initializer, parents)
			})), ...binding.referenceInitializers.map((initializer) => ({
				initializer,
				position: initializerPosition(initializer, parents, true)
			}))];
			if (origins.some(({ position }) => position === null || !positionPrecedes(position, mutationPosition))) return binding;
			const { retained, replacesEntry } = retainedInitializerOrigins(origins, binding, parents);
			return {
				directOrigins: replacesEntry ? [] : binding.directOrigins,
				initializers: binding.initializers.filter((initializer) => retained.has(initializer)),
				referenceInitializers: binding.referenceInitializers.filter((initializer) => retained.has(initializer))
			};
		};
		bindingReadPosition = (read, parents) => {
			const cache = initializerPositionCache(parents).read;
			const path = [];
			let current = read;
			let result;
			while (true) {
				const cached = cache.get(current);
				if (cached !== undefined) {
					result = cached;
					break;
				}
				path.push(current);
				const parent = parents.get(current);
				if (t.isLoop(parent)) {
					result = {
						position: null,
						repeatingLoop: parent
					};
					break;
				}
				if (parent === undefined || t.isFunction(parent) && !semanticComputedMethodKey(parent, current) || delayedInstanceFieldValue(parent, current)) {
					result = {
						position: null,
						repeatingLoop: undefined
					};
					break;
				}
				current = parent;
			}
			for (let index = path.length - 1; index >= 0; index--) {
				const node = path[index];
				if (node === undefined) continue;
				const parent = parents.get(node);
				let position = null;
				if (t.isVariableDeclarator(parent)) {
					const declaration = parents.get(parent);
					if (t.isVariableDeclaration(declaration)) position = statementPosition(declaration, parents, parent);
				} else if (t.isStatement(parent) && !t.isLoop(parent) && !t.isFunction(parent)) position = statementPosition(parent, parents);
				if (position !== null && position !== result.position) result = {
					...result,
					position
				};
				cache.set(node, result);
			}
			return result;
		};
		semanticCaptureOrderingIdentity = (capture, parents) => {
			if (!t.isMemberExpression(capture) && !t.isOptionalMemberExpression(capture)) return capture;
			const loop = bindingReadPosition(capture, parents).repeatingLoop;
			if (loop === undefined) return capture;
			let child = capture;
			for (let parent = parents.get(child); parent !== undefined && parent !== loop; parent = parents.get(child)) child = parent;
			if (t.isForStatement(loop) && child === loop.init || (t.isForInStatement(loop) || t.isForOfStatement(loop)) && child === loop.right) return capture;
			return loop;
		};
		semanticBindingAtRead = (binding, read, parents) => {
			if (binding.initializers.length === 0 && binding.referenceInitializers.length === 0) return {
				status: "ordered",
				binding,
				hasDefiniteInitializer: false
			};
			const [soleInitializer] = binding.initializers;
			if (binding.initializers.length === 1 && binding.referenceInitializers.length === 0 && binding.declarationKinds.size === 0 && binding.definitions.length === 1 && binding.definitions[0]?.kind === "function" && soleInitializer !== undefined && t.isFunctionDeclaration(soleInitializer.node)) return {
				status: "ordered",
				binding,
				hasDefiniteInitializer: true
			};
			if (soleInitializer !== undefined && t.isClass(soleInitializer.node) && binding.scopeId === semanticScopeId("class", soleInitializer.node) && !binding.mutable && binding.initializers.length === 1 && binding.referenceInitializers.length === 0 && !binding.definitions.some(({ kind }) => kind === "assignment")) {
				const owner = soleInitializer.node;
				let child = read;
				let memberPart;
				for (let parent = parents.get(child); parent !== undefined; child = parent, parent = parents.get(parent)) {
					if (parents.get(parent) === owner.body) memberPart = child;
					if (parent === owner.body) {
						if (t.isClassMethod(child) || t.isClassPrivateMethod(child) ? memberPart === child.body : t.isStaticBlock(child) || (t.isClassProperty(child) || t.isClassPrivateProperty(child) || t.isClassAccessorProperty(child)) && memberPart === child.value) return {
							status: "ordered",
							binding,
							hasDefiniteInitializer: true
						};
						break;
					}
					if (parent === owner) break;
				}
			}
			const initializer = binding.initializers[0];
			const reference = binding.referenceInitializers[0];
			const origin = initializer ?? reference;
			const sourcePosition = initializer === undefined ? reference === undefined ? null : initializerPosition(reference, parents, true) : initializerPosition(initializer, parents);
			const { position, repeatingLoop } = bindingReadPosition(read, parents);
			const hasDefiniteInitializer = position !== null && [...binding.initializers, ...binding.referenceInitializers.filter(({ assignment }) => assignment)].some((initializer) => {
				const source = initializerPosition(initializer, parents, binding.referenceInitializers.includes(initializer));
				return source !== null && positionPrecedes(source, position) && !initializerMayRetainEntry(initializer, binding, parents);
			});
			if (!repeatingLoop && origin !== undefined && binding.initializers.length + binding.referenceInitializers.length === 1 && sourcePosition !== null && position !== null && positionPrecedes(sourcePosition, position)) return {
				status: "ordered",
				binding,
				hasDefiniteInitializer
			};
			const uncertainOrder = repeatingLoop || sourcePosition === null || position === null || sourcePosition.body !== position.body;
			if (uncertainOrder) return {
				status: "unresolved",
				binding,
				hasDefiniteInitializer
			};
			const selected = selectInitializers(binding, position, read, parents);
			if (selected === undefined) return {
				status: "unresolved",
				binding,
				hasDefiniteInitializer
			};
			if (selected.binding === binding) return {
				status: "ordered",
				binding,
				hasDefiniteInitializer: hasDefiniteInitializer || selected.hasDefiniteInitializer
			};
			return {
				status: "ordered",
				hasDefiniteInitializer: hasDefiniteInitializer || selected.hasDefiniteInitializer,
				binding: {
					...binding,
					...selected.binding,
					definitions: binding.definitions.filter(({ kind }) => kind !== "assignment")
				}
			};
		};
		selectInitializers = (binding, position, read, parents) => {
			if (position === null) return undefined;
			const origins = [...binding.initializers.map((initializer) => ({
				initializer,
				position: initializerPosition(initializer, parents)
			})), ...binding.referenceInitializers.map((initializer) => ({
				initializer,
				position: initializerPosition(initializer, parents, true)
			}))];
			const preceding = [];
			for (const origin of origins) {
				const source = origin.position;
				if (source === null || source.body !== position.body) return undefined;
				if (positionPrecedes(source, position)) preceding.push(origin);
				else if (!positionPrecedes(position, source)) {
					if (source.index !== position.index || source.declaratorIndex !== position.declaratorIndex) return undefined;
					const order = expressionEvaluationOrder(origin.initializer.node, read, parents);
					if (order === "unresolved") return undefined;
					if (order === "before") preceding.push(origin);
				}
			}
			const { retained, replacesEntry } = retainedInitializerOrigins(preceding, binding, parents);
			if (binding.initializers.every((initializer) => retained.has(initializer)) && binding.referenceInitializers.every((initializer) => retained.has(initializer))) return {
				binding,
				hasDefiniteInitializer: replacesEntry
			};
			return {
				hasDefiniteInitializer: replacesEntry,
				binding: {
					initializers: binding.initializers.filter((initializer) => retained.has(initializer)),
					referenceInitializers: binding.referenceInitializers.filter((initializer) => retained.has(initializer))
				}
			};
		};
		initializerMayRetainEntry = (initializer, binding, parents) => {
			const node = initializer.node, parent = parents.get(node);
			const assignment = t.isAssignmentExpression(node) ? node : t.isAssignmentExpression(parent) && parent.right === node ? parent : undefined;
			if (assignment === undefined || ![
				"&&=",
				"||=",
				"??="
			].includes(assignment.operator)) return false;
			const emptyLocal = node === assignment.right && binding.kind === "variable" && !binding.runtimeImport && binding.initializers.length === 1 && binding.initializers[0] === initializer && binding.referenceInitializers.length === 0 && binding.directOrigins.length === 0 && binding.definitions.some(({ kind }) => kind === "variable") && binding.definitions.every(({ kind }) => kind === "variable" || kind === "assignment");
			return !emptyLocal;
		};
		retainedInitializerOrigins = (origins, binding, parents) => {
			const latest = origins.reduce((latest, { initializer, position }) => position !== null && !initializerMayRetainEntry(initializer, binding, parents) && (latest === null || positionPrecedes(latest, position)) ? position : latest, null);
			return {
				replacesEntry: latest !== null,
				retained: new Set(origins.filter(({ position }) => latest === null || position?.index === latest.index && position?.declaratorIndex === latest.declaratorIndex || position !== null && positionPrecedes(latest, position)).map(({ initializer }) => initializer))
			};
		};
		semanticCapturePosition = (node, parents) => {
			let current = node;
			while (true) {
				const direct = directInitializerPosition(current, parents);
				if (direct !== null) return direct;
				const parent = parents.get(current);
				if (t.isReturnStatement(parent) && parent.argument === current) return statementPosition(parent, parents);
				if (t.isObjectProperty(parent) && parent.value === current && semanticStaticPropertyKey(parent.key, parent.computed) !== null) current = parent;
				else if (t.isSpreadElement(parent) && parent.argument === current && t.isObjectExpression(parents.get(parent))) current = parent;
				else if (t.isObjectExpression(parent) || t.isArrayExpression(parent)) current = parent;
				else return null;
			}
		};
		semanticBindingPrecedesCapture = (binding, capture, parents) => {
			const initializer = binding.initializers[0];
			if (binding.initializers.length !== 1 || initializer === undefined) return false;
			const sourcePosition = initializerPosition(initializer, parents);
			const capturePosition = semanticCapturePosition(capture, parents);
			return sourcePosition !== null && capturePosition !== null && positionPrecedes(sourcePosition, capturePosition);
		};
		semanticBindingEffectFollowsCapture = (binding, capture, effect, parents) => {
			if (!semanticBindingPrecedesCapture(binding, capture, parents)) return false;
			const captured = semanticCapturePosition(capture, parents);
			const written = directMutationPosition(effect, parents);
			return captured !== null && written !== null && positionPrecedes(captured, written);
		};
		semanticBindingEffectFollowsRead = (binding, read, effect, parents) => {
			const initializer = binding.initializers[0];
			if (binding.initializers.length !== 1 || initializer === undefined) return false;
			const declaration = parents.get(initializer.node);
			if (!t.isVariableDeclarator(declaration) || declaration.init !== initializer.node) return false;
			const initialized = initializerPosition(initializer, parents);
			const selected = bindingReadPosition(read, parents).position;
			return initialized !== null && selected !== null && positionPrecedes(initialized, selected) && semanticReadPrecedesEffectWithinActivation(read, effect, parents);
		};
		semanticEscapeFollowsCapture = (binding, capture, escape, parents) => {
			const initializer = binding.initializers[0];
			if (escape === undefined || initializer === undefined || !semanticBindingPrecedesCapture(binding, capture, parents)) return false;
			const origin = unwrapJavaScriptExpression(initializer.node).node;
			if (!t.isObjectExpression(origin) && !t.isArrayExpression(origin) && !t.isIdentifier(origin) && !t.isMemberExpression(origin) && !t.isOptionalMemberExpression(origin)) return false;
			const capturePosition = semanticCapturePosition(capture, parents);
			const exit = scopeExitOwners.get(escape);
			if (exit !== undefined) {
				const exitPosition = t.isStatement(exit) ? statementPosition(exit, parents) : null;
				return withinScopeExit(capture, exit, parents) || capturePosition !== null && exitPosition !== null && positionPrecedes(capturePosition, exitPosition);
			}
			const escapePosition = directMutationPosition(escape, parents);
			return capturePosition !== null && escapePosition !== null && positionPrecedes(capturePosition, escapePosition);
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticState.js
var recordSemanticValueLimit, semanticStableInitializer, currentSemanticScope, semanticScopeId, semanticBindingId, resolveSemanticBindingState, semanticResolutionBlocked, semanticScopeForNode, semanticBindingLookupFromScope, semanticBindingLookupAt, resolveSemanticBindingFromScope, semanticUnscopablesKey, semanticWithRequireLookup, semanticWithPropertyName, finalSemanticWithSymbolProperty, semanticWithPrototypeKind, finalSemanticWithStringProperty, isSemanticWithPrimitive, semanticVariableScope, isUnshadowedGlobal, isUnmodifiedCommonJsWrapperBinding, semanticBindingHasPriorValueWrite, commonJsWrapperBindingDeclaration;
function init_javascriptSemanticState() {
	return (init_javascriptSemanticState = __esmMin((() => {
		init_javascriptAstValues();
		init_javascriptSemanticMutationInitializers();
		recordSemanticValueLimit = (state, value) => {
			if (value.status === "unknown" && value.resourceLimit !== undefined) state.valueResourceLimits.add(value.resourceLimit);
		};
		semanticStableInitializer = (binding, state) => {
			const [initializer] = binding?.initializers ?? [];
			const [definition] = binding?.definitions ?? [];
			return binding !== undefined && (definition?.kind === "variable" && binding.definitions.every(({ kind }) => kind === "variable") || binding.definitions.length === 1 && (definition?.kind === "function" || definition?.kind === "class")) && binding.initializers.length === 1 && initializer !== undefined && !state.conditionallySkippedExpressions.has(initializer.node) ? initializer : undefined;
		};
		currentSemanticScope = (stack) => {
			const scope = stack.at(-1);
			if (scope === undefined) throw new TypeError("Missing semantic scope");
			return scope;
		};
		semanticScopeId = (kind, node) => `scope:${kind}:${String(node.start ?? -1)}:${String(node.end ?? -1)}`;
		semanticBindingId = (scopeId, name) => `${scopeId}:binding:${encodeURIComponent(name)}`;
		resolveSemanticBindingState = (state, node, name) => {
			const lookup = semanticBindingLookupAt(state, node, name);
			return lookup.kind === "binding" ? lookup.binding : undefined;
		};
		semanticResolutionBlocked = (state, node, name) => {
			const lookup = semanticBindingLookupAt(state, node, name);
			return lookup.kind !== "binding" && lookup.kind !== "ambient";
		};
		semanticScopeForNode = (state, node) => {
			let candidate = node;
			while (candidate !== undefined) {
				const scope = state.scopeByNode.get(candidate);
				if (scope !== undefined) {
					let descendant = node;
					while (descendant !== undefined && descendant !== candidate) {
						state.scopeByNode.set(descendant, scope);
						descendant = state.parentsByNode.get(descendant);
					}
					return scope;
				}
				candidate = state.parentsByNode.get(candidate);
			}
			return undefined;
		};
		semanticBindingLookupFromScope = (scope, name, state) => {
			let uncertain = false;
			while (scope !== undefined) {
				const binding = scope.bindings.get(name);
				if (binding !== undefined) return {
					kind: uncertain ? "uncertain-binding" : "binding",
					binding
				};
				if (name === "arguments" && scope.implicitArguments === true) return { kind: "implicit-arguments" };
				if (!scope.bindingsComplete) {
					if (scope.dynamicWithStatement === undefined) return { kind: "unknown" };
					const lookup = semanticWithRequireLookup(state, scope.dynamicWithStatement, name);
					if (lookup === "captures") return { kind: "captured" };
					if (lookup === "unknown") uncertain = true;
				}
				scope = scope.parentScopeId === null ? undefined : state.scopesById.get(scope.parentScopeId);
			}
			return { kind: uncertain ? "uncertain-ambient" : "ambient" };
		};
		semanticBindingLookupAt = (state, node, name) => semanticBindingLookupFromScope(semanticScopeForNode(state, node), name, state);
		resolveSemanticBindingFromScope = (scope, name, state) => {
			const lookup = semanticBindingLookupFromScope(scope, name, state);
			return lookup.kind === "binding" ? lookup.binding : undefined;
		};
		semanticUnscopablesKey = Symbol("semantic-unscopables-key");
		semanticWithRequireLookup = (state, statement, name) => {
			if (name !== "require") return "unknown";
			const object = unwrapJavaScriptExpression(statement.object).node;
			if (!t.isObjectExpression(object)) return "unknown";
			let ownRequire = false;
			let hasUnknownOwnProperties = false;
			let prototypeIsNull = false;
			let unknownPrototype = false;
			for (const property of object.properties) {
				if (t.isSpreadElement(property)) {
					hasUnknownOwnProperties = true;
					continue;
				}
				const key = semanticWithPropertyName(property.key, property.computed, state);
				if (key === "require") ownRequire = true;
				else if (key === "__proto__" && t.isObjectProperty(property) && !property.computed && !property.shorthand) {
					const prototype = unwrapJavaScriptExpression(property.value).node;
					if (t.isNullLiteral(prototype)) prototypeIsNull = true;
					else unknownPrototype = true;
				} else if (key === null && property.computed) {
					hasUnknownOwnProperties = true;
				}
			}
			if (ownRequire) {
				const unscopablesValue = finalSemanticWithSymbolProperty(object, state);
				if (unscopablesValue === "unknown") return "unknown";
				if (unscopablesValue === undefined) return prototypeIsNull || !unknownPrototype && state.prototypeRequireMutationObserved === false ? "captures" : "unknown";
				const unscopables = unwrapJavaScriptExpression(unscopablesValue).node;
				if (!t.isObjectExpression(unscopables)) return isSemanticWithPrimitive(unscopables) ? "captures" : "unknown";
				const entry = finalSemanticWithStringProperty(unscopables, "require");
				if (entry === "unknown") return "unknown";
				if (entry === undefined) {
					const prototype = semanticWithPrototypeKind(unscopables);
					return prototype === "null" || prototype === "ordinary" && state.prototypeRequireMutationObserved === false ? "captures" : "unknown";
				}
				const truthiness = staticJavaScriptTruthiness(entry);
				return truthiness === true ? "skips" : truthiness === false ? "captures" : "unknown";
			}
			if (hasUnknownOwnProperties || unknownPrototype) return "unknown";
			if (prototypeIsNull) return "skips";
			return state.prototypeRequireMutationObserved === false ? "skips" : "unknown";
		};
		semanticWithPropertyName = (key, computed, state) => {
			if (computed && t.isMemberExpression(key) && !key.computed && t.isIdentifier(key.object, { name: "Symbol" }) && semanticStaticPropertyKey(key.property, false) === "unscopables" && resolveSemanticBindingState(state, key.object, "Symbol") === undefined && !semanticResolutionBlocked(state, key.object, "Symbol")) return semanticUnscopablesKey;
			return semanticStaticPropertyKey(key, computed);
		};
		finalSemanticWithSymbolProperty = (object, state) => {
			for (let index = object.properties.length - 1; index >= 0; index -= 1) {
				const property = object.properties[index];
				if (property === undefined || t.isSpreadElement(property)) return "unknown";
				const name = semanticWithPropertyName(property.key, property.computed, state);
				if (name === semanticUnscopablesKey) return t.isObjectProperty(property) ? property.value : "unknown";
				if (name === null && property.computed) return "unknown";
			}
			return undefined;
		};
		semanticWithPrototypeKind = (object) => {
			for (const property of object.properties) {
				if (t.isObjectProperty(property) && !property.computed && !property.shorthand && t.isIdentifier(property.key, { name: "__proto__" })) return t.isNullLiteral(unwrapJavaScriptExpression(property.value).node) ? "null" : "other";
			}
			return "ordinary";
		};
		finalSemanticWithStringProperty = (object, sought) => {
			for (let index = object.properties.length - 1; index >= 0; index -= 1) {
				const property = object.properties[index];
				if (property === undefined || t.isSpreadElement(property)) return "unknown";
				const name = semanticStaticPropertyKey(property.key, property.computed);
				if (name === sought) return t.isObjectProperty(property) ? property.value : "unknown";
				if (name === null && property.computed) return "unknown";
			}
			return undefined;
		};
		isSemanticWithPrimitive = (node) => t.isNullLiteral(node) || t.isBooleanLiteral(node) || t.isStringLiteral(node) || t.isNumericLiteral(node) || t.isBigIntLiteral(node) || t.isUnaryExpression(node, { operator: "-" }) && (t.isNumericLiteral(node.argument) || t.isBigIntLiteral(node.argument));
		semanticVariableScope = (scope, parent, state) => {
			if (!(parent !== null && t.isVariableDeclaration(parent, { kind: "var" }))) return scope;
			let candidate = scope;
			while (candidate.kind === "block" || candidate.kind === "catch") {
				const outer = candidate.parentScopeId === null ? undefined : state.scopesById.get(candidate.parentScopeId);
				if (outer === undefined) break;
				candidate = outer;
			}
			return candidate;
		};
		isUnshadowedGlobal = (node, state, name) => t.isIdentifier(node, { name }) && (resolveSemanticBindingState(state, node, name) === undefined ? !semanticResolutionBlocked(state, node, name) : isUnmodifiedCommonJsWrapperBinding(node, name, state));
		isUnmodifiedCommonJsWrapperBinding = (node, name, state) => {
			const binding = commonJsWrapperBindingDeclaration(node, name, state);
			return binding !== undefined && !semanticBindingHasPriorValueWrite(node, binding, state);
		};
		semanticBindingHasPriorValueWrite = (site, binding, state) => {
			if (binding.definitions.some(({ kind }) => kind === "function")) return true;
			const writes = state.bindingWrites.get(binding.bindingId) ?? [];
			const read = semanticBindingAtRead(binding, site, state.parentsByNode);
			const retained = read.status === "ordered" ? new Set([...read.binding.initializers, ...read.binding.referenceInitializers]) : undefined;
			const representedWrites = new Set();
			const retainedWrites = new Set();
			for (const source of [...binding.initializers, ...binding.referenceInitializers]) {
				let owner = source.node;
				while (owner !== undefined && !writes.includes(owner)) owner = state.parentsByNode.get(owner);
				if (owner !== undefined) {
					representedWrites.add(owner);
					if (retained === undefined || retained.has(source)) retainedWrites.add(owner);
				} else if ((retained === undefined || retained.has(source)) && semanticEffectTiming(site, source.node, state) !== "after") return true;
			}
			return writes.some((write) => (!representedWrites.has(write) || retainedWrites.has(write)) && semanticEffectTiming(site, write, state) !== "after");
		};
		commonJsWrapperBindingDeclaration = (node, name, state) => {
			if (![
				"module",
				"exports",
				"require",
				"__dirname",
				"__filename"
			].includes(name) || !t.isIdentifier(node, { name })) return undefined;
			const binding = resolveSemanticBindingState(state, node, name);
			if (binding === undefined) return undefined;
			const scope = state.scopesById.get(binding.scopeId);
			if (scope?.kind !== "program" || ![...binding.declarationKinds].every((kind) => kind === "var")) return undefined;
			if (binding.hostOrigin === "commonjs-wrapper") return binding;
			return state.program.sourceType === "script" && binding.declarationKinds.size > 0 ? binding : undefined;
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticPropertyPaths.js
function joinSemanticPropertyPaths(previous, incoming) {
	if (previous.length !== incoming.length) return undefined;
	const joined = previous.map((key, index) => joinPropertySelections(key, incoming[index]));
	return joined.every((key, index) => key === previous[index]) ? previous : joined;
}
var joinPropertySelections, semanticArrayIndex, semanticPropertyPathKeyMatches, coverageNode, SemanticPropertyPathCoverage, keyCovers;
function init_javascriptSemanticPropertyPaths() {
	return (init_javascriptSemanticPropertyPaths = __esmMin((() => {
		joinPropertySelections = (previous, incoming) => {
			if (keyCovers(previous, incoming)) return previous;
			if (keyCovers(incoming, previous)) return incoming;
			if (previous === null || incoming === null) return null;
			if (typeof previous !== "object" && typeof incoming !== "object") return null;
			if (typeof previous === "object" && typeof incoming === "object") return {
				excludedKeys: previous.excludedKeys.filter((key) => incoming.excludedKeys.includes(key)),
				...previous.startIndex === undefined || incoming.startIndex === undefined ? {} : { startIndex: Math.min(previous.startIndex, incoming.startIndex) }
			};
			const selected = typeof previous === "object" ? previous : incoming;
			const scalar = typeof previous === "object" ? incoming : previous;
			if (typeof selected !== "object" || typeof scalar === "object") return null;
			const index = semanticArrayIndex(scalar);
			return {
				excludedKeys: selected.excludedKeys.filter((key) => key !== String(scalar)),
				...selected.startIndex === undefined || index === null ? {} : { startIndex: Math.min(selected.startIndex, index) }
			};
		};
		semanticArrayIndex = (key) => {
			const index = Number(key);
			return Number.isInteger(index) && index >= 0 && index < 4294967295 && String(index) === String(key) ? index : null;
		};
		semanticPropertyPathKeyMatches = (key, name) => {
			if (key === null) return true;
			if (typeof key !== "object") return String(key) === name;
			if (key.excludedKeys.includes(name)) return false;
			if (key.startIndex === undefined) return true;
			const index = semanticArrayIndex(name);
			return index !== null && index >= key.startIndex;
		};
		coverageNode = () => ({
			terminal: false,
			exact: new Map(),
			selectors: new Map()
		});
		SemanticPropertyPathCoverage = class {
			#root = coverageNode();
			/** Match optional per-slot receiver identities along the covering prefix. */
			retain(path, contexts) {
				if (this.covers(path, contexts)) return false;
				let node = this.#root;
				for (const [offset, key] of path.entries()) {
					const context = contexts?.[offset];
					if (key !== null && typeof key !== "object") {
						const name = JSON.stringify([String(key), context]);
						let child = node.exact.get(name);
						if (child === undefined) {
							child = coverageNode();
							node.exact.set(name, child);
						}
						node = child;
					} else {
						const identity = JSON.stringify([key, context]);
						let selected = node.selectors.get(identity);
						if (selected === undefined) {
							selected = {
								key,
								context,
								node: coverageNode()
							};
							node.selectors.set(identity, selected);
						}
						node = selected.node;
					}
				}
				node.terminal = true;
				node.exact.clear();
				node.selectors.clear();
				return true;
			}
			/** Query retained prefixes without changing the coverage index. */
			covers(path, contexts) {
				const pending = [{
					node: this.#root,
					offset: 0
				}];
				while (pending.length > 0) {
					const current = pending.pop();
					if (current === undefined) break;
					if (current.node.terminal) return true;
					const key = path[current.offset];
					if (key === undefined) continue;
					const context = contexts?.[current.offset];
					if (key !== null && typeof key !== "object") {
						const exact = current.node.exact.get(JSON.stringify([String(key), context]));
						if (exact !== undefined) pending.push({
							node: exact,
							offset: current.offset + 1
						});
					}
					for (const selected of current.node.selectors.values()) {
						if (selected.context === context && keyCovers(selected.key, key)) pending.push({
							node: selected.node,
							offset: current.offset + 1
						});
					}
				}
				return false;
			}
		};
		keyCovers = (covering, key) => {
			if (covering === null) return true;
			if (key === null) return false;
			if (typeof key !== "object") return typeof covering === "object" ? semanticPropertyPathKeyMatches(covering, String(key)) : String(covering) === String(key);
			return typeof covering === "object" && covering.excludedKeys.every((name) => key.excludedKeys.includes(name)) && (covering.startIndex === undefined || key.startIndex !== undefined && covering.startIndex <= key.startIndex);
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticPropertyKeys.js
var wellKnownSymbols, semanticKnownSymbolKey;
function init_javascriptSemanticPropertyKeys() {
	return (init_javascriptSemanticPropertyKeys = __esmMin((() => {
		init_javascriptAstValues();
		init_javascriptSemanticAmbientWrites();
		wellKnownSymbols = new Set([
			"asyncIterator",
			"hasInstance",
			"isConcatSpreadable",
			"iterator",
			"match",
			"matchAll",
			"replace",
			"search",
			"species",
			"split",
			"toPrimitive",
			"toStringTag",
			"unscopables",
			"dispose",
			"asyncDispose"
		]);
		semanticKnownSymbolKey = (node, state) => {
			const key = unwrapJavaScriptExpression(node).node;
			if (!t.isMemberExpression(key)) return false;
			const name = semanticStaticPropertyKey(key.property, key.computed);
			return name !== null && wellKnownSymbols.has(name) && isUnmodifiedGlobalReference(key, state, ["Symbol", name]);
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticGetterQueries.js
var SemanticObjectReferenceSet, SemanticGetterQuery;
function init_javascriptSemanticGetterQueries() {
	return (init_javascriptSemanticGetterQueries = __esmMin((() => {
		init_javascriptSemanticResourceLimits();
		SemanticObjectReferenceSet = class {
			#nodes = new Map();
			#owners = new WeakMap();
			#ownerCount = 0;
			add(reference) {
				const owner = reference.ownerInitializer;
				if (owner !== undefined && !this.#owners.has(owner)) this.#owners.set(owner, ++this.#ownerCount);
				const key = JSON.stringify([
					reference.path,
					owner === undefined ? null : this.#owners.get(owner),
					reference.escapes === true,
					reference.widenedGetterResult === true
				]);
				const paths = this.#nodes.get(reference.node) ?? new Map();
				paths.set(key, reference);
				this.#nodes.set(reference.node, paths);
			}
			values() {
				return [...this.#nodes.values()].flatMap((paths) => [...paths.values()]);
			}
		};
		SemanticGetterQuery = class {
			state;
			#memo = new WeakMap();
			#references = new SemanticObjectReferenceSet();
			#pending = [];
			#current;
			#limited = false;
			#visits = 0;
			#fallback = false;
			constructor(state) {
				this.state = state;
			}
			get widening() {
				return this.#fallback;
			}
			/** Charge retained local work and getter jobs to the same precise query. */
			reserveResult() {
				if (this.#limited) return false;
				if (!this.#fallback && this.#visits >= 512) {
					this.#limited = true;
					return false;
				}
				this.#visits++;
				return true;
			}
			retain(reference, escapes = false) {
				this.#references.add({
					...reference,
					...escapes ? { escapes: true } : {},
					...this.#fallback && this.#current !== undefined ? { widenedGetterResult: true } : {}
				});
			}
			#known(invocation, path, escapes) {
				const receiver = invocation.receiver ?? invocation.owner;
				const receivers = this.#memo.get(invocation.getter);
				const paths = receivers?.get(receiver);
				const key = JSON.stringify([path, escapes]);
				if (paths?.has(key)) return true;
				if (!this.reserveResult()) return true;
				const selections = paths ?? new Set();
				const owners = receivers ?? new WeakMap();
				selections.add(key);
				owners.set(receiver, selections);
				this.#memo.set(invocation.getter, owners);
				return false;
			}
			#ancestor(invocation) {
				const receiver = invocation.receiver ?? invocation.owner;
				for (let visit = this.#current?.ancestry; visit !== undefined; visit = visit.parent) if (visit.getter === invocation.getter && visit.receiver === receiver) return visit;
				return undefined;
			}
			#grows(invocation, path) {
				if (this.#fallback) return false;
				const previous = this.#ancestor(invocation);
				if (previous === undefined || previous.length >= path.length) return false;
				this.#limited = true;
				return true;
			}
			schedule(invocation, path, escaped = false) {
				if (this.#limited) return;
				const escapes = escaped || this.#fallback || this.#current?.escapes === true;
				const selection = this.#fallback ? [] : path;
				if (this.#grows(invocation, selection)) return;
				if (this.#known(invocation, selection, escapes)) return;
				this.#pending.push({
					invocation,
					path: selection,
					escapes,
					ancestry: {
						getter: invocation.getter,
						receiver: invocation.receiver ?? invocation.owner,
						length: selection.length,
						...this.#current === undefined ? {} : { parent: this.#current.ancestry }
					}
				});
			}
			#collect(root, expand) {
				for (const reference of root()) this.retain(reference);
				for (let cursor = 0; cursor < this.#pending.length && !this.#limited; cursor++) {
					const job = this.#pending[cursor];
					if (job === undefined) break;
					this.#current = job;
					expand(job);
				}
				this.#current = undefined;
			}
			run(root, expand) {
				this.#collect(root, expand);
				if (this.#limited) {
					this.state.getterResourceLimits.add("getter-expansion");
					this.#fallback = true;
					this.#limited = false;
					this.#memo = new WeakMap();
					this.#references = new SemanticObjectReferenceSet();
					this.#pending = [];
					this.#collect(root, expand);
				}
				return this.#references.values();
			}
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticCallableResults.js
var semanticCallableResultExpressions, semanticCallableResultKind;
function init_javascriptSemanticCallableResults() {
	return (init_javascriptSemanticCallableResults = __esmMin((() => {
		init_javascriptSemanticTraversal();
		semanticCallableResultExpressions = (callable) => {
			if (t.isArrowFunctionExpression(callable) && !t.isBlockStatement(callable.body)) return [{
				node: callable.body,
				site: callable.body,
				kind: "return",
				delegated: false
			}];
			if (!t.isFunction(callable)) return [];
			const output = [];
			const pending = childNodes(callable.body).reverse();
			while (pending.length > 0) {
				const node = pending.pop();
				if (node === undefined || t.isFunction(node) || t.isClass(node)) continue;
				if (t.isReturnStatement(node)) {
					output.push({
						node: node.argument ?? null,
						site: node,
						kind: "return",
						delegated: false
					});
				}
				if (t.isYieldExpression(node)) output.push({
					node: node.argument ?? null,
					site: node,
					kind: "yield",
					delegated: node.delegate
				});
				for (const child of childNodes(node).reverse()) pending.push(child);
			}
			return output;
		};
		semanticCallableResultKind = (callable) => {
			if (!t.isFunction(callable)) return "value";
			if (callable.generator) return callable.async ? "async-iterator" : "iterator";
			return callable.async ? "promise" : "value";
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticOpaqueEffects.js
/** Rebinding requires lexical visibility. Object references can remain reachable
* through aliases even where the original name is shadowed or out of block scope.
* Without a disjointness proof, consider their enclosing activation and closures.
* Queries retain no binding-by-eval table. */
function* semanticOpaqueBindingEffects(binding, state, kind = "binding") {
	if (state.opaqueEffects.byScope.size === 0) return;
	const pending = [kind === "reference" ? activation(binding.scopeId, state) : binding.scopeId];
	while (pending.length > 0) {
		const scope = pending.pop();
		for (const node of state.opaqueEffects.byScope.get(scope) ?? []) if (kind === "reference" || resolveSemanticBindingState(state, node, binding.name)?.bindingId === binding.bindingId) yield node;
		for (const child of state.opaqueEffects.children.get(scope) ?? []) pending.push(child);
	}
}
var indexSemanticOpaqueEffects, createSemanticOpaqueGlobalObserver, semanticOpaqueGlobalMayHaveChanged, semanticBindingMayHaveOpaqueEffect, semanticOpaqueNameMayHaveChanged, semanticBindingCanBeRebound, semanticOpaqueBindingReadMayHaveChanged, activation, strictEval;
function init_javascriptSemanticOpaqueEffects() {
	return (init_javascriptSemanticOpaqueEffects = __esmMin((() => {
		init_javascriptSourceParser();
		init_javascriptAstValues();
		init_javascriptSemanticAmbientWrites();
		init_javascriptModuleInterop();
		init_javascriptSemanticMutationInitializers();
		init_javascriptSemanticState();
		indexSemanticOpaqueEffects = (candidates, state) => {
			for (const { node, scopeId } of candidates) {
				const callee = unwrapJavaScriptExpression(node.callee).node;
				if (!isUnshadowedGlobal(callee, state, "eval")) continue;
				state.opaqueEffects.sites.add(node);
				if (!strictEval(node, state)) state.opaqueEffects.sloppySites.add(node);
				const sites = state.opaqueEffects.byScope.get(scopeId) ?? [];
				sites.push(node);
				state.opaqueEffects.byScope.set(scopeId, sites);
				let scope = state.scopesById.get(scopeId);
				while (scope?.parentScopeId != null) {
					const children = state.opaqueEffects.children.get(scope.parentScopeId) ?? new Set();
					if (children.has(scope.scopeId)) break;
					children.add(scope.scopeId);
					state.opaqueEffects.children.set(scope.parentScopeId, children);
					scope = state.scopesById.get(scope.parentScopeId);
				}
			}
		};
		createSemanticOpaqueGlobalObserver = (state) => {
			if (!state.opaqueEffects.mayReferenceGlobalEval) return undefined;
			const ambientPaths = createAmbientPathResolver(state, true);
			let invocationSite;
			const interop = createSemanticModuleInterop(state, { intrinsicPath: (node) => {
				const paths = ambientPaths(node, invocationSite).paths;
				const path = paths.find((path) => path[1] === "eval") ?? paths[0];
				if (path?.[0] !== "global" || path.some((key) => key === null)) return undefined;
				return path[1] === "eval" ? ["intrinsic", ...path] : ["intrinsic", ...path.slice(1)];
			} });
			return (node) => {
				if (!t.isCallExpression(node) && !t.isOptionalCallExpression(node)) return;
				invocationSite = node;
				const invocation = interop.intrinsicInvocation(node);
				if (invocation?.path.join(".") === "intrinsic.global.eval") state.opaqueEffects.globalSites.push(node);
			};
		};
		semanticOpaqueGlobalMayHaveChanged = (read, state) => state.opaqueEffects.globalSites.some((effect) => semanticEffectTiming(read, effect, state) !== "after");
		semanticBindingMayHaveOpaqueEffect = (binding, state, read, kind = "binding") => {
			if (state.opaqueEffects.byScope.size === 0) return false;
			for (const effect of semanticOpaqueBindingEffects(binding, state, kind)) if (read === undefined || semanticEffectTiming(read, effect, state) !== "after" && !semanticBindingEffectFollowsCapture(binding, read, effect, state.parentsByNode) && !(kind === "binding" && semanticBindingEffectFollowsRead(binding, read, effect, state.parentsByNode))) return true;
			return false;
		};
		semanticOpaqueNameMayHaveChanged = (read, state, binding) => {
			if (state.opaqueEffects.byScope.size === 0) return false;
			const visible = new Set();
			let node = read;
			while (node !== undefined) {
				const scope = state.scopeByNode.get(node);
				if (scope !== undefined) {
					let current = scope;
					while (current !== undefined) {
						visible.add(current.scopeId);
						current = current.parentScopeId === null ? undefined : state.scopesById.get(current.parentScopeId);
					}
					break;
				}
				node = state.parentsByNode.get(node);
			}
			for (const [scopeId, sites] of state.opaqueEffects.byScope) {
				let scope = state.scopesById.get(scopeId);
				while (scope !== undefined && scope.kind !== "function" && scope.kind !== "program") scope = scope.parentScopeId === null ? undefined : state.scopesById.get(scope.parentScopeId);
				if (scope !== undefined && visible.has(scope.scopeId) && (binding === undefined || activation(binding.scopeId, state) !== scope.scopeId) && sites.some((effect) => state.opaqueEffects.sloppySites.has(effect) && (binding === undefined || resolveSemanticBindingState(state, effect, binding.name)?.bindingId === binding.bindingId) && semanticEffectTiming(read, effect, state) !== "after" && !semanticReadPrecedesEffectWithinActivation(read, effect, state.parentsByNode))) return true;
			}
			return false;
		};
		semanticBindingCanBeRebound = (binding) => binding.mutable || binding.definitions.some(({ kind }) => kind === "function" || kind === "class") && binding.initializers.some(({ node }) => t.isFunctionDeclaration(node) || t.isClassDeclaration(node));
		semanticOpaqueBindingReadMayHaveChanged = (binding, read, state) => semanticBindingCanBeRebound(binding) && semanticBindingMayHaveOpaqueEffect(binding, state, read) || semanticOpaqueNameMayHaveChanged(read, state, binding);
		activation = (scopeId, state) => {
			let scope = state.scopesById.get(scopeId);
			while (scope !== undefined && scope.kind !== "function" && scope.kind !== "program" && scope.parentScopeId !== null) scope = state.scopesById.get(scope.parentScopeId);
			return scope?.scopeId ?? scopeId;
		};
		strictEval = (site, state) => {
			for (let node = site; node !== undefined; node = state.parentsByNode.get(node)) {
				if (t.isClass(node) || t.isProgram(node) && javaScriptProgramStrictness(node) === "strict") return true;
				const directives = t.isFunction(node) && t.isBlockStatement(node.body) ? node.body.directives : [];
				if (directives.some(({ value }) => value.value === "use strict")) return true;
			}
			return false;
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSymbolicValues.js
var symbolicUnknown, symbolicVariants, symbolicUnion, symbolicTruth, symbolicCondition, symbolicConditionsUnresolved;
function init_javascriptSymbolicValues() {
	return (init_javascriptSymbolicValues = __esmMin((() => {
		symbolicUnknown = (reason) => ({
			kind: "unknown",
			reason
		});
		symbolicVariants = (value) => value.kind === "union" ? value.values : [value];
		symbolicUnion = (values) => {
			const unique = [...new Set(values.flatMap(symbolicVariants))];
			return unique.length === 1 ? unique[0] : {
				kind: "union",
				values: unique
			};
		};
		symbolicTruth = (value) => {
			if (value.kind === "namespace" && value.runtimeValueUnknown) return undefined;
			if (value.kind === "union") {
				const choices = value.values.map(symbolicTruth);
				return choices.length > 0 && choices.every((choice) => choice === choices[0]) ? choices[0] : undefined;
			}
			return value.kind === "literal" ? Boolean(value.value) : [
				"function",
				"object",
				"namespace",
				"array",
				"record",
				"loader",
				"promise",
				"iterator"
			].includes(value.kind) ? true : undefined;
		};
		symbolicCondition = (value, condition) => {
			if (value.kind === "union") return symbolicUnion(value.values.map((variant) => symbolicCondition(variant, condition)));
			return {
				...value,
				conditions: [...value.conditions ?? [], condition]
			};
		};
		symbolicConditionsUnresolved = (value) => {
			if (value.kind === "union") return symbolicUnion(value.values.map(symbolicConditionsUnresolved));
			return {
				...value,
				conditionUnresolved: true
			};
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSymbolicControlFlow.js
var logicalRightOperand, symbolicLogicalRight, symbolicDefiniteExit;
function init_javascriptSymbolicControlFlow() {
	return (init_javascriptSymbolicControlFlow = __esmMin((() => {
		init_javascriptSymbolicValues();
		logicalRightOperand = (operator, truth, nullish) => operator === "??" ? nullish : truth === undefined ? undefined : operator === "&&" ? truth : !truth;
		symbolicLogicalRight = (operator, left) => {
			if (left.kind === "namespace" && left.runtimeValueUnknown) return undefined;
			if (left.kind === "union") {
				const choices = left.values.map((value) => symbolicLogicalRight(operator, value));
				return choices.length > 0 && choices.every((choice) => choice === choices[0]) ? choices[0] : undefined;
			}
			if (operator === "??") {
				if (left.kind === "literal") return left.value === null || left.value === undefined;
				return [
					"function",
					"object",
					"namespace",
					"array",
					"record",
					"loader",
					"promise",
					"iterator"
				].includes(left.kind) ? false : undefined;
			}
			const truth = symbolicTruth(left);
			return logicalRightOperand(operator, truth, undefined);
		};
		symbolicDefiniteExit = (node, depth = 0) => {
			if (!node || depth >= 128) return false;
			if (t.isReturnStatement(node) || t.isThrowStatement(node)) return true;
			if (t.isBlockStatement(node)) return node.body.some((child) => symbolicDefiniteExit(child, depth + 1));
			return t.isIfStatement(node) && symbolicDefiniteExit(node.consequent, depth + 1) && symbolicDefiniteExit(node.alternate, depth + 1);
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticDependencies.js
var SemanticDependencyProofs;
function init_javascriptSemanticDependencies() {
	return (init_javascriptSemanticDependencies = __esmMin((() => {
		SemanticDependencyProofs = class SemanticDependencyProofs {
			layout;
			unions = new WeakMap();
			constructor(layout) {
				this.layout = layout;
			}
			static forBindings(bindings) {
				const indices = new Map();
				for (const binding of bindings) indices.set(binding, indices.size);
				return new SemanticDependencyProofs({
					indices,
					singletons: new Map(),
					height: Math.ceil(Math.log2(Math.max(1, indices.size)))
				});
			}
			/** Share identity proofs while retaining unions for only one query. */
			forQuery() {
				return new SemanticDependencyProofs(this.layout);
			}
			binding(binding) {
				const prior = this.layout.singletons.get(binding);
				if (prior !== undefined) return prior;
				const index = this.index(binding);
				let proof = true;
				for (let bit = 0; bit < this.layout.height; bit++) {
					const one = Math.floor(index / 2 ** bit) % 2 === 1;
					proof = Object.freeze({
						zero: one ? undefined : proof,
						one: one ? proof : undefined
					});
				}
				this.layout.singletons.set(binding, proof);
				return proof;
			}
			union(first, second) {
				if (first === second || second === undefined) return first;
				if (first === undefined) return second;
				if (first === true || second === true) return true;
				const cached = this.unions.get(first)?.get(second) ?? this.unions.get(second)?.get(first);
				if (cached !== undefined) return cached;
				const zero = this.union(first.zero, second.zero);
				const one = this.union(first.one, second.one);
				const result = zero === first.zero && one === first.one ? first : zero === second.zero && one === second.one ? second : Object.freeze({
					zero,
					one
				});
				let unions = this.unions.get(first);
				if (unions === undefined) {
					unions = new WeakMap();
					this.unions.set(first, unions);
				}
				unions.set(second, result);
				return result;
			}
			intersects(proof, active) {
				for (const binding of active.keys()) if (this.has(proof, binding)) return true;
				return false;
			}
			has(proof, binding) {
				const index = this.index(binding);
				for (let bit = this.layout.height - 1; bit >= 0; bit--) {
					if (proof === undefined) return false;
					if (proof === true) return true;
					proof = Math.floor(index / 2 ** bit) % 2 === 1 ? proof.one : proof.zero;
				}
				return proof === true;
			}
			index(binding) {
				const index = this.layout.indices.get(binding);
				if (index === undefined) throw new TypeError(`Unindexed semantic dependency: ${binding}`);
				return index;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticSlots.js
function semanticContainer(value) {
	if (value.status === "object") return {
		slots: value.properties,
		coverage: value.unknownProperties ? {
			status: "partial",
			omitted: value.omittedProperties
		} : {
			status: "complete",
			omitted: 0
		}
	};
	if (value.status === "array") return {
		slots: value.items,
		coverage: value.unknownItems ? {
			status: "partial",
			omitted: value.omittedItems
		} : {
			status: "complete",
			omitted: 0
		}
	};
	return null;
}
var semanticSlotAtPath, semanticPropertyPointer;
function init_javascriptSemanticSlots() {
	return (init_javascriptSemanticSlots = __esmMin((() => {
		semanticSlotAtPath = (value, path) => {
			const leafName = path.at(-1) ?? "";
			let current = {
				name: "",
				presence: "present",
				value
			};
			for (const [index, name] of path.entries()) {
				const container = semanticContainer(current.value);
				if (current.presence !== "present" || container === null) return {
					name: leafName,
					presence: "unknown-coverage",
					value: "reason" in current.value ? {
						...current.value,
						reason: `${current.value.reason} Cannot continue ${semanticPropertyPointer(path)} through receiver ${semanticPropertyPointer(path.slice(0, index))}.`
					} : {
						status: "unknown",
						reason: `Cannot resolve ${semanticPropertyPointer(path)} through ${current.value.status} receiver ${semanticPropertyPointer(path.slice(0, index))}.`
					}
				};
				if (current.value.status === "array" && name === "length") {
					current = {
						name,
						presence: "present",
						value: {
							status: "unknown",
							reason: "Array length is present but its value is not retained."
						}
					};
					continue;
				}
				const observed = container.slots.find((slot) => slot.name === name);
				current = observed ?? {
					name,
					presence: container.coverage.status === "complete" ? "absent" : "unknown-coverage",
					value: {
						status: "unknown",
						reason: `Own property ${name} was not observed.`
					}
				};
			}
			return current;
		};
		semanticPropertyPointer = (path) => path.map((key) => `/${key.replaceAll("~", "~0").replaceAll("/", "~1")}`).join("");
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticMutationValues.js
var invalidateSemanticEscapedPath, invalidateSemanticMutationPaths;
function init_javascriptSemanticMutationValues() {
	return (init_javascriptSemanticMutationValues = __esmMin((() => {
		init_javascriptSemanticPropertyPaths();
		invalidateSemanticEscapedPath = (value, path) => {
			if (value.status !== "object" && value.status !== "array") return value;
			const [key, ...remaining] = path;
			if (key === undefined) return {
				status: "unknown",
				reason: "This object reference may have been mutated by a call."
			};
			const invalidateChild = (property) => semanticPropertyPathKeyMatches(key, property.name) ? {
				...property,
				value: invalidateSemanticEscapedPath(property.value, remaining)
			} : property;
			return value.status === "object" ? {
				...value,
				properties: value.properties.map(invalidateChild)
			} : {
				...value,
				items: value.items.map(invalidateChild)
			};
		};
		invalidateSemanticMutationPaths = (value, paths) => {
			if (paths.length === 0) return value;
			if (value.status !== "object" && value.status !== "array" || paths.some(([key]) => key === undefined || key === null)) return {
				status: "unknown",
				reason: "This property may have been mutated."
			};
			const reset = value.status === "array" ? paths.findLastIndex(([key]) => key === "length") : -1;
			const base = reset < 0 ? value : {
				status: "array",
				items: [],
				unknownItems: true,
				omittedItems: null
			};
			const slots = base.status === "object" ? base.properties : base.items;
			const slotsByName = new Map();
			slots.forEach((property, index) => {
				const indexes = slotsByName.get(property.name) ?? [];
				indexes.push(index);
				slotsByName.set(property.name, indexes);
			});
			const slotPaths = new Map();
			const replacedSlots = new Set();
			const select = (index, remaining) => {
				const selected = slotPaths.get(index) ?? [];
				selected.push(remaining);
				slotPaths.set(index, selected);
				if (remaining.length === 0) replacedSlots.add(index);
			};
			const added = new Set();
			for (const [key, ...remaining] of paths.slice(reset + 1)) {
				if (key === undefined || key === null) continue;
				if (typeof key === "object") {
					slots.forEach((property, index) => {
						if (semanticPropertyPathKeyMatches(key, property.name)) select(index, remaining);
					});
					continue;
				}
				const indexes = slotsByName.get(String(key));
				if (indexes === undefined) added.add(String(key));
				else for (const index of indexes) select(index, remaining);
			}
			const properties = slots.map((property, index) => {
				const selected = slotPaths.get(index);
				return selected === undefined ? property : {
					...property,
					...replacedSlots.has(index) ? { presence: "unknown-coverage" } : {},
					value: invalidateSemanticMutationPaths(property.value, selected)
				};
			});
			for (const name of added) properties.push({
				name,
				value: {
					status: "unknown",
					reason: "This property may have been mutated."
				},
				presence: "unknown-coverage"
			});
			return base.status === "object" ? {
				...base,
				properties
			} : {
				...base,
				items: properties
			};
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticProvenance.js
var semanticLocalProvenance, semanticUnresolvedProvenance, semanticAmbiguousProvenance, semanticOriginsProvenance, uniqueSemanticOrigins, semanticOriginKey, semanticPrimitiveKey, semanticBuiltinNamespacePath;
function init_javascriptSemanticProvenance() {
	return (init_javascriptSemanticProvenance = __esmMin((() => {
		init_unicodeCodePointOrder();
		semanticLocalProvenance = () => ({
			status: "local",
			origins: [],
			reason: null
		});
		semanticUnresolvedProvenance = (status, reason) => ({
			status,
			origins: [],
			reason
		});
		semanticAmbiguousProvenance = (origins, reason) => ({
			status: "ambiguous",
			origins,
			reason
		});
		semanticOriginsProvenance = (origins) => {
			const unique = uniqueSemanticOrigins(origins);
			const origin = unique[0];
			return unique.length === 1 && origin !== undefined ? {
				status: "module",
				origins: [origin],
				reason: null
			} : semanticAmbiguousProvenance(unique, "Multiple module origins.");
		};
		uniqueSemanticOrigins = (origins) => [...new Map(origins.map((origin) => [semanticOriginKey(origin), origin])).values()].sort((left, right) => compareUnicodeCodePoints(semanticOriginKey(left), semanticOriginKey(right)));
		semanticOriginKey = (origin) => JSON.stringify([
			origin.specifier,
			origin.importedPath,
			origin.resolutionMode ?? "import"
		]);
		semanticPrimitiveKey = (value) => `${value === null ? "null" : typeof value}:${JSON.stringify(value)}`;
		semanticBuiltinNamespacePath = (importedPath) => importedPath.length === 0 || importedPath.length === 1 && importedPath[0] === "default";
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticPrimitives.js
var semanticPrimitiveSet, semanticPrimitiveCandidates;
function init_javascriptSemanticPrimitives() {
	return (init_javascriptSemanticPrimitives = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_javascriptSemanticProvenance();
		init_javascriptSemanticResourceLimits();
		semanticPrimitiveSet = (values) => {
			let uniqueValues;
			for (const value of values) {
				if (typeof value === "number" && !Number.isFinite(value)) return {
					status: "unknown",
					reason: "Nonfinite numbers are outside the JSON primitive lattice."
				};
				if (typeof value === "number" && Object.is(value, -0)) return {
					status: "unknown",
					reason: "Negative zero cannot be preserved by JSON primitive evidence."
				};
				if (values.length === 1) return typeof value === "string" && exceedsSemanticPrimitiveStringByteBudget([value]) ? semanticResourceLimitUnknown("primitive-bytes") : {
					status: "literal",
					value
				};
				uniqueValues ??= new Set();
				uniqueValues.add(value);
				if (uniqueValues.size > 256) return semanticResourceLimitUnknown("primitive-candidates");
			}
			if (uniqueValues === undefined) return {
				status: "union",
				values: []
			};
			if (exceedsSemanticPrimitiveStringByteBudget([...uniqueValues].flatMap((value) => typeof value === "string" ? [value] : []))) return semanticResourceLimitUnknown("primitive-bytes");
			const unique = [...uniqueValues].map((value) => ({
				key: semanticPrimitiveKey(value),
				value
			})).sort((left, right) => compareUnicodeCodePoints(left.key, right.key)).map(({ value }) => value);
			const only = unique[0];
			return unique.length === 1 && only !== undefined ? {
				status: "literal",
				value: only
			} : {
				status: "union",
				values: unique
			};
		};
		semanticPrimitiveCandidates = (value) => value.status === "literal" ? [value.value] : value.status === "union" ? value.values : null;
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticValues.js
var definitelyDefinedValues, definedNonPrimitiveValue, semanticValueDefinitelyDefined, dependencyProofsByState, createEvaluationMemo, CALLER_INDEPENDENT, EVERY_CALLER, callerIndependentBindingValuesByState, primitiveBindingValuesByState, primitiveExpressionValuesByState, capturedBindingValuesByState, clearSemanticValueCaches, callerIndependentBindingValuesFor, primitiveBindingValuesFor, isSemanticResourceLimit, evaluateSemanticBinding, evaluateSemanticExpression, evaluateSemanticExpressionProvenance, evaluateSemanticProvenance, evaluateSemanticProvenanceAtRead, readMemoizedEvaluation, retainDependencyProof, recordBindingDependency, collectEvaluationDependencies, readSnapshotValuesFor, evaluateBinding, evaluateExpression, evaluateExpressionValue, evaluateTemplate, semanticSelectedBranches, semanticCondition, evaluateObject, evaluateArray, evaluateMember, evaluateAddition, addPrimitiveValues, evaluateUnary, projectValue, provenanceForBinding, provenanceForBindingUncached, provenanceForBindingValue, provenanceForBindingInitializers, provenanceForExpression, provenanceForBindingAtRead, isLocallyCreatedValue, mergeValues, nestedContext, isPrimitive, canCapturePrimitive, primitiveCaptureContext, captureContextAt, evaluateCapturedExpression;
function init_javascriptSemanticValues() {
	return (init_javascriptSemanticValues = __esmMin((() => {
		init_javascriptSemanticOpaqueEffects();
		init_javascriptSemanticPropertyKeys();
		init_javascriptSymbolicControlFlow();
		init_javascriptSemanticDependencies();
		init_javascriptSemanticMutationInitializers();
		init_javascriptSemanticSlots();
		init_javascriptSemanticMutationValues();
		init_javascriptSemanticState();
		init_javascriptSemanticRequireOrigin();
		init_unicodeCodePointOrder();
		init_javascriptAstValues();
		init_javascriptSemanticProvenance();
		init_javascriptSemanticPrimitives();
		init_javascriptSemanticResourceLimits();
		definitelyDefinedValues = new WeakSet();
		definedNonPrimitiveValue = (reason) => {
			const value = {
				status: "unknown",
				reason
			};
			definitelyDefinedValues.add(value);
			return value;
		};
		semanticValueDefinitelyDefined = (value) => value.status === "literal" || value.status === "union" || value.status === "object" || value.status === "array" || definitelyDefinedValues.has(value);
		dependencyProofsByState = new WeakMap();
		createEvaluationMemo = (state) => {
			let dependencies = dependencyProofsByState.get(state);
			if (dependencies === undefined) {
				dependencies = SemanticDependencyProofs.forBindings(state.bindingsById.keys());
				dependencyProofsByState.set(state, dependencies);
			}
			return {
				provenance: new Map(),
				dependencyFrames: [],
				dependencies: dependencies.forQuery()
			};
		};
		CALLER_INDEPENDENT = Number.POSITIVE_INFINITY;
		EVERY_CALLER = -1;
		callerIndependentBindingValuesByState = new WeakMap();
		primitiveBindingValuesByState = new WeakMap();
		primitiveExpressionValuesByState = new WeakMap();
		capturedBindingValuesByState = new WeakMap();
		clearSemanticValueCaches = (state) => {
			primitiveBindingValuesByState.delete(state);
			capturedBindingValuesByState.delete(state);
			primitiveExpressionValuesByState.delete(state);
			callerIndependentBindingValuesByState.delete(state);
		};
		callerIndependentBindingValuesFor = (state) => {
			const existing = callerIndependentBindingValuesByState.get(state);
			if (existing !== undefined) return existing;
			const values = new Map();
			callerIndependentBindingValuesByState.set(state, values);
			return values;
		};
		primitiveBindingValuesFor = (state) => {
			const existing = primitiveBindingValuesByState.get(state);
			if (existing !== undefined) return existing;
			const values = new Map();
			primitiveBindingValuesByState.set(state, values);
			return values;
		};
		isSemanticResourceLimit = (value) => value.status === "unknown" && value.resourceLimit !== undefined;
		evaluateSemanticBinding = (binding, state) => semanticBindingCanBeRebound(binding) && semanticBindingMayHaveOpaqueEffect(binding, state) ? {
			status: "unknown",
			reason: "Direct eval may have changed this lexical binding."
		} : evaluateBinding(binding, {
			state,
			bindings: new Map(),
			expressionDepth: 0,
			primitiveBindingValues: primitiveBindingValuesFor(state),
			dependence: { lowest: CALLER_INDEPENDENT },
			memo: createEvaluationMemo(state)
		});
		evaluateSemanticExpression = (node, state, capturePoint) => {
			const context = {
				state,
				bindings: new Map(),
				expressionDepth: 0,
				primitiveBindingValues: primitiveBindingValuesFor(state),
				dependence: { lowest: CALLER_INDEPENDENT },
				memo: createEvaluationMemo(state)
			};
			return capturePoint === undefined ? evaluateCapturedExpression(node, context) : evaluateExpression(node, captureContextAt(capturePoint, context) ?? context);
		};
		evaluateSemanticExpressionProvenance = (node, state) => provenanceForExpression(node, {
			state,
			bindings: new Map(),
			expressionDepth: 0,
			primitiveBindingValues: primitiveBindingValuesFor(state),
			dependence: { lowest: CALLER_INDEPENDENT },
			memo: createEvaluationMemo(state)
		});
		evaluateSemanticProvenance = (binding, state) => {
			const provenance = provenanceForBinding(binding, {
				state,
				bindings: new Map(),
				expressionDepth: 0,
				primitiveBindingValues: primitiveBindingValuesFor(state),
				dependence: { lowest: CALLER_INDEPENDENT },
				memo: createEvaluationMemo(state)
			});
			return semanticBindingCanBeRebound(binding) && semanticBindingMayHaveOpaqueEffect(binding, state) ? semanticAmbiguousProvenance(provenance.origins, "Direct eval may have changed this runtime value.") : provenance;
		};
		evaluateSemanticProvenanceAtRead = (binding, read, state) => provenanceForBindingAtRead(binding, read, {
			state,
			bindings: new Map(),
			expressionDepth: 0,
			primitiveBindingValues: primitiveBindingValuesFor(state),
			dependence: { lowest: CALLER_INDEPENDENT },
			memo: createEvaluationMemo(state)
		});
		readMemoizedEvaluation = (entry, context) => {
			if (entry === undefined || context.memo.dependencies.intersects(entry.dependencies, context.bindings)) return undefined;
			retainDependencyProof(entry.dependencies, context);
			return entry.value;
		};
		retainDependencyProof = (proof, context) => {
			const parent = context.memo.dependencyFrames.at(-1);
			if (parent !== undefined) parent.proof = context.memo.dependencies.union(parent.proof, proof);
		};
		recordBindingDependency = (binding, context) => retainDependencyProof(context.memo.dependencies.binding(binding.bindingId), context);
		collectEvaluationDependencies = (binding, context, evaluate) => {
			const frame = { proof: context.memo.dependencies.binding(binding.bindingId) };
			context.memo.dependencyFrames.push(frame);
			try {
				return {
					value: evaluate(),
					dependencies: frame.proof
				};
			} finally {
				context.memo.dependencyFrames.pop();
				retainDependencyProof(frame.proof, context);
			}
		};
		readSnapshotValuesFor = (binding, context) => {
			const initializer = binding.initializers[0];
			if (binding.initializers.length !== 1 || initializer === undefined) return undefined;
			let values;
			if (context.capturePoint === undefined) values = context.memo.snapshotValues ??= new WeakMap();
			else {
				const captures = context.memo.capturedSnapshotValues ??= new WeakMap();
				let captured = captures.get(context.capturePoint);
				if (captured === undefined) {
					captured = new WeakMap();
					captures.set(context.capturePoint, captured);
				}
				values = captured;
			}
			let entries = values.get(initializer);
			if (entries === undefined) {
				entries = new Map();
				values.set(initializer, entries);
			}
			let depths = entries.get(binding.bindingId);
			if (depths === undefined) {
				depths = new Map();
				entries.set(binding.bindingId, depths);
			}
			return depths;
		};
		evaluateBinding = (binding, context, wholeBinding = true) => {
			recordBindingDependency(binding, context);
			const cycleHead = context.bindings.get(binding.bindingId);
			if (cycleHead !== undefined) {
				context.dependence.lowest = Math.min(context.dependence.lowest, cycleHead);
				return {
					status: "cycle",
					reason: `Alias cycle at ${binding.name}.`
				};
			}
			if (wholeBinding && context.capturePoint !== undefined && !semanticBindingPrecedesCapture(binding, context.capturePoint, context.state.parentsByNode)) {
				const { capturePoint: _capturePoint, ...liveContext } = context;
				return evaluateBinding(binding, {
					...liveContext,
					primitiveBindingValues: primitiveBindingValuesFor(context.state)
				});
			}
			const cached = wholeBinding ? context.primitiveBindingValues.get(binding.bindingId) : undefined;
			if (cached !== undefined) return cached;
			const snapshots = wholeBinding ? undefined : readSnapshotValuesFor(binding, context);
			const snapshot = snapshots?.get(context.expressionDepth);
			const snapshotValue = readMemoizedEvaluation(snapshot, context);
			if (snapshotValue !== undefined) {
				if (snapshot?.depthDependent === true) context.dependence.lowest = EVERY_CALLER;
				return snapshotValue;
			}
			const independent = wholeBinding && context.capturePoint === undefined ? callerIndependentBindingValuesFor(context.state) : undefined;
			const retained = independent?.get(binding.bindingId);
			if (retained !== undefined && context.expressionDepth <= retained.expressionDepth) {
				const reusable = readMemoizedEvaluation(retained, context);
				if (reusable !== undefined) return reusable;
			}
			if (binding.referenceInitializers.some(({ assignment }) => assignment) && (binding.initializers.length > 0 || (context.state.bindingsById.get(binding.bindingId)?.initializers.length ?? 0) > 0)) return {
				status: "ambiguous",
				reason: `Binding ${binding.name} has value and projected-reference assignments.`
			};
			if (binding.initializers.length === 0) return {
				status: "unknown",
				reason: wholeBinding ? `Binding ${binding.name} has no constant initializer.` : `Binding ${binding.name} has no proven initializer at this read.`
			};
			if (binding.initializers.some(({ node }) => t.isUpdateExpression(node) || t.isAssignmentExpression(node) && node.operator !== "=" && node.operator !== "&&=" && node.operator !== "||=" && node.operator !== "??=")) return {
				status: "unknown",
				reason: `Binding ${binding.name} has a compound or update write.`
			};
			if (binding.initializers.length > 1) return {
				status: "ambiguous",
				reason: `Binding ${binding.name} has multiple possible assignments.`
			};
			const initializer = binding.initializers[0];
			if (initializer === undefined) return {
				status: "unknown",
				reason: "Missing binding initializer."
			};
			if (context.state.conditionallySkippedExpressions.has(initializer.node)) return {
				status: "unknown",
				reason: `Binding ${binding.name} may remain uninitialized.`
			};
			const position = context.bindings.size;
			const callerDependence = context.dependence.lowest;
			context.dependence.lowest = CALLER_INDEPENDENT;
			context.bindings.set(binding.bindingId, position);
			let value;
			let callerIndependent = false;
			let depthDependent = false;
			let evaluated;
			try {
				evaluated = collectEvaluationDependencies(binding, context, () => {
					const nested = nestedContext(context);
					let value = projectValue(evaluateExpression(initializer.node, nested), initializer.projection);
					if (canCapturePrimitive(value)) {
						const captureContext = primitiveCaptureContext(initializer.node, nested);
						if (captureContext !== undefined) {
							const captured = projectValue(evaluateExpression(initializer.node, captureContext), initializer.projection);
							if (isPrimitive(captured)) value = captured;
						}
					}
					return value;
				});
				value = evaluated.value;
				callerIndependent = context.dependence.lowest > position;
				depthDependent = context.dependence.lowest === EVERY_CALLER;
			} finally {
				context.bindings.delete(binding.bindingId);
				context.dependence.lowest = callerIndependent ? callerDependence : Math.min(callerDependence, context.dependence.lowest);
			}
			let projected = invalidateSemanticMutationPaths(value, binding.memberWrites.filter(({ node }) => context.capturePoint === undefined || node === undefined || !semanticBindingEffectFollowsCapture(binding, context.capturePoint, node, context.state.parentsByNode)).map(({ path }) => path));
			for (const escape of binding.escapedPaths) {
				if (projected.status !== "object" && projected.status !== "array") break;
				if (context.capturePoint !== undefined && semanticEscapeFollowsCapture(binding, context.capturePoint, escape.node, context.state.parentsByNode)) continue;
				projected = invalidateSemanticEscapedPath(projected, escape.path);
			}
			if ((projected.status === "object" || projected.status === "array") && semanticBindingMayHaveOpaqueEffect(binding, context.state, context.capturePoint, "reference")) projected = {
				status: "unknown",
				reason: "Direct eval may have mutated this object reference."
			};
			if (callerIndependent && independent !== undefined && (retained === undefined || retained.expressionDepth < context.expressionDepth)) independent.set(binding.bindingId, {
				value: projected,
				dependencies: evaluated.dependencies,
				expressionDepth: context.expressionDepth
			});
			if (snapshots !== undefined && (callerIndependent || depthDependent) && !context.memo.dependencies.intersects(evaluated.dependencies, context.bindings)) snapshots.set(context.expressionDepth, {
				value: projected,
				dependencies: evaluated.dependencies,
				depthDependent
			});
			if (wholeBinding && (context.capturePoint !== undefined || projected.status === "literal" || projected.status === "union" || isSemanticResourceLimit(projected) && (projected.resourceLimit === "primitive-bytes" || projected.resourceLimit === "primitive-candidates"))) context.primitiveBindingValues.set(binding.bindingId, projected);
			return projected;
		};
		evaluateExpression = (node, context) => {
			const value = evaluateExpressionValue(node, context);
			recordSemanticValueLimit(context.state, value);
			return value;
		};
		evaluateExpressionValue = (node, context) => {
			if (context.expressionDepth > 256) {
				context.dependence.lowest = EVERY_CALLER;
				return semanticResourceLimitUnknown("expression-depth");
			}
			const unwrapped = unwrapJavaScriptExpression(node);
			if (unwrapped.depth > 0) {
				if (context.expressionDepth + unwrapped.depth > 256) {
					context.dependence.lowest = EVERY_CALLER;
					return semanticResourceLimitUnknown("expression-depth");
				}
				return evaluateExpression(unwrapped.node, {
					...context,
					expressionDepth: context.expressionDepth + unwrapped.depth
				});
			}
			const literal = readExactJavaScriptLiteral(node);
			if (literal.found) return semanticPrimitiveSet([literal.value]);
			if (t.isFunctionExpression(node) || t.isFunctionDeclaration(node) || t.isArrowFunctionExpression(node) || t.isClassExpression(node) || t.isClassDeclaration(node)) return definedNonPrimitiveValue(`Unsupported ${node.type} value.`);
			if (t.isIdentifier(node)) {
				const binding = resolveSemanticBindingState(context.state, node, node.name);
				if (binding === undefined) return {
					status: "unknown",
					reason: `Unbound identifier ${node.name}.`
				};
				const read = semanticBindingAtRead(binding, node, context.state.parentsByNode);
				if (read.status === "unresolved" && binding.mutable && binding.definitions.some(({ kind }) => kind === "assignment")) {
					const value = evaluateBinding(binding, nestedContext(context));
					if (value.status === "unknown" || value.status === "ambiguous" || value.status === "cycle") return value;
					return {
						status: "unknown",
						reason: `Binding ${binding.name} has unresolved ordering at this read.`
					};
				}
				const atRead = read.binding;
				if (semanticOpaqueBindingReadMayHaveChanged(binding, context.capturePoint ?? node, context.state)) return {
					status: "unknown",
					reason: "Direct eval may have changed this lexical binding."
				};
				return evaluateBinding(atRead, nestedContext(context), atRead === binding);
			}
			if (t.isTemplateLiteral(node)) return evaluateTemplate(node, context);
			if (t.isConditionalExpression(node) || t.isLogicalExpression(node)) return mergeValues(semanticSelectedBranches(node, context).map((branch) => evaluateExpression(branch, nestedContext(context))));
			if (t.isObjectExpression(node)) return evaluateObject(node, context);
			if (t.isArrayExpression(node)) return evaluateArray(node, context);
			if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) return evaluateMember(node, context);
			if (t.isBinaryExpression(node, { operator: "+" })) return evaluateAddition(node, context);
			if (t.isUnaryExpression(node)) return evaluateUnary(node, context);
			return {
				status: "unknown",
				reason: `Unsupported ${node.type} value.`
			};
		};
		evaluateTemplate = (node, context) => {
			let candidates = [""];
			for (let index = 0; index < node.quasis.length; index += 1) {
				const quasi = node.quasis[index];
				const text = quasi?.value.cooked;
				if (text === undefined || text === null) return {
					status: "unknown",
					reason: "Template text has no cooked representation."
				};
				if (exceedsSemanticTemplateByteBudget(candidates, [text])) return semanticResourceLimitUnknown("primitive-bytes");
				candidates = candidates.map((prefix) => `${prefix}${text}`);
				const expression = node.expressions[index];
				if (expression === undefined) continue;
				const evaluated = evaluateExpression(expression, nestedContext(context));
				const values = semanticPrimitiveCandidates(evaluated);
				if (values === null) {
					if (isSemanticResourceLimit(evaluated)) return evaluated;
					return {
						status: "unknown",
						reason: "Template expression is not a bounded primitive."
					};
				}
				if (candidates.length > 256 / values.length) return semanticResourceLimitUnknown("primitive-candidates");
				const suffixes = values.map((value) => String(value));
				if (exceedsSemanticTemplateByteBudget(candidates, suffixes)) return semanticResourceLimitUnknown("primitive-bytes");
				candidates = candidates.flatMap((prefix) => suffixes.map((suffix) => `${prefix}${suffix}`));
			}
			return semanticPrimitiveSet(candidates);
		};
		semanticSelectedBranches = (node, context) => {
			if (t.isConditionalExpression(node)) {
				const test = evaluateExpression(node.test, nestedContext(context));
				const choice = semanticCondition(test, Boolean);
				return choice === undefined ? [node.consequent, node.alternate] : [choice ? node.consequent : node.alternate];
			}
			const left = evaluateExpression(node.left, nestedContext(context));
			const choice = logicalRightOperand(node.operator, semanticCondition(left, Boolean), semanticCondition(left, (value) => value === null, false));
			return choice === undefined ? [node.left, node.right] : [choice ? node.right : node.left];
		};
		semanticCondition = (value, select, objectResult = true) => {
			if (value.status === "object" || value.status === "array") return objectResult;
			const choices = semanticPrimitiveCandidates(value)?.map(select);
			return choices !== undefined && choices.length > 0 && choices.every((choice) => choice === choices[0]) ? choices[0] : undefined;
		};
		evaluateObject = (node, context) => {
			const propertiesByName = new Map();
			let unknownProperties = false;
			let omittedProperties = 0;
			const invalidateEarlierProperties = () => {
				for (const [name] of propertiesByName) propertiesByName.set(name, {
					name,
					presence: "present",
					value: {
						status: "unknown",
						reason: "A later property may overwrite this value."
					}
				});
			};
			for (const property of node.properties) {
				if (t.isSpreadElement(property)) {
					const copied = evaluateExpression(property.argument, captureContextAt(property.argument, nestedContext(context)) ?? nestedContext(context));
					if (copied.status === "object" || copied.status === "array") {
						const unknown = copied.status === "object" ? copied.unknownProperties : copied.unknownItems;
						if (unknown) {
							unknownProperties = true;
							omittedProperties = null;
							invalidateEarlierProperties();
						}
						for (const field of semanticContainer(copied).slots) {
							if (field.presence === "absent") continue;
							propertiesByName.set(field.name, {
								...field,
								value: isPrimitive(field.value) ? field.value : {
									status: "unknown",
									reason: "Copied reference fields retain live identity rather than a scalar snapshot."
								}
							});
						}
					} else if (copied.status !== "literal" || typeof copied.value === "string") {
						unknownProperties = true;
						omittedProperties = null;
						invalidateEarlierProperties();
					}
					continue;
				}
				if (property.computed && semanticKnownSymbolKey(property.key, context.state)) {
					unknownProperties = true;
					if (omittedProperties !== null) omittedProperties += 1;
					continue;
				}
				const name = semanticStaticPropertyKey(property.key, property.computed);
				if (name === null) {
					unknownProperties = true;
					if (omittedProperties !== null) omittedProperties += 1;
					invalidateEarlierProperties();
					continue;
				}
				if (t.isObjectProperty(property) && !property.computed && !property.shorthand && name === "__proto__") {
					unknownProperties = true;
					if (omittedProperties !== null) omittedProperties += 1;
					continue;
				}
				propertiesByName.set(name, {
					name,
					presence: "present",
					value: t.isObjectProperty(property) ? evaluateCapturedExpression(property.value, nestedContext(context)) : property.kind === "method" ? definedNonPrimitiveValue("Object method or accessor value is not a primitive.") : {
						status: "unknown",
						reason: "Object method or accessor value is not a primitive."
					}
				});
			}
			const properties = [...propertiesByName.values()].sort((left, right) => compareUnicodeCodePoints(left.name, right.name));
			return unknownProperties ? {
				status: "object",
				properties,
				unknownProperties: true,
				omittedProperties
			} : {
				status: "object",
				properties,
				unknownProperties: false,
				omittedProperties: 0
			};
		};
		evaluateArray = (node, context) => {
			const items = [];
			let unknownItems = false;
			let omittedItems = 0;
			for (const element of node.elements) {
				if (t.isSpreadElement(element)) {
					unknownItems = true;
					omittedItems = null;
					break;
				}
				if (element === null) {
					items.push({
						name: String(items.length),
						presence: "absent",
						value: {
							status: "unknown",
							reason: "Array hole has no own value."
						}
					});
					continue;
				}
				items.push({
					name: String(items.length),
					presence: "present",
					value: evaluateCapturedExpression(element, nestedContext(context))
				});
			}
			return unknownItems ? {
				status: "array",
				items,
				unknownItems: true,
				omittedItems
			} : {
				status: "array",
				items,
				unknownItems: false,
				omittedItems: 0
			};
		};
		evaluateMember = (node, context) => {
			const keys = [];
			let current = node;
			let value;
			while (t.isMemberExpression(current) || t.isOptionalMemberExpression(current)) {
				if (!t.isNode(current.object)) {
					value = {
						status: "unknown",
						reason: "Unsupported member base."
					};
					break;
				}
				const key = semanticStaticPropertyKey(current.property, current.computed);
				if (key === null) {
					value = {
						status: "unknown",
						reason: "Dynamic member key."
					};
					break;
				}
				keys.push(key);
				current = current.object;
			}
			value ??= evaluateExpression(current, nestedContext(context));
			for (const key of keys.reverse()) value = projectValue(value, [key]);
			return value;
		};
		evaluateAddition = (node, context) => {
			const pending = [];
			let current = node;
			while (true) {
				if (t.isBinaryExpression(current, { operator: "+" })) {
					pending.push({
						node: current,
						left: undefined
					});
					current = current.left;
					continue;
				}
				let value = evaluateExpression(current, nestedContext(context));
				while (true) {
					const parent = pending.at(-1);
					if (parent === undefined) return value;
					if (parent.left === undefined) {
						parent.left = value;
						current = parent.node.right;
						break;
					}
					value = addPrimitiveValues(parent.left, value);
					pending.pop();
				}
			}
		};
		addPrimitiveValues = (leftValue, rightValue) => {
			const left = semanticPrimitiveCandidates(leftValue);
			const right = semanticPrimitiveCandidates(rightValue);
			if (left === null || right === null) {
				if (isSemanticResourceLimit(leftValue)) return leftValue;
				if (isSemanticResourceLimit(rightValue)) return rightValue;
				return {
					status: "unknown",
					reason: "Non-primitive addition."
				};
			}
			if (left.length > 256 / right.length) return semanticResourceLimitUnknown("primitive-candidates");
			if (exceedsSemanticPrimitiveAdditionByteBudget(left, right)) return semanticResourceLimitUnknown("primitive-bytes");
			const values = left.flatMap((leftValue) => right.map((rightValue) => typeof leftValue === "string" || typeof rightValue === "string" ? `${String(leftValue)}${String(rightValue)}` : Number(leftValue) + Number(rightValue)));
			return semanticPrimitiveSet(values);
		};
		evaluateUnary = (node, context) => {
			const evaluated = evaluateExpression(node.argument, nestedContext(context));
			const argument = semanticPrimitiveCandidates(evaluated);
			if (argument === null) {
				if (isSemanticResourceLimit(evaluated)) return evaluated;
				return {
					status: "unknown",
					reason: "Non-primitive unary operand."
				};
			}
			if (node.operator === "!") return semanticPrimitiveSet(argument.map((value) => !value));
			if (node.operator === "+") return semanticPrimitiveSet(argument.map((value) => Number(value)));
			if (node.operator === "-") return semanticPrimitiveSet(argument.map((value) => -Number(value)));
			return {
				status: "unknown",
				reason: `Unsupported unary ${node.operator}.`
			};
		};
		projectValue = (value, projection) => {
			if (isSemanticResourceLimit(value)) return value;
			if (projection.includes(null)) return {
				status: "unknown",
				reason: "Cannot project a dynamic property."
			};
			const path = projection.map((key) => String(key));
			const slot = semanticSlotAtPath(value, path);
			return slot.presence === "present" || isSemanticResourceLimit(slot.value) ? slot.value : {
				status: "unknown",
				reason: `Own property ${path.join("/")} is ${slot.presence}.`
			};
		};
		provenanceForBinding = (binding, context) => {
			recordBindingDependency(binding, context);
			const cycleHead = context.bindings.get(binding.bindingId);
			if (cycleHead !== undefined) {
				context.dependence.lowest = Math.min(context.dependence.lowest, cycleHead);
				return semanticUnresolvedProvenance("cycle", `Alias cycle at ${binding.name}.`);
			}
			let depths = context.memo.provenance.get(binding.bindingId);
			const prior = readMemoizedEvaluation(depths?.get(context.expressionDepth), context);
			if (prior !== undefined) return prior;
			const position = context.bindings.size;
			const callerDependence = context.dependence.lowest;
			context.dependence.lowest = CALLER_INDEPENDENT;
			let result;
			let callerIndependent = false;
			try {
				result = collectEvaluationDependencies(binding, context, () => provenanceForBindingUncached(binding, context));
				callerIndependent = context.dependence.lowest > position;
			} finally {
				context.dependence.lowest = callerIndependent ? callerDependence : Math.min(callerDependence, context.dependence.lowest);
			}
			if (callerIndependent) {
				if (depths === undefined) {
					depths = new Map();
					context.memo.provenance.set(binding.bindingId, depths);
				}
				depths.set(context.expressionDepth, result);
			}
			return result.value;
		};
		provenanceForBindingUncached = (binding, context) => {
			const provenance = provenanceForBindingValue(binding, context);
			const assigned = binding.definitions.some(({ kind }) => kind === "assignment");
			const conditionallyInitialized = binding.initializers.some(({ node }) => context.state.conditionallySkippedExpressions.has(node));
			if (provenance.status !== "module" || !assigned && !conditionallyInitialized) return provenance;
			return semanticAmbiguousProvenance(provenance.origins, assigned ? `Binding ${binding.name} may be reassigned.` : `Binding ${binding.name} may remain uninitialized.`);
		};
		provenanceForBindingValue = (binding, context) => {
			const provenance = provenanceForBindingInitializers(binding, context);
			if (!binding.referenceInitializers.some(({ assignment }) => assignment)) return provenance;
			if (provenance.status === "local") return semanticUnresolvedProvenance("unknown", `Binding ${binding.name} has projected reference assignments whose module provenance is unresolved.`);
			return provenance.status === "module" ? semanticAmbiguousProvenance(provenance.origins, `Binding ${binding.name} has projected reference assignments that may replace its module origin.`) : provenance;
		};
		provenanceForBindingInitializers = (binding, context) => {
			if (binding.kind === "parameter" || binding.kind === "catch") return semanticUnresolvedProvenance("unknown", binding.kind === "parameter" ? "Parameter provenance depends on caller arguments." : "Catch binding provenance depends on the thrown value.");
			if (binding.directOrigins.length > 0) return semanticOriginsProvenance(binding.directOrigins);
			if (binding.initializers.length === 0) return semanticLocalProvenance();
			if (binding.initializers.length > 1) return semanticAmbiguousProvenance([], `Binding ${binding.name} has multiple possible assignments.`);
			const initializer = binding.initializers[0];
			if (initializer === undefined) return semanticUnresolvedProvenance("unknown", "Missing binding initializer.");
			if (initializer.projection.includes(null)) return semanticUnresolvedProvenance("unknown", "Dynamic provenance projection.");
			context.bindings.set(binding.bindingId, context.bindings.size);
			let resolved;
			try {
				resolved = provenanceForExpression(initializer.node, nestedContext(context));
			} finally {
				context.bindings.delete(binding.bindingId);
			}
			if (resolved.status !== "module" || initializer.projection.length === 0) return resolved;
			return semanticOriginsProvenance(resolved.origins.map((origin) => ({
				...origin,
				importedPath: [...origin.importedPath, ...initializer.projection.map((segment) => String(segment))]
			})));
		};
		provenanceForExpression = (node, context) => {
			if (context.expressionDepth > 256) {
				context.dependence.lowest = EVERY_CALLER;
				context.state.valueResourceLimits.add("expression-depth");
				return semanticUnresolvedProvenance("unknown", semanticResourceLimitReason("expression-depth"));
			}
			const unwrapped = unwrapJavaScriptExpression(node);
			if (unwrapped.depth > 0) {
				if (context.expressionDepth + unwrapped.depth > 256) {
					context.dependence.lowest = EVERY_CALLER;
					context.state.valueResourceLimits.add("expression-depth");
					return semanticUnresolvedProvenance("unknown", semanticResourceLimitReason("expression-depth"));
				}
				return provenanceForExpression(unwrapped.node, {
					...context,
					expressionDepth: context.expressionDepth + unwrapped.depth
				});
			}
			const required = semanticRequireOrigin(node, context.state);
			if (required !== undefined) return semanticOriginsProvenance([required.origin]);
			if (t.isSequenceExpression(node)) {
				const finalExpression = node.expressions.at(-1);
				return finalExpression === undefined ? semanticUnresolvedProvenance("unknown", "Empty sequence expression.") : provenanceForExpression(finalExpression, nestedContext(context));
			}
			if (t.isAssignmentExpression(node) && node.operator === "=") return provenanceForExpression(node.right, nestedContext(context));
			if (t.isIdentifier(node)) {
				const binding = resolveSemanticBindingState(context.state, node, node.name);
				return binding === undefined ? semanticUnresolvedProvenance("unknown", `Unbound identifier ${node.name}.`) : provenanceForBindingAtRead(binding, node, nestedContext(context));
			}
			if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
				const members = [];
				let current = node;
				while (t.isMemberExpression(current) || t.isOptionalMemberExpression(current)) {
					if (!t.isNode(current.object)) return semanticUnresolvedProvenance("unknown", "Unsupported member base.");
					const member = semanticStaticPropertyKey(current.property, current.computed);
					if (member === null) return semanticUnresolvedProvenance("unknown", "Dynamic provenance member.");
					members.push(member);
					current = current.object;
				}
				const base = provenanceForExpression(current, nestedContext(context));
				const path = members.reverse();
				return base.status !== "module" ? base : semanticOriginsProvenance(base.origins.map((origin) => ({
					...origin,
					importedPath: [...origin.importedPath, ...path]
				})));
			}
			if (t.isConditionalExpression(node) || t.isLogicalExpression(node)) {
				const candidates = semanticSelectedBranches(node, context).map((branch) => provenanceForExpression(branch, nestedContext(context)));
				const origins = uniqueSemanticOrigins(candidates.flatMap((candidate) => candidate.origins));
				const allModuleOrigins = candidates.every(({ status }) => status === "module");
				if (allModuleOrigins && origins.length === 1) return semanticOriginsProvenance(origins);
				return origins.length > 0 ? semanticAmbiguousProvenance(origins, allModuleOrigins ? "Multiple module origins." : "Conditional provenance includes a non-module alternative.") : semanticUnresolvedProvenance("unknown", "Conditional provenance is unresolved.");
			}
			if (isLocallyCreatedValue(node)) return semanticLocalProvenance();
			return semanticUnresolvedProvenance("unknown", `Unsupported ${node.type} provenance.`);
		};
		provenanceForBindingAtRead = (binding, read, context) => {
			if (semanticOpaqueBindingReadMayHaveChanged(binding, read, context.state)) return semanticAmbiguousProvenance(provenanceForBinding(binding, context).origins, "Direct eval may have changed this runtime value.");
			const { binding: snapshot } = semanticBindingAtRead(binding, read, context.state.parentsByNode);
			if (snapshot === binding) return provenanceForBinding(binding, context);
			if (context.bindings.has(binding.bindingId)) return semanticUnresolvedProvenance("cycle", `Alias cycle at ${binding.name}.`);
			context.bindings.set(binding.bindingId, context.bindings.size);
			try {
				return provenanceForBindingValue(snapshot, context);
			} finally {
				context.bindings.delete(binding.bindingId);
			}
		};
		isLocallyCreatedValue = (node) => readExactJavaScriptLiteral(node).found || t.isObjectExpression(node) || t.isArrayExpression(node) || t.isFunctionExpression(node) || t.isFunctionDeclaration(node) || t.isArrowFunctionExpression(node) || t.isClassExpression(node) || t.isClassDeclaration(node) || t.isTemplateLiteral(node) || t.isUnaryExpression(node) || t.isBinaryExpression(node) || t.isUpdateExpression(node);
		mergeValues = (values) => {
			const resourceLimit = values.find(isSemanticResourceLimit);
			if (resourceLimit !== undefined) return resourceLimit;
			const primitives = values.flatMap((value) => semanticPrimitiveCandidates(value) ?? []);
			const merged = values.every((value) => value.status === "union" || value.status === "literal") ? semanticPrimitiveSet(primitives) : {
				status: "ambiguous",
				reason: "Branches have incompatible values."
			};
			if (values.length > 0 && values.every(semanticValueDefinitelyDefined)) definitelyDefinedValues.add(merged);
			return merged;
		};
		nestedContext = (context) => ({
			state: context.state,
			primitiveBindingValues: context.primitiveBindingValues,
			...context.capturePoint === undefined ? {} : { capturePoint: context.capturePoint },
			expressionDepth: context.expressionDepth + 1,
			bindings: context.bindings,
			dependence: context.dependence,
			memo: context.memo
		});
		isPrimitive = (value) => value.status === "literal" || value.status === "union";
		canCapturePrimitive = (value) => !isPrimitive(value) && !(isSemanticResourceLimit(value) && value.resourceLimit === "expression-depth");
		primitiveCaptureContext = (node, context) => {
			if (t.isObjectExpression(node) || t.isArrayExpression(node)) return undefined;
			return captureContextAt(node, context);
		};
		captureContextAt = (node, context) => {
			if (context.capturePoint !== undefined || semanticCapturePosition(node, context.state.parentsByNode) === null) return undefined;
			let captures = capturedBindingValuesByState.get(context.state);
			if (captures === undefined) {
				captures = new WeakMap();
				capturedBindingValuesByState.set(context.state, captures);
			}
			let values = captures.get(node);
			if (values === undefined) {
				values = new Map();
				captures.set(node, values);
			}
			return {
				...context,
				capturePoint: node,
				primitiveBindingValues: values
			};
		};
		evaluateCapturedExpression = (node, context) => {
			let values = primitiveExpressionValuesByState.get(context.state);
			const cached = values?.get(node);
			if (cached !== undefined) return cached;
			let value = evaluateExpression(node, context);
			if (canCapturePrimitive(value)) {
				const captureContext = primitiveCaptureContext(node, context);
				if (captureContext !== undefined) {
					const captured = evaluateExpression(node, captureContext);
					if (isPrimitive(captured)) value = captured;
				}
			}
			if (context.capturePoint === undefined && isPrimitive(value)) {
				if (values === undefined) {
					values = new WeakMap();
					primitiveExpressionValuesByState.set(context.state, values);
				}
				values.set(node, value);
			}
			return value;
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticReferenceSources.js
var semanticCommonJsRequireOwnEnumerableAt, semanticKnownArrayIteration, semanticKnownArrayIterationAt, semanticReferenceIterationUnknown, selectedReferenceIterationKnown, semanticReferenceSourcesInactive, semanticSelectedReferenceSlot, semanticCopiedReferencePath;
function init_javascriptSemanticReferenceSources() {
	return (init_javascriptSemanticReferenceSources = __esmMin((() => {
		init_javascriptSemanticPropertyPaths();
		init_unicodeCodePointOrder();
		init_javascriptSemanticValues();
		init_javascriptSemanticSlots();
		init_javascriptSemanticMutationInitializers();
		semanticCommonJsRequireOwnEnumerableAt = (capture, state) => {
			const selected = ["commonjs-module", "require"];
			const mayAffect = (effect) => effect.path.length <= selected.length && effect.path.every((key, index) => semanticPropertyPathKeyMatches(key, selected[index] ?? "")) && semanticEffectTiming(capture, effect.node, state) !== "after";
			return state.ambientWriteEffects.some(mayAffect) || state.ambientEscapeEffects.some(mayAffect);
		};
		semanticKnownArrayIteration = (value, state) => !state.arrayIterationUnknown && value?.status === "array" && value.items.every((item) => semanticArrayIndex(item.name) !== null);
		semanticKnownArrayIterationAt = (node, state) => semanticKnownArrayIteration(evaluateSemanticExpression(node, state, node), state);
		semanticReferenceIterationUnknown = (source, state) => source.iterationSources?.some((iterable) => !selectedReferenceIterationKnown(iterable, state)) === true;
		selectedReferenceIterationKnown = (source, state) => {
			let values = [evaluateSemanticExpression(source.node, state, source.node)];
			for (const key of source.projection) {
				if (typeof key === "object" && key !== null) return false;
				const selected = new Set();
				for (const value of values) {
					if (key === null) {
						if (!semanticKnownArrayIteration(value, state) || value.status !== "array" || value.unknownItems) return false;
						for (const slot of value.items) {
							if (slot.presence !== "present") return false;
							selected.add(slot.value);
						}
					} else {
						const slot = semanticSlotAtPath(value, [String(key)]);
						if (slot.presence !== "present") return false;
						selected.add(slot.value);
					}
				}
				values = [...selected];
			}
			return values.every((value) => semanticKnownArrayIteration(value, state));
		};
		semanticReferenceSourcesInactive = (reference, state) => reference.requiredSources?.some((source) => !semanticReferenceIterationUnknown(source, state) && semanticSelectedReferenceSlot(source, state, source.node)?.presence === "absent") === true || reference.fallbackSources?.some((source) => {
			const slot = semanticSelectedReferenceSlot(source, state, source.node);
			return !semanticReferenceIterationUnknown(source, state) && slot?.presence === "present" && semanticValueDefinitelyDefined(slot.value);
		}) === true;
		semanticSelectedReferenceSlot = (source, state, capturePoint) => {
			const path = [];
			for (const key of source.projection) {
				if (key === null || typeof key === "object") return undefined;
				path.push(String(key));
			}
			return semanticSlotAtPath(evaluateSemanticExpression(source.node, state, capturePoint), path);
		};
		semanticCopiedReferencePath = (initializer, path, effect) => {
			const offset = initializer.copyProjectionOffset;
			if (offset === undefined) return [...initializer.projection, ...path];
			const copiedPath = [...initializer.projection.slice(offset + 1), ...path];
			if (effect === "identity" && copiedPath.length === 0) return null;
			if (effect === "write" && copiedPath.length < 2) return null;
			let [key, ...remaining] = copiedPath;
			if (initializer.copyKind === "array-rest") {
				const startIndex = initializer.copyStartIndex ?? 0;
				if (key === undefined || key === null) key = {
					excludedKeys: [],
					startIndex
				};
				else if (typeof key === "object") key = {
					excludedKeys: key.excludedKeys.flatMap((name) => {
						const index = semanticArrayIndex(name);
						return index === null ? [] : [String(index + startIndex)];
					}),
					startIndex: (key.startIndex ?? 0) + startIndex
				};
				else {
					const index = semanticArrayIndex(key);
					if (index === null) return null;
					key = index + startIndex;
				}
			} else {
				const excludedKeys = initializer.copyExcludedKeys ?? [];
				if (key === undefined || key === null) key = { excludedKeys };
				else if (typeof key === "object") key = {
					...key,
					excludedKeys: [...new Set([...key.excludedKeys, ...excludedKeys])].sort(compareUnicodeCodePoints)
				};
				else if (excludedKeys.includes(String(key))) return null;
			}
			return [
				...initializer.projection.slice(0, offset),
				key,
				...remaining
			];
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticGetterResults.js
var resultBranches, GetterResultWalker, expandSemanticGetterResult, semanticGetterReceiverReferences;
function init_javascriptSemanticGetterResults() {
	return (init_javascriptSemanticGetterResults = __esmMin((() => {
		init_javascriptAstValues();
		init_javascriptSemanticCallableResults();
		init_javascriptSemanticMutationInitializers();
		init_javascriptSemanticReferenceSources();
		init_javascriptSemanticState();
		init_javascriptSemanticObjectReferences();
		init_javascriptSemanticGetterQueries();
		resultBranches = (node) => {
			if (t.isConditionalExpression(node)) return [node.consequent, node.alternate];
			if (t.isLogicalExpression(node)) return [node.left, node.right];
			if (t.isSequenceExpression(node)) {
				const last = node.expressions.at(-1);
				return last === undefined ? [] : [last];
			}
			if (t.isAssignmentExpression(node)) {
				if (node.operator === "=") return [node.right];
				if ([
					"&&=",
					"||=",
					"??="
				].includes(node.operator)) return [node.left, node.right];
			}
			return undefined;
		};
		GetterResultWalker = class {
			job;
			query;
			resolvers;
			#pending = [];
			#aliases = new Map();
			#scope;
			constructor(job, query, resolvers, roots = semanticCallableResultExpressions(job.invocation.getter)) {
				this.job = job;
				this.query = query;
				this.resolvers = resolvers;
				for (const { node } of roots) if (node !== null) this.#enqueue(() => ({
					node,
					path: job.path
				}));
				this.#scope = query.state.scopeByNode.get(job.invocation.getter)?.scopeId;
			}
			run() {
				for (let cursor = 0; cursor < this.#pending.length; cursor++) {
					const current = this.#pending[cursor];
					if (current !== undefined) this.#visit(current);
				}
			}
			#enqueue(create) {
				if (!this.query.reserveResult()) return;
				const work = create();
				this.#pending.push(this.query.widening ? {
					...work,
					path: [],
					escapes: true,
					...work.privateRead === undefined ? {} : { privateRead: {
						...work.privateRead,
						path: []
					} }
				} : work);
			}
			#retain(current, reference) {
				this.query.retain(reference, current.escapes || this.job.escapes);
			}
			#privateRead(current) {
				if (current.privateRead !== undefined) this.#retain(current, {
					node: current.privateRead.node,
					path: current.escapes ? [] : current.privateRead.path
				});
			}
			#localBinding(expression) {
				const state = this.query.state;
				const binding = resolveSemanticBindingState(state, expression, expression.name);
				let scope = binding === undefined ? undefined : state.scopesById.get(binding.scopeId);
				while (scope !== undefined && scope.scopeId !== this.#scope) {
					if (scope.kind === "function" || scope.parentScopeId === null) return undefined;
					scope = state.scopesById.get(scope.parentScopeId);
				}
				return scope !== undefined && binding?.referenceInitializers.every((initializer) => initializer.copyKind === undefined) ? binding : undefined;
			}
			#cycle(current, identity) {
				for (let visit = current.aliases; visit !== undefined; visit = visit.parent) if (visit.identity === identity) return visit;
				return undefined;
			}
			#alias(current, expression) {
				const binding = this.#localBinding(expression);
				if (binding === undefined) return false;
				const identity = JSON.stringify([
					binding.bindingId,
					expression.start,
					expression.end
				]);
				const previous = this.#cycle(current, identity);
				if (previous !== undefined) {
					if (current.path.length > previous.pathLength && !current.escapes) this.#enqueue(() => ({
						...current,
						path: [],
						aliases: undefined,
						escapes: true
					}));
					return true;
				}
				const key = JSON.stringify([
					current.path,
					current.privateRead?.name,
					current.privateRead?.path,
					current.escapes
				]);
				const known = this.#aliases.get(identity) ?? new Set();
				if (!known.has(key)) {
					known.add(key);
					this.#aliases.set(identity, known);
					this.#aliasOrigins(current, expression, binding, identity);
				}
				return true;
			}
			#aliasOrigins(current, expression, binding, identity) {
				const state = this.query.state;
				const { binding: origins } = semanticBindingAtRead(binding, expression, state.parentsByNode);
				const aliases = {
					identity,
					pathLength: current.path.length,
					...current.aliases === undefined ? {} : { parent: current.aliases }
				};
				for (const initializer of [...origins.initializers, ...origins.referenceInitializers.filter((origin) => !semanticReferenceSourcesInactive(origin, state))]) this.#enqueue(() => ({
					...current,
					node: initializer.node,
					path: [...initializer.projection, ...current.path],
					aliases
				}));
			}
			#ownsThis(expression) {
				let owner = this.query.state.parentsByNode.get(expression);
				while (owner !== undefined && !t.isClass(owner) && !(t.isFunction(owner) && !t.isArrowFunctionExpression(owner))) owner = this.query.state.parentsByNode.get(owner);
				return owner === this.job.invocation.getter;
			}
			#privateValue(current, owner) {
				const read = current.privateRead;
				if (read === undefined) return;
				const { getter, receiver = owner } = this.job.invocation;
				const isStatic = t.isClassMethod(getter) && getter.static;
				if (!t.isClass(receiver) || !this.resolvers.privateReceiver(receiver, owner, current.path, isStatic)) {
					this.#privateRead(current);
					return;
				}
				for (const member of owner.body.body) if (t.isClassPrivateProperty(member) && member.static === isStatic && member.key.id.name === read.name && member.value != null) this.#retain(current, {
					node: member.value,
					path: current.escapes ? [] : read.path
				});
			}
			#thisValue(current, expression) {
				if (!this.#ownsThis(expression)) return;
				const { getter, owner, receiver = owner } = this.job.invocation;
				if (current.privateRead !== undefined && t.isClass(owner)) {
					this.#privateValue(current, owner);
					return;
				}
				const references = t.isClass(receiver) ? this.resolvers.classReferences({
					owner: receiver,
					kind: t.isClassMethod(getter) && getter.static ? "static" : "instance"
				}, current.path, current.escapes || this.job.escapes) : this.resolvers.objectReferences(receiver, current.path);
				for (const reference of references) this.#retain(current, reference);
			}
			#superValue(current, expression) {
				const { getter, owner, receiver = owner } = this.job.invocation;
				if (!t.isSuper(expression.object) || !t.isClass(owner) || owner.superClass == null) return false;
				const key = semanticStaticPropertyKey(expression.property, expression.computed);
				for (const base of this.resolvers.bases(owner.superClass)) for (const reference of this.resolvers.classReferences({
					owner: base,
					receiver: t.isClass(receiver) ? receiver : owner,
					kind: t.isClassMethod(getter) && getter.static ? "static" : "prototype"
				}, [key, ...current.path], current.escapes || this.job.escapes)) this.#retain(current, reference);
				return true;
			}
			#member(current, expression) {
				if (current.privateRead !== undefined && t.isPrivateName(expression.property)) {
					this.#privateRead(current);
					return;
				}
				if (t.isPrivateName(expression.property) && t.isClass(this.job.invocation.owner)) {
					const name = expression.property.id.name;
					this.#enqueue(() => ({
						...current,
						node: expression.object,
						path: [],
						privateRead: {
							node: expression,
							name,
							path: current.path
						}
					}));
					return;
				}
				if (!this.#superValue(current, expression)) this.#enqueue(() => ({
					...current,
					node: expression.object,
					path: [semanticStaticPropertyKey(expression.property, expression.computed), ...current.path]
				}));
			}
			#visit(current) {
				const expression = unwrapJavaScriptExpression(current.node).node;
				if (t.isIdentifier(expression) && this.#alias(current, expression)) return;
				if (t.isForOfStatement(expression)) {
					this.#enqueue(() => ({
						...current,
						node: expression.right,
						path: [null, ...current.path]
					}));
					return;
				}
				if (t.isThisExpression(expression) || t.isSuper(expression)) this.#thisValue(current, expression);
				else if (t.isMemberExpression(expression) || t.isOptionalMemberExpression(expression)) this.#member(current, expression);
				else {
					const branches = resultBranches(expression);
					if (branches !== undefined) for (const node of branches) this.#enqueue(() => ({
						...current,
						node
					}));
					else if (current.privateRead !== undefined) this.#privateRead(current);
					else if (current.path.length > 0 && (t.isObjectExpression(expression) || t.isArrayExpression(expression)) && this.resolvers.containerReferences !== undefined) {
						for (const reference of this.resolvers.containerReferences(expression, current.path)) this.#enqueue(() => ({
							...current,
							node: reference.node,
							path: reference.path
						}));
					} else this.#retain(current, {
						node: expression,
						path: current.path
					});
				}
			}
		};
		expandSemanticGetterResult = (job, query, resolvers) => new GetterResultWalker(job, query, resolvers).run();
		semanticGetterReceiverReferences = (getter, operand, state) => {
			const parent = state.parentsByNode.get(getter);
			const owner = t.isClassBody(parent) ? state.parentsByNode.get(parent) : parent;
			if (!t.isObjectExpression(owner) && !t.isClass(owner)) return [];
			const query = new SemanticGetterQuery(state);
			let privateReceiver = false;
			const references = query.run(() => {
				query.schedule({
					getter,
					owner
				}, []);
				return [];
			}, (job) => new GetterResultWalker(job, query, {
				objectReferences: (_receiver, path) => [{
					node: getter,
					path
				}],
				classReferences: (_lookup, path) => [{
					node: getter,
					path
				}],
				privateReceiver: () => {
					privateReceiver = true;
					return true;
				},
				bases: () => [],
				containerReferences: (node, path) => t.isObjectExpression(node) ? semanticObjectPropertyReferences(node, path, state) : semanticArrayPropertyReferences(node, path)
			}, [{ node: operand }]).run());
			return references.filter(({ node }) => node === getter || privateReceiver);
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticObjectReferences.js
var semanticClassCandidates, instanceFieldReferences, classPropertyDescriptors, semanticClassPropertyReferences, semanticClassAccessorReferences, ClassReferenceWalk, classPropertyReferences, objectReceiverReference, privateReceiverProjection, expandGetterResult, propertyIndexes, objectPropertyIndex, relevantPropertiesInReverse, semanticObjectPropertyReferences, semanticObjectAccessorReferences, ObjectReferenceWalk, objectPropertyReferences, objectExpressionDefinesKey, semanticArrayPropertyReferences;
function init_javascriptSemanticObjectReferences() {
	return (init_javascriptSemanticObjectReferences = __esmMin((() => {
		init_javascriptSemanticPropertyKeys();
		init_javascriptSemanticState();
		init_javascriptAstValues();
		init_javascriptSemanticPropertyPaths();
		init_unicodeCodePointOrder();
		init_javascriptSemanticGetterQueries();
		init_javascriptSemanticGetterResults();
		semanticClassCandidates = (root, state) => {
			const pending = [root];
			const seenNodes = new Set();
			const seenBindings = new Set();
			const classes = [];
			for (let cursor = 0; cursor < pending.length; cursor++) {
				const node = pending[cursor];
				if (node === undefined) continue;
				const expression = unwrapJavaScriptExpression(node).node;
				if (seenNodes.has(expression)) continue;
				seenNodes.add(expression);
				if (t.isClass(expression)) {
					classes.push(expression);
				} else if (t.isIdentifier(expression)) {
					const binding = resolveSemanticBindingState(state, expression, expression.name);
					if (binding === undefined || seenBindings.has(binding.bindingId)) continue;
					seenBindings.add(binding.bindingId);
					for (const initializer of binding.initializers) pending.push(initializer.node);
				} else if (t.isConditionalExpression(expression) || t.isLogicalExpression(expression)) {
					pending.push(t.isConditionalExpression(expression) ? expression.consequent : expression.left, t.isConditionalExpression(expression) ? expression.alternate : expression.right);
				} else if (t.isSequenceExpression(expression)) {
					const last = expression.expressions.at(-1);
					if (last !== undefined) pending.push(last);
				}
			}
			return classes;
		};
		instanceFieldReferences = (root, propertyName, path, state, initializedBefore) => {
			const references = [];
			const pending = [{
				klass: root,
				excluded: new Set()
			}];
			const selections = new Map();
			let definiteNames;
			for (let cursor = 0; cursor < pending.length; cursor++) {
				const current = pending[cursor];
				if (current === undefined) continue;
				const previous = selections.get(current.klass);
				const excluded = previous === undefined ? current.excluded : new Set([...previous].filter((name) => current.excluded.has(name)));
				if (previous !== undefined && previous.size === excluded.size) continue;
				selections.set(current.klass, excluded);
				const shadowed = new Set(excluded);
				const before = initializedBefore === undefined ? -1 : current.klass.body.body.indexOf(initializedBefore);
				const members = before < 0 ? current.klass.body.body : current.klass.body.body.slice(0, before);
				for (const member of [...members].reverse()) {
					if (!isRuntimeJavaScriptClassProperty(member) || member.static) continue;
					if (propertyName !== null && member.computed && semanticKnownSymbolKey(member.key, state)) continue;
					const key = semanticStaticPropertyKey(member.key, member.computed);
					if (key !== null && shadowed.has(key)) continue;
					if (key !== null) shadowed.add(key);
					if ((propertyName === null || key === null || key === propertyName) && member.value != null) references.push({
						node: member.value,
						path
					});
				}
				const bases = current.klass.superClass == null ? [] : semanticClassCandidates(current.klass.superClass, state);
				if (bases.length === 0) definiteNames = definiteNames === undefined ? shadowed : new Set([...definiteNames].filter((name) => shadowed.has(name)));
				for (const klass of bases) pending.push({
					klass,
					excluded: shadowed
				});
			}
			return {
				references,
				definiteNames: definiteNames ?? new Set()
			};
		};
		classPropertyDescriptors = (klass, propertyName, kind, state, initializedBefore, accessor = "get") => {
			const isStatic = kind === "static";
			const selectedAccessors = [];
			const fields = [];
			const indexedMembers = [];
			const before = initializedBefore === undefined ? -1 : klass.body.body.indexOf(initializedBefore);
			klass.body.body.forEach((member, index) => {
				if ((t.isClassMethod(member) || t.isClassProperty(member)) && propertyName !== null && member.computed && semanticKnownSymbolKey(member.key, state)) return;
				if (before >= 0 && index >= before && isRuntimeJavaScriptClassProperty(member)) return;
				if ((t.isClassMethod(member) || kind === "static" && isRuntimeJavaScriptClassProperty(member)) && member.static === isStatic) indexedMembers.push({
					member,
					index,
					key: semanticStaticPropertyKey(member.key, member.computed)
				});
			});
			const matchingMembers = propertyName === null ? [] : indexedMembers.filter(({ key }) => key === propertyName);
			const uncertainAccessors = indexedMembers.filter((entry) => {
				const { member, key } = entry;
				return t.isClassMethod(member) && member.kind === accessor && (propertyName === null || member.computed && key === null);
			});
			const getters = matchingMembers.filter((entry) => t.isClassMethod(entry.member) && entry.member.kind === accessor);
			const getter = getters.at(-1);
			const getterIndex = getter?.index ?? -1;
			const laterDataMember = matchingMembers.some(({ member, index }) => t.isClassProperty(member) || t.isClassMethod(member) && member.kind === "method" && index > getterIndex);
			const seenFields = new Set();
			for (const { member, key } of [...indexedMembers].reverse()) {
				if (!t.isClassProperty(member)) continue;
				if (key !== null && seenFields.has(key)) continue;
				if (key !== null) seenFields.add(key);
				if (propertyName === null || key === null || key === propertyName) fields.push(member);
			}
			if (getters.length > 0 && !laterDataMember && getter !== undefined) selectedAccessors.push(getter.member);
			for (const { member, index } of uncertainAccessors) if (!matchingMembers.some(({ member: matching, index: matchingIndex }) => (t.isClassProperty(matching) || t.isClassMethod(matching) && (matching.kind === "method" || matching.kind === accessor)) && matchingIndex > index)) selectedAccessors.push(member);
			return {
				accessors: selectedAccessors,
				fields,
				inherits: matchingMembers.length === 0
			};
		};
		semanticClassPropertyReferences = (lookup, selection, state) => {
			const query = new SemanticGetterQuery(state);
			return query.run(() => classPropertyReferences(lookup, selection, state, { query }), (job) => expandGetterResult(job, query));
		};
		semanticClassAccessorReferences = (lookup, key, state, accessor) => new ClassReferenceWalk(lookup, [key], state, {
			query: new SemanticGetterQuery(state),
			accessor
		}).run();
		ClassReferenceWalk = class {
			lookup;
			state;
			context;
			#references = [];
			#pending;
			#seen = new Set();
			#name;
			#path;
			#fields = new Set();
			constructor(lookup, selection, state, context) {
				this.lookup = lookup;
				this.state = state;
				this.context = context;
				const [key, ...path] = selection;
				this.#name = key == null || typeof key === "object" ? null : String(key);
				this.#path = path;
				this.#pending = [lookup.owner];
			}
			#instanceFields() {
				if (this.lookup.kind !== "instance") return false;
				const fields = instanceFieldReferences(this.lookup.owner, this.#name, this.#path, this.state, this.lookup.initializedBefore);
				if (this.context.accessor === undefined) for (const reference of fields.references) this.#references.push(reference);
				this.#fields = fields.definiteNames;
				return this.#name !== null && this.#fields.has(this.#name);
			}
			#getter(klass, getter) {
				const key = semanticStaticPropertyKey(getter.key, getter.computed);
				if (key !== null && this.#fields.has(key)) return;
				if (this.context.accessor !== undefined) {
					this.#references.push({
						node: getter,
						path: []
					});
					return;
				}
				this.context.query.schedule({
					getter,
					owner: klass,
					receiver: this.lookup.receiver ?? this.lookup.owner
				}, this.#path, this.context.escapes);
			}
			#visit(klass) {
				const descriptors = classPropertyDescriptors(klass, this.#name, this.lookup.kind, this.state, this.lookup.initializedBefore, this.context.accessor);
				for (const field of this.context.accessor === undefined ? descriptors.fields : []) if (field.value != null) this.#references.push({
					node: field.value,
					path: this.#path
				});
				for (const getter of this.lookup.fieldsOnly ? [] : descriptors.accessors) this.#getter(klass, getter);
				if (descriptors.inherits && klass.superClass != null) for (const base of semanticClassCandidates(klass.superClass, this.state)) this.#pending.push(base);
			}
			run() {
				if (this.#instanceFields()) return this.#references;
				for (let cursor = 0; cursor < this.#pending.length; cursor++) {
					const klass = this.#pending[cursor];
					if (klass === undefined || this.#seen.has(klass)) continue;
					this.#seen.add(klass);
					this.#visit(klass);
				}
				return this.#references;
			}
		};
		classPropertyReferences = (lookup, selection, state, context) => new ClassReferenceWalk(lookup, selection, state, context).run();
		objectReceiverReference = (object, path, state) => {
			let current = object;
			const projection = [];
			while (true) {
				const parent = state.parentsByNode.get(current);
				if (t.isVariableDeclarator(parent) && parent.init === current && t.isIdentifier(parent.id)) return [{
					node: parent.id,
					path: [...projection, ...path],
					ownerInitializer: current
				}];
				if (t.isAssignmentExpression(parent, { operator: "=" }) && parent.right === current && t.isIdentifier(parent.left)) return [{
					node: parent.left,
					path: [...projection, ...path],
					ownerInitializer: current
				}];
				if (t.isArrayExpression(parent)) {
					let minimumIndex = 0;
					let uncertainIndex = false;
					for (const element of parent.elements) {
						if (element === current) break;
						if (t.isSpreadElement(element)) uncertainIndex = true;
						else minimumIndex++;
					}
					projection.unshift(uncertainIndex ? {
						excludedKeys: [],
						startIndex: minimumIndex
					} : minimumIndex);
					current = parent;
					continue;
				}
				if (t.isObjectProperty(parent) && parent.value === current) {
					projection.unshift(semanticStaticPropertyKey(parent.key, parent.computed));
					const container = state.parentsByNode.get(parent);
					if (t.isObjectExpression(container)) {
						current = container;
						continue;
					}
				}
				break;
			}
			return [{
				node: object,
				path
			}];
		};
		privateReceiverProjection = (receiver, owner, path, isStatic, state) => {
			if (path.some((key) => key === null || typeof key === "object")) return false;
			const pending = [{
				receiver,
				path: path.map((key) => ({ key: String(key) })),
				visits: new Map()
			}];
			const seen = new Set();
			const declaringClass = (field) => {
				const body = state.parentsByNode.get(field);
				return body === undefined ? undefined : state.parentsByNode.get(body);
			};
			for (let cursor = 0; cursor < pending.length; cursor++) {
				const current = pending[cursor];
				if (current === undefined) break;
				const [selection, ...remaining] = current.path;
				if (selection === undefined) {
					if (!isStatic || current.receiver === owner) return true;
					continue;
				}
				const origin = JSON.stringify([
					current.receiver.start,
					selection.key,
					selection.before?.start
				]);
				const previous = current.visits.get(origin);
				if (previous !== undefined && previous <= current.path.length) continue;
				const visits = new Map(current.visits).set(origin, current.path.length);
				const identity = JSON.stringify([current.receiver.start, current.path.map(({ key, before }) => [key, before?.start])]);
				if (seen.has(identity)) continue;
				seen.add(identity);
				const lookupOwner = selection.before === undefined ? current.receiver : declaringClass(selection.before);
				if (!t.isClass(lookupOwner)) continue;
				for (const reference of semanticClassPropertyReferences({
					owner: lookupOwner,
					receiver: current.receiver,
					kind: isStatic ? "static" : "instance",
					fieldsOnly: true,
					...selection.before === undefined ? {} : { initializedBefore: selection.before }
				}, [selection.key], state)) {
					const field = state.parentsByNode.get(reference.node);
					if (!t.isClassProperty(field)) continue;
					const fieldOwner = declaringClass(field);
					if (!t.isClass(fieldOwner)) continue;
					const projection = [];
					let value = unwrapJavaScriptExpression(reference.node).node;
					while (t.isMemberExpression(value) || t.isOptionalMemberExpression(value)) {
						const key = semanticStaticPropertyKey(value.property, value.computed);
						if (key === null || t.isPrivateName(value.property)) break;
						projection.unshift({
							key,
							before: field
						});
						value = unwrapJavaScriptExpression(value.object).node;
					}
					if (!t.isThisExpression(value)) continue;
					pending.push({
						receiver: isStatic ? fieldOwner : current.receiver,
						path: [...projection, ...remaining],
						visits
					});
				}
			}
			return false;
		};
		expandGetterResult = (job, query) => {
			const state = query.state;
			expandSemanticGetterResult(job, query, {
				classReferences: (lookup, path, escapes) => classPropertyReferences(lookup, path, state, {
					query,
					escapes
				}),
				objectReferences: (receiver, path) => objectReceiverReference(receiver, path, state),
				privateReceiver: (receiver, owner, path, isStatic) => privateReceiverProjection(receiver, owner, path, isStatic, state),
				bases: (node) => semanticClassCandidates(node, state)
			});
		};
		propertyIndexes = new WeakMap();
		objectPropertyIndex = (node) => {
			const cached = propertyIndexes.get(node);
			if (cached !== undefined) return cached;
			const keyIndependent = [];
			const byName = new Map();
			node.properties.forEach((property, index) => {
				const name = t.isSpreadElement(property) ? null : semanticStaticPropertyKey(property.key, property.computed);
				if (name === null || t.isObjectProperty(property) && !property.computed && !property.shorthand && name === "__proto__") {
					keyIndependent.push(index);
					return;
				}
				const positions = byName.get(name);
				if (positions === undefined) byName.set(name, [index]);
				else positions.push(index);
			});
			const index = {
				keyIndependent,
				byName
			};
			propertyIndexes.set(node, index);
			return index;
		};
		relevantPropertiesInReverse = (node, key) => {
			if (typeof key !== "string" && typeof key !== "number") return [...node.properties].reverse();
			const { keyIndependent, byName } = objectPropertyIndex(node);
			const named = byName.get(String(key)) ?? [];
			const relevant = [];
			let left = keyIndependent.length - 1;
			let right = named.length - 1;
			while (left >= 0 || right >= 0) {
				const fromLeft = right < 0 || left >= 0 && (keyIndependent[left] ?? -1) > (named[right] ?? -1);
				const position = fromLeft ? keyIndependent[left--] : named[right--];
				const property = position === undefined ? undefined : node.properties[position];
				if (property !== undefined) relevant.push(property);
			}
			return relevant;
		};
		semanticObjectPropertyReferences = (node, path, state) => {
			const query = new SemanticGetterQuery(state);
			return query.run(() => objectPropertyReferences(node, path, query), (job) => expandGetterResult(job, query));
		};
		semanticObjectAccessorReferences = (node, key, state, accessor, lookup = "prototype") => new ObjectReferenceWalk(node, [key], new SemanticGetterQuery(state), accessor, lookup).run();
		ObjectReferenceWalk = class {
			node;
			query;
			accessor;
			accessorLookup;
			#references = [];
			#overwritten = new Set();
			#data = new Set();
			#accessors = new Set();
			#getters = new Set();
			#setters = new Set();
			#key;
			#remaining;
			constructor(node, path, query, accessor, accessorLookup = "prototype") {
				this.node = node;
				this.query = query;
				this.accessor = accessor;
				this.accessorLookup = accessorLookup;
				[this.#key, ...this.#remaining] = path;
			}
			#spreadKey() {
				const selected = this.#key ?? null;
				return typeof selected !== "object" ? selected : {
					...selected,
					excludedKeys: [...new Set([...selected?.excludedKeys ?? [], ...this.#overwritten])].sort(compareUnicodeCodePoints)
				};
			}
			#spread(property) {
				const selected = this.#key ?? null;
				if (typeof selected !== "object" && this.#overwritten.has(String(selected))) return;
				if (this.accessor === undefined) this.#references.push({
					node: property.argument,
					path: [this.#spreadKey(), ...this.#remaining],
					capturedSelectionAt: property.argument,
					ownEnumerable: true
				});
				if (selected !== null && typeof selected !== "object" && t.isObjectExpression(property.argument) && objectExpressionDefinesKey(property.argument, String(selected))) {
					this.#overwritten.add(String(selected));
					this.#data.add(String(selected));
				}
			}
			#prototype(property, name) {
				if (!t.isObjectProperty(property) || property.computed || property.shorthand || name !== "__proto__") return false;
				const selected = this.#key ?? null;
				if (this.accessor !== undefined && this.accessorLookup === "own") return true;
				if (t.isExpression(property.value) && (selected === null || typeof selected === "object" || typeof selected === "string" && !objectExpressionDefinesKey(this.node, selected))) this.#references.push({
					node: property.value,
					path: [selected, ...this.#remaining],
					inherited: true
				});
				return true;
			}
			#read(property, name) {
				if (name === null && this.#key != null && typeof this.#key !== "object" && (t.isObjectMethod(property) && property.kind === (this.accessor ?? "get") ? this.#data.has(String(this.#key)) || (this.accessor === "set" ? this.#setters : this.#getters).has(String(this.#key)) : this.#overwritten.has(String(this.#key)))) return;
				if (name !== null && !semanticPropertyPathKeyMatches(this.#key ?? null, name)) return;
				if (this.accessor !== undefined) {
					if (t.isObjectMethod(property) && property.kind === this.accessor) this.#references.push({
						node: property,
						path: []
					});
					return;
				}
				if (t.isObjectMethod(property)) {
					if (property.kind === "get") this.query.schedule({
						getter: property,
						owner: this.node
					}, this.#remaining);
					if (property.kind === "get" || property.kind === "set") return;
				}
				this.#references.push({
					node: t.isObjectProperty(property) ? property.value : property,
					path: this.#remaining
				});
			}
			#record(name, kind) {
				this.#overwritten.add(name);
				if (kind === "data") this.#data.add(name);
				else {
					this.#accessors.add(name);
					(kind === "get" ? this.#getters : this.#setters).add(name);
				}
			}
			#visit(property) {
				if (t.isSpreadElement(property)) {
					this.#spread(property);
					return;
				}
				if (property.computed && this.#key !== undefined && this.#key !== null && typeof this.#key !== "object" && semanticKnownSymbolKey(property.key, this.query.state)) return;
				const name = semanticStaticPropertyKey(property.key, property.computed);
				if (this.#prototype(property, name)) return;
				const kind = t.isObjectMethod(property) && property.kind !== "method" ? property.kind : "data";
				if (name !== null && (kind === "data" ? this.#data.has(name) || this.#accessors.has(name) : this.#data.has(name) || (kind === "get" ? this.#getters : this.#setters).has(name))) return;
				this.#read(property, name);
				if (name !== null) this.#record(name, kind);
			}
			run() {
				for (const property of relevantPropertiesInReverse(this.node, this.#key)) this.#visit(property);
				return this.#references;
			}
		};
		objectPropertyReferences = (node, path, query) => new ObjectReferenceWalk(node, path, query).run();
		objectExpressionDefinesKey = (root, key) => {
			const pending = [root];
			const seen = new Set();
			for (let cursor = 0; cursor < pending.length; cursor++) {
				const object = pending[cursor];
				if (object === undefined || seen.has(object)) continue;
				seen.add(object);
				for (const property of object.properties) {
					if (t.isSpreadElement(property)) {
						if (t.isObjectExpression(property.argument)) pending.push(property.argument);
						continue;
					}
					const name = semanticStaticPropertyKey(property.key, property.computed);
					if (name === key && !(t.isObjectProperty(property) && !property.computed && !property.shorthand && name === "__proto__")) return true;
				}
			}
			return false;
		};
		semanticArrayPropertyReferences = (node, path) => {
			const [key, ...remaining] = path;
			const selected = key ?? null;
			const selectedIndex = typeof selected === "object" ? null : semanticArrayIndex(selected);
			if (typeof selected !== "object" && selectedIndex === null) return [];
			const references = [];
			let minimumIndex = 0;
			let uncertainIndex = false;
			for (const element of node.elements) {
				if (t.isSpreadElement(element)) {
					if (selectedIndex === null || selectedIndex >= minimumIndex) {
						let sourceKey = null;
						if (!uncertainIndex) {
							if (selectedIndex !== null) sourceKey = selectedIndex - minimumIndex;
							else if (selected !== null && typeof selected === "object") sourceKey = {
								excludedKeys: selected.excludedKeys.flatMap((name) => {
									const index = semanticArrayIndex(name);
									return index === null || index < minimumIndex ? [] : [String(index - minimumIndex)];
								}),
								startIndex: Math.max(0, (selected.startIndex ?? 0) - minimumIndex)
							};
						}
						references.push({
							node: element.argument,
							path: [sourceKey, ...remaining],
							capturedSelectionAt: element.argument,
							iterableFallbackPath: []
						});
					}
					uncertainIndex = true;
					continue;
				}
				if (element !== null && (uncertainIndex ? selectedIndex === null || selectedIndex >= minimumIndex : semanticPropertyPathKeyMatches(selected, String(minimumIndex)))) references.push({
					node: element,
					path: remaining
				});
				minimumIndex++;
			}
			return references;
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticIterationSources.js
var semanticStoredSourceSelection, add, project, visit, emptySourceFacts, sourceFacts, semanticSourceFacts, semanticIterationSources, semanticPropertyReadSources;
function init_javascriptSemanticIterationSources() {
	return (init_javascriptSemanticIterationSources = __esmMin((() => {
		init_javascriptAstValues();
		init_javascriptSemanticPropertyPaths();
		init_unicodeCodePointOrder();
		init_javascriptSemanticReferenceSources();
		semanticStoredSourceSelection = (source, selected) => {
			const copy = source.projection.at(-1);
			if (copy === null || typeof copy !== "object") return { projection: [...source.projection, ...selected] };
			const projection = semanticCopiedReferencePath({
				projection: source.projection,
				copyProjectionOffset: source.projection.length - 1,
				copyKind: copy.startIndex === undefined ? "object-rest" : "array-rest",
				copyExcludedKeys: copy.excludedKeys,
				...copy.startIndex === undefined ? {} : { copyStartIndex: copy.startIndex }
			}, selected, "identity");
			return projection === null ? null : {
				projection,
				capturedSelectionDepth: source.projection.length,
				...copy.startIndex === undefined ? { ownEnumerable: true } : {}
			};
		};
		add = (sources, source, mutation, guards, kind = "iteration", target) => {
			sources.push({
				kind,
				node: source.node,
				projection: source.projection,
				mutation,
				...guards,
				...target === undefined ? {} : { target }
			});
		};
		project = (source, key) => {
			if (source === undefined) return undefined;
			const index = key === null ? null : semanticArrayIndex(key);
			return {
				node: source.node,
				projection: [...source.projection, source.restStartIndex !== undefined && index !== null ? source.restStartIndex + index : key]
			};
		};
		visit = (context, pattern, source, guards = {}) => {
			pattern = unwrapJavaScriptExpression(pattern).node;
			const { sources, mutation } = context;
			if (t.isMemberExpression(pattern)) {
				if (source !== undefined) add(sources, source.restStartIndex === undefined ? source : {
					node: source.node,
					projection: [...source.projection, {
						excludedKeys: [],
						startIndex: source.restStartIndex
					}]
				}, mutation, guards, "reference-store", pattern);
				return;
			}
			if (t.isTSParameterProperty(pattern)) {
				visit(context, pattern.parameter, source, guards);
				return;
			}
			if (t.isAssignmentPattern(pattern)) {
				visit(context, pattern.left, source, {
					...guards,
					requiredSources: [...guards.requiredSources ?? [], ...source === undefined ? [] : [{
						...source,
						...guards.iterationSources === undefined ? {} : { iterationSources: guards.iterationSources }
					}]]
				});
				visit(context, pattern.left, {
					node: pattern.right,
					projection: []
				}, {
					...guards,
					fallbackSources: [...guards.fallbackSources ?? [], ...source === undefined ? [] : [{
						...source,
						...guards.iterationSources === undefined ? {} : { iterationSources: guards.iterationSources }
					}]]
				});
				return;
			}
			if (t.isObjectPattern(pattern)) {
				for (const property of pattern.properties) {
					if (t.isRestElement(property)) {
						const rest = source === undefined ? undefined : {
							node: source.node,
							projection: [...source.projection, { excludedKeys: [...new Set(semanticObjectPatternKeys(pattern))].sort(compareUnicodeCodePoints) }]
						};
						if (rest !== undefined) context.propertyReads.push({
							...rest,
							...guards,
							mutation,
							lookup: "own"
						});
						visit(context, property.argument, rest, guards);
						continue;
					}
					const selected = project(source, semanticStaticPropertyKey(property.key, property.computed));
					if (selected !== undefined) context.propertyReads.push({
						...selected,
						...guards,
						mutation,
						lookup: "prototype"
					});
					visit(context, property.value, selected, guards);
				}
				return;
			}
			if (t.isArrayPattern(pattern)) {
				if (source !== undefined && source.restStartIndex === undefined) add(sources, source, mutation, guards);
				const selectedGuards = {
					...guards,
					iterationSources: [...guards.iterationSources ?? [], ...source === undefined ? [] : [source]]
				};
				pattern.elements.forEach((element, index) => {
					if (element === null) return;
					if (t.isRestElement(element)) visit(context, element.argument, source === undefined ? undefined : {
						node: source.node,
						projection: source.projection,
						restStartIndex: (source.restStartIndex ?? 0) + index
					}, selectedGuards);
					else visit(context, element, project(source, index), selectedGuards);
				});
				return;
			}
			if (t.isRestElement(pattern)) visit(context, pattern.argument, undefined, guards);
		};
		emptySourceFacts = {
			iterations: [],
			propertyReads: []
		};
		sourceFacts = new WeakMap();
		semanticSourceFacts = (node, parent) => {
			if (!(t.isVariableDeclarator(node) || t.isAssignmentExpression(node) || t.isForOfStatement(node) || t.isSpreadElement(node) || t.isYieldExpression(node) || t.isFunction(node))) return emptySourceFacts;
			const cached = sourceFacts.get(node);
			if (cached?.parent === parent) return cached.facts;
			const sources = [];
			const propertyReads = [];
			const context = {
				sources,
				propertyReads,
				mutation: node
			};
			if (t.isVariableDeclarator(node) && node.init != null) visit(context, node.id, {
				node: node.init,
				projection: []
			});
			else if (t.isAssignmentExpression(node) && [
				"=",
				"||=",
				"&&=",
				"??="
			].includes(node.operator)) visit(context, node.left, {
				node: node.right,
				projection: []
			});
			else if (t.isForOfStatement(node)) {
				add(sources, {
					node: node.right,
					projection: []
				}, node, {});
				const source = {
					node: node.right,
					projection: [null]
				};
				if (t.isVariableDeclaration(node.left)) {
					for (const declaration of node.left.declarations) visit(context, declaration.id, source);
				} else visit(context, node.left, source);
			} else if (t.isSpreadElement(node)) {
				if (t.isArrayExpression(parent)) add(sources, {
					node: node.argument,
					projection: []
				}, node, {});
				else if (t.isObjectExpression(parent)) propertyReads.push({
					node: node.argument,
					projection: [{ excludedKeys: [] }],
					mutation: node,
					lookup: "own"
				});
			} else if (t.isYieldExpression(node) && node.delegate && node.argument != null) add(sources, {
				node: node.argument,
				projection: []
			}, node, {});
			else if (t.isFunction(node)) for (const parameter of runtimeFunctionParameters(node)) visit(context, parameter, undefined);
			const facts = {
				iterations: sources,
				propertyReads
			};
			sourceFacts.set(node, {
				parent,
				facts
			});
			return facts;
		};
		semanticIterationSources = (node, parent) => semanticSourceFacts(node, parent).iterations;
		semanticPropertyReadSources = (node, parent) => semanticSourceFacts(node, parent).propertyReads;
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticAliasSelections.js
var semanticAliasSelectionChoices, selection, selectionCovers, pathCovers, joinSelections, SemanticAliasSelections;
function init_javascriptSemanticAliasSelections() {
	return (init_javascriptSemanticAliasSelections = __esmMin((() => {
		init_javascriptSemanticResourceLimits();
		semanticAliasSelectionChoices = (key) => key !== null && typeof key === "object" && "alternatives" in key ? key.alternatives : [key];
		selection = (choices) => {
			if (choices.includes(null)) return null;
			const alternatives = [...new Map(choices.map((choice) => [JSON.stringify(choice), choice]))].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([, choice]) => choice);
			return alternatives.length === 1 ? alternatives[0] : { alternatives };
		};
		selectionCovers = (prior, next) => {
			if (prior === null) return true;
			const choices = new Set(semanticAliasSelectionChoices(prior).map((key) => JSON.stringify(key)));
			return semanticAliasSelectionChoices(next).every((key) => choices.has(JSON.stringify(key)));
		};
		pathCovers = (prior, next) => prior.every((key, index) => next[index] !== undefined && selectionCovers(key, next[index]));
		joinSelections = (prior, next) => {
			let changed = -1;
			for (let index = 0; index < prior.length; index++) {
				if (JSON.stringify(prior[index]) === JSON.stringify(next[index])) continue;
				if (changed !== -1) return undefined;
				changed = index;
			}
			return prior.map((key, index) => index === changed ? selection([...semanticAliasSelectionChoices(key), ...semanticAliasSelectionChoices(next[index])]) : key);
		};
		SemanticAliasSelections = class {
			onLimit;
			#paths = new WeakMap();
			#calls = 0;
			#limited = false;
			constructor(onLimit) {
				this.onLimit = onLimit;
			}
			get limited() {
				return this.#limited;
			}
			normalize(node, next) {
				if (this.#limited) return next.map(() => null);
				const existing = this.#paths.get(node);
				const byDepth = existing ?? new Map();
				const paths = [...byDepth.get(next.length) ?? []];
				let candidate = next.map((key) => selection(semanticAliasSelectionChoices(key)));
				const covered = paths.find((prior) => pathCovers(prior, candidate));
				if (covered !== undefined) return covered;
				if (existing !== undefined && ++this.#calls > 512) {
					this.#limited = true;
					this.#paths = new WeakMap();
					this.onLimit();
					return next.map(() => null);
				}
				for (let index = 0; index < paths.length;) {
					const prior = paths[index];
					if (pathCovers(prior, candidate)) return prior;
					const joined = pathCovers(candidate, prior) ? candidate : joinSelections(prior, candidate);
					if (joined === undefined) {
						index++;
						continue;
					}
					candidate = [...joined];
					paths.splice(index, 1);
					index = 0;
				}
				paths.push(candidate);
				byDepth.set(candidate.length, paths);
				this.#paths.set(node, byDepth);
				return candidate;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticProjectedSources.js
function semanticProjectedSourceFactsAtRead(...arguments_) {
	return projectedSourceFactsAtRead(...arguments_);
}
var semanticNormalizeCapturedSelections, semanticShiftCapturedSelections, semanticCapturedSelectionsAfterPropertyRead, hasFreshProjectedReceiver, semanticProjectedSourcesAtRead, semanticProjectedSourceEligibilityAtRead, projectedSourceFactsAtRead;
function init_javascriptSemanticProjectedSources() {
	return (init_javascriptSemanticProjectedSources = __esmMin((() => {
		init_javascriptSemanticPropertyPaths();
		init_javascriptAstValues();
		init_javascriptSemanticObjectReferences();
		init_javascriptSemanticResourceLimits();
		init_javascriptSemanticMutationInitializers();
		init_javascriptSemanticReferenceSources();
		init_javascriptSemanticIterationSources();
		init_javascriptSemanticAliasSelections();
		semanticNormalizeCapturedSelections = (selections, pathLength) => {
			const byDepth = new Map();
			for (const capture of selections ?? []) if (capture.depth > 0 && (pathLength === undefined || capture.depth <= pathLength)) byDepth.set(capture.depth, capture);
			const normalized = [...byDepth.values()].sort((left, right) => left.depth - right.depth);
			return normalized.length ? normalized : undefined;
		};
		semanticShiftCapturedSelections = (selections, delta) => {
			const shifted = selections?.flatMap((selection) => selection.depth + delta > 0 ? [{
				...selection,
				depth: selection.depth + delta
			}] : []);
			return semanticNormalizeCapturedSelections(shifted);
		};
		semanticCapturedSelectionsAfterPropertyRead = (selections, source) => [...semanticShiftCapturedSelections(selections, source.path.length - 1) ?? [], ...source.capturedSelectionAt === undefined ? [] : [{
			at: source.capturedSelectionAt,
			depth: source.path.length,
			...source.ownEnumerable ? { ownEnumerable: true } : {}
		}]];
		hasFreshProjectedReceiver = (root, path, state) => {
			const pending = [{
				node: root,
				path
			}];
			const examined = new WeakMap();
			let selections = 0;
			while (pending.length > 0) {
				const current = pending.pop();
				const node = unwrapJavaScriptExpression(current.node).node;
				const key = JSON.stringify(current.path);
				const paths = examined.get(node) ?? new Set();
				if (paths.has(key)) return false;
				paths.add(key);
				examined.set(node, paths);
				if (++selections > 512) {
					state.valueResourceLimits.add("alias-selections");
					return false;
				}
				if (current.path.length === 0) {
					if (!t.isObjectExpression(node) && !t.isArrayExpression(node) && !t.isFunction(node) && !t.isClassExpression(node)) return false;
					continue;
				}
				const [selected, ...remaining] = current.path;
				const sources = t.isObjectExpression(node) ? semanticObjectPropertyReferences(node, [selected], state) : t.isArrayExpression(node) ? semanticArrayPropertyReferences(node, [selected]) : [];
				if (sources.length === 0) return false;
				if (selections + pending.length + sources.length > 512) {
					state.valueResourceLimits.add("alias-selections");
					return false;
				}
				pending.push(...sources.map((source) => ({
					node: source.node,
					path: [...source.path, ...remaining]
				})));
			}
			return true;
		};
		semanticProjectedSourcesAtRead = (...arguments_) => semanticProjectedSourceFactsAtRead(...arguments_)?.sources;
		semanticProjectedSourceEligibilityAtRead = (binding, reference, path, state, memberReadAt = reference, capturedSelections = []) => projectedSourceFactsAtRead(binding, reference, path, state, false, memberReadAt, capturedSelections, true)?.sources;
		projectedSourceFactsAtRead = (binding, reference, path, state, includeUnknown, memberReadAt = reference, capturedSelections = [], retainEligibility = false) => {
			const read = semanticBindingAtRead(binding, reference, state.parentsByNode);
			const captured = [...read.binding.initializers, ...read.binding.referenceInitializers];
			const normalizedCaptures = semanticNormalizeCapturedSelections(capturedSelections, path.length);
			const captureForDepth = (depth) => normalizedCaptures?.find((capture) => capture.depth >= depth)?.at;
			const selectedAt = (depth) => captureForDepth(depth) ?? memberReadAt;
			const samePrefix = (prefix, effect) => prefix.path.length < effect.path.length && prefix.path.every((key, index) => key !== null && typeof key !== "object" && effect.path[index] !== null && typeof effect.path[index] !== "object" && String(key) === String(effect.path[index]));
			const prefixReplacements = normalizedCaptures === undefined ? [] : binding.memberWrites.filter((replacement) => replacement.receiverIdentity === "definite" && t.isAssignmentExpression(replacement.node, { operator: "=" }) && replacement.path.length < path.length);
			const targetsReplacedPrefix = (effect) => capturedSelections.length > 0 && prefixReplacements.some((replacement) => {
				const capture = captureForDepth(replacement.path.length);
				const receiverAt = effect.receiverAt ?? effect.node;
				return capture !== undefined && receiverAt !== undefined && samePrefix(replacement, effect) && semanticTopLevelEffectFollowsCapture(capture, replacement.node, state.parentsByNode) && semanticDefiniteEffectPrecedesReference(replacement.node, receiverAt, state.parentsByNode) && hasFreshProjectedReceiver(replacement.node.right, effect.path.slice(replacement.path.length, -1), state);
			});
			const matches = (effect) => (effect.receiverInitializers === undefined || effect.receiverInitializers.length === 0 || captured.length === 0 || effect.receiverInitializers.some((receiver) => captured.some((source) => source.node === receiver.node && JSON.stringify(source.projection) === JSON.stringify(receiver.projection)))) && path.length > 0 && effect.path.length <= path.length && effect.path.every((key, index) => {
				const selected = path[index];
				return selected !== undefined && semanticAliasSelectionChoices(selected).some((choice) => choice === null || typeof choice === "object" || semanticPropertyPathKeyMatches(key, String(choice)));
			}) && semanticEffectTiming(selectedAt(effect.path.length), effect.node, state) !== "after" && !targetsReplacedPrefix(effect);
			const writes = binding.memberWrites.filter(matches);
			let replacement;
			for (const effect of writes) {
				if (effect.receiverIdentity === "definite" && t.isAssignmentExpression(effect.node, { operator: "=" }) && effect.path.every((key, index) => key !== null && typeof key !== "object" && path[index] !== null && typeof path[index] !== "object" && String(key) === String(path[index])) && semanticDefiniteEffectPrecedesReference(effect.node, selectedAt(effect.path.length), state.parentsByNode) && (replacement === undefined || semanticDefiniteEffectPrecedesReference(replacement.node, effect.node, state.parentsByNode) || replacement.node === effect.node && (replacement.assignedSources?.[0]?.target?.start ?? -1) < (effect.assignedSources?.[0]?.target?.start ?? -1))) replacement = effect;
			}
			const superseded = (effect) => replacement !== undefined && effect.node !== undefined && effect !== replacement && (semanticEffectTiming(replacement.node, effect.node, state) === "before" || effect.node === replacement.node && (effect.assignedSources?.[0]?.target?.start ?? -1) < (replacement.assignedSources?.[0]?.target?.start ?? -1));
			if (includeUnknown && binding.escapedPaths.some((effect) => matches(effect) && !superseded(effect))) return undefined;
			const sources = [];
			const sourceKeys = new WeakMap();
			const captureIds = new WeakMap();
			let nextCaptureId = 0;
			const appendSource = (source) => {
				const captures = semanticNormalizeCapturedSelections(source.capturedSelections)?.map(({ at, depth, ownEnumerable }) => {
					let id = captureIds.get(at);
					if (id === undefined) {
						id = nextCaptureId++;
						captureIds.set(at, id);
					}
					return [
						id,
						depth,
						ownEnumerable
					];
				});
				const key = JSON.stringify([source.path, captures]);
				const keys = sourceKeys.get(source.node) ?? new Set();
				if (keys.has(key)) return;
				keys.add(key);
				sourceKeys.set(source.node, keys);
				sources.push(source);
			};
			for (const effect of writes) {
				if (!retainEligibility && superseded(effect)) continue;
				if (!t.isAssignmentExpression(effect.node) || ![
					"=",
					"||=",
					"&&=",
					"??="
				].includes(effect.node.operator)) {
					if (includeUnknown) return undefined;
					continue;
				}
				if (effect.assignedSources === undefined) {
					if (includeUnknown) return undefined;
					continue;
				}
				const remaining = path.slice(effect.path.length);
				for (const source of effect.assignedSources) {
					if (semanticReferenceIterationUnknown(source, state)) return undefined;
					if (semanticReferenceSourcesInactive(source, state)) continue;
					const [key, ...suffix] = remaining;
					for (const choice of key === undefined ? [undefined] : semanticAliasSelectionChoices(key)) {
						const selection = semanticStoredSourceSelection(source, choice === undefined ? [] : [choice]);
						if (selection !== null) appendSource({
							node: source.node,
							path: [...selection.projection, ...suffix],
							...selection.capturedSelectionDepth === undefined ? {} : { capturedSelections: [{
								at: source.node,
								depth: selection.capturedSelectionDepth,
								...selection.ownEnumerable ? { ownEnumerable: true } : {}
							}] }
						});
					}
				}
			}
			const storedSources = [...sources];
			if (!retainEligibility && replacement !== undefined) return {
				sources,
				storedSources,
				retainsOrigin: false
			};
			for (const initializer of read.binding.initializers) {
				if (semanticReferenceIterationUnknown(initializer, state)) return undefined;
				if (semanticReferenceSourcesInactive(initializer, state)) continue;
				appendSource({
					node: initializer.node,
					path: [...initializer.projection, ...path]
				});
			}
			for (const initializer of read.binding.referenceInitializers) {
				if (semanticReferenceIterationUnknown(initializer, state)) return undefined;
				if (semanticReferenceSourcesInactive(initializer, state)) continue;
				const [key, ...suffix] = path;
				for (const choice of key === undefined ? [undefined] : semanticAliasSelectionChoices(key)) {
					const projection = semanticCopiedReferencePath(initializer, choice === undefined ? [] : [choice], "identity");
					if (projection !== null) appendSource({
						node: initializer.node,
						path: [...projection, ...suffix],
						capturedSelections: initializer.copyProjectionOffset === undefined ? [] : [{
							at: initializer.node,
							depth: projection.length + suffix.length - path.length + 1,
							...initializer.copyKind === "object-rest" ? { ownEnumerable: true } : {}
						}]
					});
				}
			}
			return {
				sources,
				storedSources,
				retainsOrigin: true
			};
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptBuiltinResourceMethods.js
var BUILTIN_RESOURCE_METHODS, BUILTIN_RESOURCE_SPECIFIERS;
function init_javascriptBuiltinResourceMethods() {
	return (init_javascriptBuiltinResourceMethods = __esmMin((() => {
		BUILTIN_RESOURCE_METHODS = {
			fs: [
				"open",
				"openSync",
				"createReadStream",
				"createWriteStream"
			],
			"fs/promises": ["open"],
			net: ["connect", "createConnection"],
			tls: ["connect", "createConnection"]
		};
		BUILTIN_RESOURCE_SPECIFIERS = Object.keys(BUILTIN_RESOURCE_METHODS);
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptStaticAnalysisHelpers.js
var failedJavaScriptStaticAnalysis, argumentNode, chunkRuntime, findChunkRuntime, moduleFactory, modulePropertyName, factoryRequireName, staticArrayValues, staticPathResolutionContext, staticPath, staticConcatenation, staticCallPath, staticFileUrlPath, staticSourceRelativeUrlPath, staticResolvedPath, isFilesystemPathExpression, isDirectoryPath, isImportMetaUrl, isFileIdentity, XHR_METHODS, isRequestUrlOrPathLiteral, isRequestUrlReference, WINDOW_OPEN_CALL, FS_OPEN_FLAGS, BROWSING_CONTEXT_KEYWORDS, xhrOpenUrl, KEYED_COLLECTION_CONSTRUCTORS, isKeyedCollectionReceiver, endpointArgument, storageKind, calleeName, memberPropertyName, stringValue, argumentValue, prefixedArgument, sourceSlice, range, rangeForOffsets, sourceRangesEqual, pointForOffset, detectVendors, registrationKey, sha256Text, STATIC_ROUTE_CALL_NAMES, vendorPatterns;
function init_javascriptStaticAnalysisHelpers() {
	return (init_javascriptStaticAnalysisHelpers = __esmMin((() => {
		init_javascriptAstValues();
		init_unicodeCodePointOrder();
		init_javascriptStaticCoverage();
		failedJavaScriptStaticAnalysis = () => ({
			parse_status: "failed",
			analysis_coverage: {
				...unexaminedJavaScriptStaticCoverage("JavaScript source could not be parsed."),
				syntax: {
					status: "failed",
					error_count: null
				}
			},
			parse_error_count: 1,
			visited_ast_nodes: 0,
			references: [],
			endpoints: [],
			storage: [],
			bundler_registrations: [],
			role_paths: [],
			source_map_urls: [],
			vendors: [],
			electron: {
				browser_windows: [],
				context_bridge_apis: [],
				ipc: [],
				sender_validations: [],
				utility_processes: [],
				native_addon_bindings: []
			},
			limitations: ["JavaScript source could not be parsed; absence of findings is not evidence of absence.", "JavaScript syntax was parsed as data and was never evaluated."]
		});
		argumentNode = (argument) => argument !== null && t.isNode(argument) ? argument : undefined;
		chunkRuntime = (call) => {
			if (!t.isMemberExpression(call.callee) && !t.isOptionalMemberExpression(call.callee)) return undefined;
			if (semanticStaticPropertyName(call.callee.property, call.callee.computed) !== "push") return undefined;
			return findChunkRuntime(call.callee.object);
		};
		findChunkRuntime = (node) => {
			const pending = [node];
			while (pending.length > 0) {
				const current = pending.pop();
				if (current === undefined) continue;
				if (t.isIdentifier(current) && /(?:webpack|rspack)Chunk/iu.test(current.name)) return current.name;
				if (t.isMemberExpression(current) || t.isOptionalMemberExpression(current)) {
					const property = semanticStaticPropertyName(current.property, current.computed);
					if (/(?:webpack|rspack)Chunk/iu.test(property)) return property;
					if (t.isNode(current.object)) pending.push(current.object);
					continue;
				}
				if (t.isAssignmentExpression(current)) {
					pending.push(current.right, current.left);
					continue;
				}
				if (t.isLogicalExpression(current) || t.isBinaryExpression(current)) {
					pending.push(current.right, current.left);
					continue;
				}
				const unwrapped = unwrapJavaScriptExpression(current).node;
				if (unwrapped !== current) pending.push(unwrapped);
			}
			return undefined;
		};
		moduleFactory = (property) => {
			if (t.isObjectMethod(property)) return property;
			if (t.isObjectProperty(property) && (t.isFunctionExpression(property.value) || t.isArrowFunctionExpression(property.value))) return property.value;
			return undefined;
		};
		modulePropertyName = (property) => {
			if (!t.isObjectMethod(property) && !t.isObjectProperty(property)) return `[unknown@${String(property.start ?? -1)}]`;
			const key = semanticStaticPropertyKey(property.key, property.computed);
			if (key !== null) return key;
			return property.computed ? `[computed@${String(property.start ?? -1)}]` : `[unknown@${String(property.start ?? -1)}]`;
		};
		factoryRequireName = (factory) => {
			const parameter = runtimeFunctionParameters(factory)[2];
			return t.isIdentifier(parameter) ? parameter.name : null;
		};
		staticArrayValues = (array) => {
			const staticValues = array.elements.flatMap((element) => {
				const value = argumentValue(element);
				return value === undefined ? [] : [value];
			});
			const values = [...new Set(staticValues)].sort(compareUnicodeCodePoints);
			return {
				values,
				unknown: array.elements.length - staticValues.length
			};
		};
		staticPathResolutionContext = (node, pathIntrinsics) => isFilesystemPathExpression(node, pathIntrinsics) ? "filesystem-expression" : "module-specifier";
		staticPath = (node, pathIntrinsics) => {
			node = unwrapJavaScriptExpression(node).node;
			const value = stringValue(node);
			if (value !== undefined) return value;
			if (t.isBinaryExpression(node, { operator: "+" })) return staticConcatenation(node, pathIntrinsics);
			if (t.isCallExpression(node) || t.isNewExpression(node)) return staticCallPath(node, pathIntrinsics);
			return undefined;
		};
		staticConcatenation = (node, pathIntrinsics) => {
			const operands = [];
			let current = node;
			while (t.isBinaryExpression(current, { operator: "+" })) {
				operands.push(current.right);
				current = unwrapJavaScriptExpression(current.left).node;
			}
			const anchored = isDirectoryPath(current, pathIntrinsics);
			if (!anchored) operands.push(current);
			let text = "";
			for (const operand of operands.reverse()) {
				const value = staticPath(operand, pathIntrinsics);
				if (value === undefined) return undefined;
				text += value;
			}
			if (!anchored) return text;
			return text.startsWith("/") ? posix.join(".", text) : undefined;
		};
		staticCallPath = (node, pathIntrinsics) => {
			if (t.isCallExpression(node) && pathIntrinsics?.(node.callee)) return staticResolvedPath(node, pathIntrinsics);
			if (t.isCallExpression(node) && pathIntrinsics?.(node.callee, "file-url-to-path")) return staticFileUrlPath(node, pathIntrinsics);
			if (!t.isCallExpression(node) || !pathIntrinsics?.(node.callee, "join")) return undefined;
			const parts = [];
			for (const argument of node.arguments) {
				if (isDirectoryPath(argumentNode(argument), pathIntrinsics)) {
					parts.push(".");
					continue;
				}
				const value = t.isNode(argument) ? staticPath(argument, pathIntrinsics) : undefined;
				if (value === undefined) return undefined;
				parts.push(value);
			}
			return parts.length === 0 ? undefined : posix.join(...parts);
		};
		staticFileUrlPath = (node, pathIntrinsics) => {
			if (node.arguments.length !== 1) return undefined;
			const rawArgument = argumentNode(node.arguments[0]);
			if (rawArgument === undefined) return undefined;
			const argument = unwrapJavaScriptExpression(rawArgument).node;
			if (t.isNewExpression(argument) && pathIntrinsics?.(argument, "source-url")) return staticSourceRelativeUrlPath(argument)?.path;
			const value = staticPath(argument, pathIntrinsics);
			const rawPath = value?.split(/[?#]/u, 1)[0] ?? "";
			if (value === undefined || !/^file:/iu.test(value) || value !== value.trim() || value.includes("\\") || [...value].some((character) => character.charCodeAt(0) < 32) || /%(?:2f|5c)/iu.test(rawPath)) return undefined;
			try {
				const url = new URL(value);
				if (url.protocol !== "file:") return undefined;
				const path = fileURLToPath(url, { windows: false });
				return /^\/[a-z]:/iu.test(path) ? undefined : path;
			} catch (cause) {
				void cause;
				return undefined;
			}
		};
		staticSourceRelativeUrlPath = (node) => {
			const value = stringValue(node.arguments[0]);
			if (value === undefined || (value.split(/[?#]/u, 1)[0] ?? "") === "" || value !== value.trim() || value.includes("\\") || [...value].some((character) => character.charCodeAt(0) < 32) || /^[a-z][a-z0-9+.-]*:/iu.test(value) || value.startsWith("//") || /%(?:2e|2f|5c)/iu.test(value.split(/[?#]/u, 1)[0] ?? "")) return undefined;
			const directory = `/${"source/".repeat(value.split("/").length + 1)}`;
			try {
				const resolved = new URL(value, `file://${directory}entry.js`);
				const path = fileURLToPath(resolved, { windows: false });
				if (value.startsWith("/")) return {
					path,
					directory: resolved.pathname.endsWith("/")
				};
				const relative = posix.relative(directory, path) || ".";
				return {
					path: value.startsWith("./") && relative !== "." && !relative.startsWith("../") ? `./${relative}` : relative,
					directory: resolved.pathname.endsWith("/")
				};
			} catch (cause) {
				void cause;
				return undefined;
			}
		};
		staticResolvedPath = (node, pathIntrinsics) => {
			const parts = [];
			let anchored = false;
			for (let index = node.arguments.length - 1; index >= 0; index -= 1) {
				const argument = node.arguments[index];
				if (isDirectoryPath(argumentNode(argument), pathIntrinsics)) {
					anchored = true;
					break;
				}
				const value = t.isNode(argument) ? staticPath(argument, pathIntrinsics) : undefined;
				if (value === undefined) return undefined;
				parts.push(value);
				if (posix.isAbsolute(value)) {
					anchored = true;
					break;
				}
			}
			if (!anchored) return undefined;
			const path = posix.join(...parts.reverse());
			return path === "/" ? path : path.replace(/\/$/u, "");
		};
		isFilesystemPathExpression = (node, pathIntrinsics) => {
			node = unwrapJavaScriptExpression(node).node;
			const value = stringValue(node);
			if (value !== undefined) return value.startsWith("/");
			if (isFileIdentity(node) || isDirectoryPath(node, pathIntrinsics)) return true;
			if (t.isBinaryExpression(node, { operator: "+" })) return isFilesystemPathExpression(node.left, pathIntrinsics) || isFilesystemPathExpression(node.right, pathIntrinsics);
			if (t.isCallExpression(node) || t.isNewExpression(node)) {
				if (!t.isCallExpression(node)) return false;
				const native = pathIntrinsics?.(node.callee) || pathIntrinsics?.(node.callee, "join") || pathIntrinsics?.(node.callee, "file-url-to-path");
				return native === true && staticCallPath(node, pathIntrinsics) !== undefined;
			}
			return false;
		};
		isDirectoryPath = (node, pathIntrinsics) => {
			if (node !== undefined) node = unwrapJavaScriptExpression(node).node;
			return node !== undefined && pathIntrinsics?.(node, "source-directory") === true;
		};
		isImportMetaUrl = (node) => {
			if (node === undefined) return false;
			const expression = unwrapJavaScriptExpression(node).node;
			if (!t.isMemberExpression(expression)) return false;
			const object = unwrapJavaScriptExpression(expression.object).node;
			return t.isMetaProperty(object) && object.meta.name === "import" && object.property.name === "meta" && semanticStaticPropertyName(expression.property, expression.computed) === "url";
		};
		isFileIdentity = (node) => {
			if (node !== undefined) node = unwrapJavaScriptExpression(node).node;
			if (t.isIdentifier(node, { name: "__filename" }) || isImportMetaUrl(node)) return true;
			if (!t.isCallExpression(node)) return false;
			const name = calleeName(node.callee);
			return (name === "fileURLToPath" || name.endsWith(".fileURLToPath")) && isFileIdentity(argumentNode(node.arguments[0]));
		};
		XHR_METHODS = new Set([
			"CONNECT",
			"DELETE",
			"GET",
			"HEAD",
			"OPTIONS",
			"PATCH",
			"POST",
			"PUT",
			"TRACE"
		]);
		isRequestUrlOrPathLiteral = (value) => /^(?:https?|wss?):\/\//iu.test(value) || value.startsWith("/") || value.startsWith("./") || value.startsWith("../");
		isRequestUrlReference = (value) => {
			if (isRequestUrlOrPathLiteral(value) || value.startsWith("?") || value.startsWith("#")) return true;
			if (!/^(?:https?|wss?):/iu.test(value)) return false;
			return URL.parse(value) !== null;
		};
		WINDOW_OPEN_CALL = /(?:^|\.)(?:window|self|globalThis|top|parent|opener|frames|document)\.open$/u;
		FS_OPEN_FLAGS = new Set([
			"a",
			"a+",
			"as",
			"as+",
			"ax",
			"ax+",
			"r",
			"r+",
			"rs",
			"rs+",
			"sa",
			"sa+",
			"sr",
			"sr+",
			"w",
			"w+",
			"wx",
			"wx+",
			"xa",
			"xa+",
			"xw",
			"xw+"
		]);
		BROWSING_CONTEXT_KEYWORDS = new Set([
			"_blank",
			"_parent",
			"_self",
			"_top"
		]);
		xhrOpenUrl = (name, methodNode, urlNode, receiverFact) => {
			const url = stringValue(urlNode);
			if (url === undefined) return undefined;
			if (receiverFact === "window") return undefined;
			const method = stringValue(methodNode);
			const storage = receiverFact === "local-indexed-db" || receiverFact === "local-cache-storage" || receiverFact === "indexed-db" || receiverFact === "cache-storage" || storageKind(name) !== undefined;
			if (method === undefined) return storage || receiverFact === undefined && WINDOW_OPEN_CALL.test(name) || FS_OPEN_FLAGS.has(url) || BROWSING_CONTEXT_KEYWORDS.has(url.toLowerCase()) ? undefined : url;
			return XHR_METHODS.has(method.toUpperCase()) || (!storage || receiverFact === "local-indexed-db" || receiverFact === "local-cache-storage") && /^[A-Z][A-Z-]*$/u.test(method) ? url : undefined;
		};
		KEYED_COLLECTION_CONSTRUCTORS = new Set([
			"FormData",
			"Headers",
			"Map",
			"Set",
			"URLSearchParams",
			"WeakMap",
			"WeakSet"
		]);
		isKeyedCollectionReceiver = (callee) => {
			callee = unwrapJavaScriptExpression(callee).node;
			if (!t.isMemberExpression(callee) && !t.isOptionalMemberExpression(callee)) return false;
			const receiver = unwrapJavaScriptExpression(callee.object).node;
			if (t.isNewExpression(receiver)) {
				const constructor = unwrapJavaScriptExpression(receiver.callee).node;
				return t.isIdentifier(constructor) && KEYED_COLLECTION_CONSTRUCTORS.has(constructor.name);
			}
			if (!t.isMemberExpression(receiver) && !t.isOptionalMemberExpression(receiver)) return false;
			const property = semanticStaticPropertyName(receiver.property, receiver.computed);
			return property === "headers" || property === "headersList" || property === "searchParams";
		};
		endpointArgument = (name, args, callee, receiverFact) => {
			const literal = (value) => value === undefined ? undefined : {
				kind: "endpoint",
				value
			};
			if (receiverFact === "window") return undefined;
			if (name === "fetch" || name.endsWith(".fetch") || name === "WebSocket" || name === "EventSource" || name.endsWith(".EventSource")) return literal(stringValue(args[0]));
			if (name.endsWith(".open")) {
				const value = xhrOpenUrl(name, args[0], args[1], receiverFact);
				if (value === undefined) return undefined;
				return {
					kind: stringValue(args[0]) !== undefined || isRequestUrlReference(value) ? "endpoint" : "candidate",
					value
				};
			}
			const method = [
				"get",
				"post",
				"put",
				"patch",
				"delete",
				"request"
			].find((candidate) => name === candidate || name.endsWith(`.${candidate}`));
			if (method !== undefined) {
				const value = stringValue(args[0]);
				if (value === undefined) return undefined;
				if ((method === "get" || method === "delete") && !isRequestUrlOrPathLiteral(value) && (isKeyedCollectionReceiver(callee) || method === "get" && (receiverFact === "configuration" || receiverFact === "extension-state"))) return undefined;
				return {
					kind: method !== "get" && method !== "delete" && isRequestUrlReference(value) ? "endpoint" : "candidate",
					value
				};
			}
			if (name === "sendBeacon" || name.endsWith(".sendBeacon")) return literal(stringValue(args[0]));
			if (name === "loadURL" || name.endsWith(".loadURL")) return literal(stringValue(args[0]));
			return undefined;
		};
		storageKind = (name) => {
			if (name.includes("localStorage.")) return "local-storage";
			if (name.includes("sessionStorage.")) return "session-storage";
			if (name.endsWith("indexedDB.open")) return "indexed-db";
			if (name.endsWith("caches.open")) return "cache-storage";
			return undefined;
		};
		calleeName = (node) => {
			node = unwrapJavaScriptExpression(node).node;
			const segments = [];
			while (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
				segments.push(memberPropertyName(node));
				if (!t.isNode(node.object)) break;
				node = unwrapJavaScriptExpression(node.object).node;
			}
			const base = t.isIdentifier(node) ? node.name : "";
			segments.push(base);
			segments.reverse();
			const first = segments.findIndex((segment) => segment !== "");
			return first === -1 ? "" : segments.slice(first).join(".");
		};
		memberPropertyName = (node) => semanticStaticPropertyKey(node.property, node.computed) ?? (node.computed ? `[computed@${String(node.property.start ?? -1)}]` : "");
		stringValue = (node) => {
			if (node === null || node === undefined) return undefined;
			const literal = readExactJavaScriptLiteral(node);
			return literal.found && typeof literal.value === "string" ? literal.value : undefined;
		};
		argumentValue = (node) => t.isNumericLiteral(node) ? String(node.value) : stringValue(node);
		prefixedArgument = (prefix, node) => {
			const value = argumentValue(node);
			return value === undefined ? undefined : `${prefix}${value}`;
		};
		sourceSlice = (source, node) => typeof node.start !== "number" || typeof node.end !== "number" ? "" : source.slice(node.start, node.end);
		range = (node) => ({
			start: {
				line: node.loc?.start.line ?? 1,
				column: node.loc?.start.column ?? 0
			},
			end: {
				line: node.loc?.end.line ?? node.loc?.start.line ?? 1,
				column: node.loc?.end.column ?? node.loc?.start.column ?? 0
			}
		});
		rangeForOffsets = (source, start, end) => ({
			start: pointForOffset(source, start),
			end: pointForOffset(source, end)
		});
		sourceRangesEqual = (left, right) => left !== null && left.start.line === right.start.line && left.start.column === right.start.column && left.end.line === right.end.line && left.end.column === right.end.column;
		pointForOffset = (source, offset) => {
			const before = source.slice(0, offset);
			const lines = before.split(/\r\n|[\n\r\u2028\u2029]/u);
			return {
				line: lines.length,
				column: lines.at(-1)?.length ?? 0
			};
		};
		detectVendors = (source) => vendorPatterns.flatMap(({ name, patterns }) => patterns.some((pattern) => source.includes(pattern)) ? [name] : []);
		registrationKey = (registration) => compositeKey([
			registration.runtime,
			registration.chunk_keys,
			String(registration.unknown_chunk_keys),
			registration.runtime_require_name,
			registration.runtime_module_cache_status,
			registration.entry_module_keys,
			String(registration.unknown_entry_module_keys),
			registration.async_chunk_keys,
			String(registration.unknown_async_chunk_keys),
			registration.modules.map(({ module_key: key, source_sha256: digest }) => [key, digest])
		]);
		sha256Text = (value) => createHash("sha256").update(value).digest("hex");
		STATIC_ROUTE_CALL_NAMES = [
			"route",
			"addRoute",
			"useRoutes",
			"createBrowserRouter",
			"createHashRouter"
		];
		vendorPatterns = [
			{
				name: "webpack",
				patterns: ["__webpack_require__", "webpackChunk"]
			},
			{
				name: "Rspack",
				patterns: ["__webpack_require__.f", "rspackChunk"]
			},
			{
				name: "Vite",
				patterns: ["__vite__", "import.meta.hot"]
			},
			{
				name: "Rollup",
				patterns: ["ROLLUP_FILE_URL", "import.meta.ROLLUP"]
			},
			{
				name: "esbuild",
				patterns: ["__commonJS", "__esm"]
			},
			{
				name: "React",
				patterns: ["React.createElement", "react/jsx-runtime"]
			},
			{
				name: "Vue",
				patterns: ["__VUE__", "createApp("]
			},
			{
				name: "Next.js",
				patterns: ["__NEXT_DATA__", "/_next/"]
			},
			{
				name: "Angular",
				patterns: ["ɵɵdefineComponent"]
			},
			{
				name: "Svelte",
				patterns: ["svelte/internal"]
			}
		];
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptIntrinsicInvocation.js
var unknownArrayIteration, expandJavaScriptInvocationArguments, arrayArguments, invocationArguments, javaScriptGenericInvocationMethod, javaScriptSourceInvocationContext, resolveJavaScriptGenericInvocation, resolveJavaScriptIntrinsicInvocation;
function init_javascriptIntrinsicInvocation() {
	return (init_javascriptIntrinsicInvocation = __esmMin((() => {
		init_javascriptAstValues();
		unknownArrayIteration = () => false;
		expandJavaScriptInvocationArguments = (arguments_, nativeArrayIteration = unknownArrayIteration) => {
			const expanded = [];
			const pending = [...arguments_].reverse();
			while (pending.length > 0) {
				const argument = pending.pop();
				if (argument === undefined) break;
				const array = t.isSpreadElement(argument) ? unwrapJavaScriptExpression(argument.argument).node : undefined;
				if (t.isArrayExpression(array) && nativeArrayIteration(array) && array.elements.every((element) => t.isExpression(element) || t.isSpreadElement(element))) for (let index = array.elements.length - 1; index >= 0; index -= 1) {
					const element = array.elements[index];
					if (element !== null && element !== undefined) pending.push(element);
				}
				else expanded.push(argument);
			}
			return expanded;
		};
		arrayArguments = (node, nativeArrayIteration) => {
			const array = node === undefined ? undefined : unwrapJavaScriptExpression(node).node;
			if (!t.isArrayExpression(array) || array.elements.some((element) => element === null)) return undefined;
			const expanded = expandJavaScriptInvocationArguments(array.elements.filter((element) => element !== null), nativeArrayIteration);
			return expanded.every((element) => t.isExpression(element)) ? expanded.filter((element) => t.isExpression(element)) : undefined;
		};
		invocationArguments = (method, arguments_, nativeArrayIteration) => t.isSpreadElement(arguments_?.[0]) ? undefined : method === "apply" ? arrayArguments(arguments_?.[1], nativeArrayIteration) : arguments_?.slice(1);
		javaScriptGenericInvocationMethod = (callee) => {
			const expression = unwrapJavaScriptExpression(callee).node;
			const method = t.isMemberExpression(expression) || t.isOptionalMemberExpression(expression) ? semanticStaticPropertyKey(expression.property, expression.computed) : undefined;
			return method === "call" || method === "apply" ? method : undefined;
		};
		javaScriptSourceInvocationContext = (node, nativeArrayIteration = unknownArrayIteration) => {
			const callee = unwrapJavaScriptExpression(node.callee).node;
			return {
				receiver: t.isMemberExpression(callee) || t.isOptionalMemberExpression(callee) ? callee.object : undefined,
				arguments: expandJavaScriptInvocationArguments(node.arguments, nativeArrayIteration)
			};
		};
		resolveJavaScriptGenericInvocation = (method, context, nativeArrayIteration = unknownArrayIteration) => !t.isExpression(context.receiver) ? undefined : {
			callable: context.receiver,
			context: {
				receiver: context.arguments?.[0],
				...context.arguments === undefined || t.isSpreadElement(context.arguments[0]) ? { receiverUnknown: true } : {},
				arguments: invocationArguments(method, context.arguments, nativeArrayIteration)
			}
		};
		resolveJavaScriptIntrinsicInvocation = (node, intrinsicPath, boundIntrinsic, intrinsicReadChanged, nativeArrayIteration = unknownArrayIteration) => {
			const visited = new Set();
			let callee = node.callee;
			let arguments_ = expandJavaScriptInvocationArguments(node.arguments, nativeArrayIteration);
			let receiver;
			let explicitReceiver = false;
			for (;;) {
				callee = unwrapJavaScriptExpression(callee).node;
				if (t.isSequenceExpression(callee)) {
					const finalExpression = callee.expressions.at(-1);
					if (finalExpression === undefined) return undefined;
					explicitReceiver = true;
					callee = finalExpression;
					continue;
				}
				if (visited.has(callee)) return undefined;
				visited.add(callee);
				let path = intrinsicPath(callee);
				if (path !== undefined && intrinsicReadChanged(callee, path)) return {
					kind: "opaque",
					path,
					arguments: undefined
				};
				if (path === undefined) {
					if (t.isMemberExpression(callee) || t.isOptionalMemberExpression(callee)) {
						const method = semanticStaticPropertyKey(callee.property, callee.computed);
						if (method === "call" || method === "apply") {
							const bound = boundIntrinsic(callee.object);
							const callablePath = bound?.path ?? intrinsicPath(callee.object);
							if (callablePath !== undefined && intrinsicReadChanged(callee, [...callablePath, method])) return {
								kind: "opaque",
								path: callablePath,
								arguments: undefined
							};
							receiver = arguments_?.[0];
							explicitReceiver = true;
							callee = callee.object;
							arguments_ = invocationArguments(method, arguments_, nativeArrayIteration);
							continue;
						}
					}
					const bound = boundIntrinsic(callee);
					if (bound === undefined) return undefined;
					if (bound.kind === "opaque") return bound;
					path = bound.path;
					receiver = bound.receiver;
					explicitReceiver = true;
					arguments_ = bound.arguments === undefined ? undefined : [...bound.arguments, ...arguments_ ?? []];
				}
				const method = path.length > 3 ? path.at(-1) : undefined;
				if (method === "call" || method === "apply") {
					const callable = explicitReceiver ? receiver : t.isMemberExpression(callee) || t.isOptionalMemberExpression(callee) ? callee.object : undefined;
					const selected = resolveJavaScriptGenericInvocation(method, {
						receiver: callable,
						arguments: arguments_
					}, nativeArrayIteration);
					if (selected === undefined) return {
						kind: "opaque",
						path,
						arguments: undefined
					};
					callee = selected.callable;
					receiver = selected.context.receiver;
					explicitReceiver = true;
					arguments_ = selected.context.arguments;
					continue;
				}
				if (path.join(".") === "intrinsic.Reflect.apply") {
					const callable = arguments_?.[0];
					if (!t.isExpression(callable)) return undefined;
					callee = callable;
					receiver = arguments_?.[1];
					explicitReceiver = true;
					arguments_ = arrayArguments(arguments_?.[2], nativeArrayIteration);
					continue;
				}
				return {
					kind: "known",
					path,
					arguments: arguments_,
					...receiver === undefined ? {} : { receiver }
				};
			}
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticReturnedReferences.js
var createSemanticReturnedReferences, selectObjectTargets, objectTargetIndex;
function init_javascriptSemanticReturnedReferences() {
	return (init_javascriptSemanticReturnedReferences = __esmMin((() => {
		init_javascriptAstValues();
		init_javascriptSemanticCallableResults();
		init_javascriptIntrinsicInvocation();
		init_javascriptSemanticMutationInitializers();
		init_javascriptSemanticReferenceSources();
		init_javascriptSemanticObjectReferences();
		init_javascriptSemanticProjectedSources();
		init_javascriptSemanticResourceLimits();
		init_javascriptSemanticPropertyPaths();
		init_javascriptSemanticAliasSelections();
		init_javascriptSemanticState();
		createSemanticReturnedReferences = (state, consumption = "potential-reference") => {
			const results = new WeakMap();
			const objectTargets = new WeakMap();
			return (callee, invocation) => {
				const existing = results.get(callee);
				if (existing !== undefined && existing.invocation === invocation && existing.iterationUnknown === state.arrayIterationUnknown && existing.ambientWrites === state.ambientWriteEffects.length && existing.dependencies.every(({ binding, writes, escapes }) => binding.memberWrites.length === writes && binding.escapedPaths.length === escapes)) return existing.result;
				const dependencies = new Map();
				const functions = new Set();
				const work = [];
				const projectionDepths = new WeakMap();
				const expanded = new WeakMap();
				let additionalContexts = 0;
				let contextsWidened = false;
				const result = {
					references: [],
					callables: functions,
					precision: "exact"
				};
				const nativeArrayIteration = (array) => semanticKnownArrayIterationAt(array, state);
				const sourceInvocation = invocation === undefined ? undefined : javaScriptSourceInvocationContext(invocation, nativeArrayIteration);
				const sourceGenericInvocation = invocation !== undefined && javaScriptGenericInvocationMethod(invocation.callee) !== undefined;
				const inheritedInvocationChanged = (method) => {
					if (invocation === undefined) return false;
					const inheritedPath = [
						"global",
						"Function",
						"prototype",
						method
					];
					return state.ambientWriteEffects.some((effect) => effect.path.length <= inheritedPath.length && effect.path.every((key, index) => key === null || semanticPropertyPathKeyMatches(key, inheritedPath[index] ?? "")) && semanticEffectTiming(invocation, effect.node, state) !== "after");
				};
				const selections = new SemanticAliasSelections(() => {
					state.valueResourceLimits.add("alias-selections");
					result.precision = "widened";
				});
				const enqueue = (node, path, readAt, capturedSelections, invocationContext) => {
					const source = unwrapJavaScriptExpression(node).node;
					if (contextsWidened) {
						path = undefined;
						capturedSelections = undefined;
						invocationContext = undefined;
					}
					const invocationKey = () => invocationContext === undefined ? null : [
						invocationContext.receiver?.start,
						invocationContext.receiver?.end,
						invocationContext.receiverUnknown,
						invocationContext.arguments?.map((argument) => [argument.start, argument.end])
					];
					let readKey = JSON.stringify([
						readAt?.start ?? -1,
						readAt?.end ?? -1,
						invocationKey()
					]);
					const depths = projectionDepths.get(source) ?? new Map();
					projectionDepths.set(source, depths);
					if (!depths.has(readKey)) {
						depths.set(readKey, path?.length);
					} else {
						const previous = depths.get(readKey);
						if (previous === undefined || previous !== path?.length) {
							if (previous !== undefined) result.precision = "widened";
							depths.set(readKey, undefined);
							path = undefined;
						}
					}
					if (path !== undefined) path = selections.normalize(source, path);
					capturedSelections = path === undefined ? undefined : semanticNormalizeCapturedSelections(capturedSelections, path.length);
					const expansionKey = () => JSON.stringify([
						readKey,
						path ?? null,
						capturedSelections?.map(({ at, depth, ownEnumerable }) => [
							at.start,
							at.end,
							depth,
							ownEnumerable
						])
					]);
					let key = expansionKey();
					const paths = expanded.get(source) ?? new Set();
					if (paths.has(key)) return;
					if (!contextsWidened && (capturedSelections !== undefined || invocationContext !== undefined) && paths.size > 0 && ++additionalContexts > 512) {
						contextsWidened = true;
						state.valueResourceLimits.add("alias-selections");
						result.precision = "widened";
						if (sourceInvocation !== undefined) {
							if (sourceInvocation.receiver !== undefined) enqueue(sourceInvocation.receiver, undefined);
							for (const argument of sourceInvocation.arguments ?? []) if (t.isExpression(argument)) enqueue(argument, undefined);
							else if (t.isSpreadElement(argument)) enqueue(argument.argument, undefined);
						}
					}
					if (contextsWidened) {
						path = undefined;
						capturedSelections = undefined;
						invocationContext = undefined;
						readKey = JSON.stringify([
							readAt?.start ?? -1,
							readAt?.end ?? -1,
							null
						]);
						if (sourceGenericInvocation) result.unresolvedInvocation = true;
						depths.set(readKey, undefined);
						key = expansionKey();
						if (paths.has(key)) return;
					}
					paths.add(key);
					expanded.set(source, paths);
					work.push({
						node: source,
						path,
						...readAt === undefined ? {} : { readAt },
						...capturedSelections === undefined ? {} : { capturedSelections },
						...invocationContext === undefined ? {} : { invocation: invocationContext }
					});
				};
				enqueue(callee, [], undefined, undefined, sourceInvocation);
				while (work.length > 0) {
					const current = work.pop();
					if (current === undefined) break;
					const { node } = current;
					if (current.invocation !== undefined && current.path?.length === 0 && (t.isObjectExpression(node) || t.isArrayExpression(node))) continue;
					const pending = [];
					if (t.isIdentifier(node)) {
						const binding = resolveSemanticBindingState(state, node, node.name);
						if (binding === undefined) {
							if (sourceGenericInvocation && current.path?.length === 0) result.unresolvedInvocation = true;
							continue;
						}
						dependencies.set(binding, {
							writes: binding.memberWrites.length,
							escapes: binding.escapedPaths.length
						});
						if (current.path !== undefined) {
							if (sourceGenericInvocation && current.path.length > 0 && semanticProjectedSourcesAtRead(binding, node, current.path, state, true, invocation !== undefined && current.readAt === unwrapJavaScriptExpression(invocation.callee).node ? invocation : current.readAt ?? node, current.capturedSelections) === undefined) result.unresolvedInvocation = true;
							const selectedSources = semanticProjectedSourcesAtRead(binding, node, current.path, state, false, current.readAt ?? node, current.capturedSelections);
							if (selectedSources !== undefined) {
								for (const source of selectedSources) {
									const capturedSelections = [...semanticShiftCapturedSelections(current.capturedSelections, source.path.length - current.path.length) ?? [], ...source.capturedSelections ?? []];
									pending.push({
										...source,
										...current.path.length === 0 ? {} : { readAt: current.readAt ?? node },
										...capturedSelections.length === 0 ? {} : { capturedSelections }
									});
								}
								for (let index = pending.length - 1; index >= 0; index--) {
									const child = pending[index];
									if (child !== undefined) enqueue(child.node, child.path, child.readAt, child.capturedSelections, child.invocation ?? current.invocation);
								}
								continue;
							}
							result.precision = "widened";
							if (sourceGenericInvocation) result.unresolvedInvocation = true;
						}
						const selected = semanticBindingAtRead(binding, node, state.parentsByNode).binding;
						for (const initializer of [...selected.initializers, ...selected.referenceInitializers]) {
							if (semanticReferenceSourcesInactive(initializer, state)) continue;
							pending.push({
								node: initializer.node,
								path: current.path === undefined ? undefined : [...initializer.projection, ...current.path],
								...current.path?.length === 0 ? {} : { readAt: current.readAt ?? node },
								...current.capturedSelections === undefined ? {} : { capturedSelections: semanticShiftCapturedSelections(current.capturedSelections, initializer.projection.length) }
							});
						}
						if (current.path === undefined) {
							for (const effect of binding.memberWrites) for (const source of effect.assignedSources ?? []) if (!semanticReferenceSourcesInactive(source, state)) pending.push({
								node: source.node,
								path: undefined
							});
						}
					} else if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
						const path = [];
						let receiver = node;
						while (t.isMemberExpression(receiver) || t.isOptionalMemberExpression(receiver)) {
							path.push(semanticStaticPropertyKey(receiver.property, receiver.computed));
							receiver = unwrapJavaScriptExpression(receiver.object).node;
						}
						pending.push({
							...current,
							node: receiver,
							readAt: current.readAt ?? node,
							...current.capturedSelections === undefined ? {} : { capturedSelections: semanticShiftCapturedSelections(current.capturedSelections, path.length) },
							path: current.path === undefined ? undefined : [...path.reverse(), ...current.path]
						});
					} else if (t.isConditionalExpression(node) || t.isLogicalExpression(node)) {
						pending.push({
							...current,
							node: t.isConditionalExpression(node) ? node.consequent : node.left
						}, {
							...current,
							node: t.isConditionalExpression(node) ? node.alternate : node.right
						});
					} else if (t.isSequenceExpression(node)) {
						const last = node.expressions.at(-1);
						if (last !== undefined) pending.push({
							...current,
							node: last
						});
					} else if (t.isFunction(node)) {
						if (current.path === undefined || current.path.length === 0) functions.add(node);
						else if (current.invocation !== undefined && current.path.every((key) => semanticAliasSelectionChoices(key).every((choice) => choice === "call" || choice === "apply"))) {
							const methods = semanticAliasSelectionChoices(current.path.at(-1)).filter((method) => method === "call" || method === "apply");
							for (const method of methods) {
								const selected = resolveJavaScriptGenericInvocation(method, current.invocation, nativeArrayIteration);
								if (selected !== undefined) pending.push({
									node: selected.callable,
									path: [],
									invocation: selected.context
								});
								else if (current.invocation.receiverUnknown) result.unresolvedInvocation = true;
								if (inheritedInvocationChanged(method)) result.unresolvedInvocation = true;
							}
						}
					} else if (t.isObjectExpression(node)) selectObjectTargets(node, current, pending, objectTargets);
					else if (t.isArrayExpression(node)) {
						const [key, ...path] = current.path ?? [];
						if (current.path !== undefined && key !== undefined) {
							for (const choice of semanticAliasSelectionChoices(key)) for (const source of semanticArrayPropertyReferences(node, [choice])) {
								let projection = source.path;
								if (source.capturedSelectionAt !== undefined && !semanticKnownArrayIteration(semanticSelectedReferenceSlot({
									node: source.node,
									projection: []
								}, state, source.capturedSelectionAt)?.value, state)) projection = [null, ...source.path.slice(1)];
								const selectedPath = [...projection, ...path];
								pending.push({
									...current,
									node: source.node,
									path: selectedPath,
									capturedSelections: [...semanticShiftCapturedSelections(current.capturedSelections, selectedPath.length - current.path.length) ?? [], ...source.capturedSelectionAt === undefined ? [] : [{
										at: source.capturedSelectionAt,
										depth: 1
									}]]
								});
							}
							for (let index = pending.length - 1; index >= 0; index--) {
								const child = pending[index];
								if (child !== undefined) enqueue(child.node, child.path, child.readAt, child.capturedSelections, child.invocation ?? current.invocation);
							}
							continue;
						}
						let uncertainOffset = false;
						node.elements.forEach((element, offset) => {
							if (element === null) return;
							if (t.isSpreadElement(element)) {
								uncertainOffset = true;
								pending.push({
									...current,
									node: element.argument,
									path: current.path === undefined ? undefined : [null, ...path],
									capturedSelections: [...current.capturedSelections ?? [], {
										at: element.argument,
										depth: 1
									}]
								});
							} else if (current.path === undefined || key === undefined || uncertainOffset || semanticAliasSelectionChoices(key).some((choice) => semanticPropertyPathKeyMatches(choice, String(offset)))) pending.push({
								...current,
								node: element,
								path: current.path === undefined ? undefined : path,
								capturedSelections: semanticShiftCapturedSelections(current.capturedSelections, -1) ?? []
							});
						});
					} else if (t.isNewExpression(node)) pending.push({
						...current,
						node: node.callee
					});
					else if (t.isClass(node)) {
						const [key, ...path] = current.path ?? [];
						for (const member of node.body.body) {
							if (t.isClassMethod(member)) {
								if ((current.path === undefined || current.path.length === 0) && member.kind === "constructor" || current.path === undefined || key !== undefined && semanticAliasSelectionChoices(key).some((choice) => {
									const name = semanticStaticPropertyKey(member.key, member.computed);
									return name === null || semanticPropertyPathKeyMatches(choice, name);
								})) pending.push({
									...current,
									node: member,
									path: current.path === undefined ? undefined : path,
									capturedSelections: semanticShiftCapturedSelections(current.capturedSelections, -1)
								});
							} else if (t.isClassProperty(member) && member.value !== null && member.value !== undefined && (key !== undefined || current.path === undefined) && (current.path === undefined || key !== undefined && semanticAliasSelectionChoices(key).some((choice) => {
								const name = semanticStaticPropertyKey(member.key, member.computed);
								return name === null || semanticPropertyPathKeyMatches(choice, name);
							}))) pending.push({
								...current,
								node: member.value,
								path: current.path === undefined ? undefined : path,
								capturedSelections: semanticShiftCapturedSelections(current.capturedSelections, -1)
							});
						}
						if (node.superClass !== null && node.superClass !== undefined) pending.push({
							...current,
							node: node.superClass
						});
					}
					for (let index = pending.length - 1; index >= 0; index--) {
						const child = pending[index];
						if (child !== undefined) enqueue(child.node, child.path, child.readAt, child.capturedSelections, child.invocation ?? current.invocation);
					}
				}
				const output = [...functions].flatMap((callable) => {
					const resultKind = semanticCallableResultKind(callable);
					if (consumption !== "potential-reference" && (resultKind === "iterator" || resultKind === "async-iterator" || consumption === "direct-call" && resultKind === "promise")) return [];
					return semanticCallableResultExpressions(callable).flatMap(({ node, delegated, kind }) => node === null || consumption !== "potential-reference" && kind !== "return" ? [] : [{
						node,
						projection: delegated ? [null] : []
					}]);
				});
				result.references = output;
				results.set(callee, {
					result,
					invocation,
					iterationUnknown: state.arrayIterationUnknown,
					ambientWrites: state.ambientWriteEffects.length,
					dependencies: [...dependencies].map(([binding, counts]) => ({
						binding,
						...counts
					}))
				});
				if (result.precision === "widened") state.returnedReferenceWidenings.add(callee);
				return result;
			};
		};
		selectObjectTargets = (node, item, pending, indexes) => {
			const [key, ...path] = item.path ?? [];
			const childPath = item.path === undefined ? undefined : path;
			if (key !== null && typeof key === "object" && "alternatives" in key) {
				for (const choice of semanticAliasSelectionChoices(key)) selectObjectTargets(node, {
					...item,
					path: [choice, ...path]
				}, pending, indexes);
				return;
			}
			if (key !== null && key !== undefined && typeof key !== "object") {
				const index = objectTargetIndex(node, indexes);
				const property = index.propertyByName.get(String(key));
				if (property !== undefined) {
					const unknowns = [];
					for (let unknown = index.trailingUnknownsByProperty.get(property); unknown !== undefined; unknown = unknown.previous) unknowns.push(unknown);
					for (const { node: unknown } of unknowns.reverse()) pending.push({
						...item,
						node: t.isSpreadElement(unknown) ? unknown.argument : t.isObjectProperty(unknown) ? unknown.value : unknown,
						...t.isSpreadElement(unknown) ? {} : { path: childPath },
						capturedSelections: t.isSpreadElement(unknown) ? [...item.capturedSelections ?? [], {
							at: unknown.argument,
							depth: 1,
							ownEnumerable: true
						}] : semanticShiftCapturedSelections(item.capturedSelections, -1) ?? []
					});
					pending.push({
						...item,
						node: t.isObjectProperty(property) ? property.value : property,
						path: childPath,
						capturedSelections: semanticShiftCapturedSelections(item.capturedSelections, -1) ?? []
					});
					return;
				}
			}
			let replaced = false;
			for (const property of [...node.properties].reverse()) {
				if (replaced) break;
				if (t.isSpreadElement(property)) {
					pending.push({
						...item,
						node: property.argument,
						capturedSelections: [...item.capturedSelections ?? [], {
							at: property.argument,
							depth: 1,
							ownEnumerable: true
						}]
					});
					continue;
				}
				const name = semanticStaticPropertyKey(property.key, property.computed);
				if (key !== null && key !== undefined && name !== null && !semanticPropertyPathKeyMatches(key, name)) continue;
				if (t.isObjectProperty(property)) pending.push({
					...item,
					node: property.value,
					path: childPath,
					capturedSelections: semanticShiftCapturedSelections(item.capturedSelections, -1) ?? []
				});
				else pending.push({
					...item,
					node: property,
					path: childPath,
					capturedSelections: semanticShiftCapturedSelections(item.capturedSelections, -1) ?? []
				});
				if (key !== null && key !== undefined && typeof key !== "object" && name === String(key)) replaced = true;
			}
		};
		objectTargetIndex = (node, indexes) => {
			const existing = indexes.get(node);
			if (existing !== undefined) return existing;
			const propertyByName = new Map();
			const trailingUnknownsByProperty = new Map();
			let trailingUnknown;
			for (const property of [...node.properties].reverse()) {
				if (t.isSpreadElement(property)) {
					trailingUnknown = {
						node: property,
						previous: trailingUnknown
					};
					continue;
				}
				const name = semanticStaticPropertyKey(property.key, property.computed);
				if (name === null) {
					trailingUnknown = {
						node: property,
						previous: trailingUnknown
					};
					continue;
				}
				if (propertyByName.has(name)) continue;
				propertyByName.set(name, property);
				if (trailingUnknown !== undefined) trailingUnknownsByProperty.set(property, trailingUnknown);
			}
			const created = {
				propertyByName,
				trailingUnknownsByProperty
			};
			indexes.set(node, created);
			return created;
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticRequireOrigin.js
var possibleCommonJsDelegateWriteStates, observePossibleCommonJsDelegateWrite, hasPossibleCommonJsDelegateWrite, invalidateSemanticRequireDelegateWrites, commonJsDelegateChangedAt, commonJsLoaderAt, semanticRequireLoaderAt, requireLoaderValueAt, semanticFactoryRequireLoaderAt, semanticFactoryLoaderMemberAt, isSemanticCreateRequireBinding, createRequireFactoryCallAt, sourceRelativeCreateRequireBaseAt, hasSemanticCreateRequireFactoryOrigin, isCreateRequireOrigin, assignmentValueSources, selectedRequireSourcesAt, loaderInvocationInterops, loaderInvocationInterop, semanticRequireCallAt, isWrapperRequireInitializerCall, globalProcessReplacements, moduleRequireWrites, moduleReturnedReferences, returnedLoaderReferences, loaderSourceContextKey, inheritLoaderSourceContext, loaderMemberSource, projectedLoaderSources, loaderObjectPropertySources, isCommonJsModuleObject, isCommonJsRequireDelegate, hasCommonJsModuleSource, semanticModuleRequireReceiver, semanticModuleRequireCallAt, writesModuleRequire, semanticOriginalGlobalProcessAt, semanticGlobalProcessOrigin, semanticGlobalProcessPathOrigin, semanticRequireOrigin, semanticRequireExportsIdentity, MUTABLE_BUILTIN_DEFAULTS, semanticMutableBuiltinOrigin;
function init_javascriptSemanticRequireOrigin() {
	return (init_javascriptSemanticRequireOrigin = __esmMin((() => {
		init_javascriptSemanticProjectedSources();
		init_javascriptSemanticTraversal();
		init_javascriptBuiltinResourceMethods();
		init_javascriptSourceParser();
		init_javascriptSemanticState();
		init_javascriptAstValues();
		init_javascriptSemanticPropertyPaths();
		init_javascriptStaticAnalysisHelpers();
		init_javascriptSemanticMutationInitializers();
		init_javascriptModuleInterop();
		init_javascriptSemanticReturnedReferences();
		init_javascriptSemanticIterationSources();
		init_javascriptSemanticReferenceSources();
		init_javascriptSemanticObjectReferences();
		init_javascriptSemanticAliasSelections();
		init_javascriptSemanticResourceLimits();
		init_javascriptSemanticAmbientWrites();
		possibleCommonJsDelegateWriteStates = new WeakSet();
		observePossibleCommonJsDelegateWrite = (node, state) => {
			if (possibleCommonJsDelegateWriteStates.has(state)) return;
			const target = t.isAssignmentExpression(node) ? node.left : t.isUpdateExpression(node) || t.isUnaryExpression(node, { operator: "delete" }) ? node.argument : undefined;
			if (semanticIterationSources(node, state.parentsByNode.get(node) ?? null).some((source) => source.kind === "reference-store")) possibleCommonJsDelegateWriteStates.add(state);
			if ((t.isMemberExpression(target) || t.isOptionalMemberExpression(target)) && ["require", null].includes(semanticStaticPropertyKey(target.property, target.computed))) possibleCommonJsDelegateWriteStates.add(state);
			else if (t.isCallExpression(node) || t.isOptionalCallExpression(node)) possibleCommonJsDelegateWriteStates.add(state);
		};
		hasPossibleCommonJsDelegateWrite = (state) => possibleCommonJsDelegateWriteStates.has(state);
		invalidateSemanticRequireDelegateWrites = (state) => {
			moduleRequireWrites.delete(state);
			moduleReturnedReferences.delete(state);
		};
		commonJsDelegateChangedAt = (node, state) => writesModuleRequire(state).some((write) => semanticEffectTiming(node, write, state) !== "after");
		commonJsLoaderAt = (node, state) => commonJsDelegateChangedAt(node, state) ? "unknown" : "commonjs-loader";
		semanticRequireLoaderAt = (node, state, factoryBindingIds) => {
			const callee = unwrapJavaScriptExpression(node.callee).node;
			const loader = (t.isMemberExpression(callee) || t.isOptionalMemberExpression(callee)) && ["resolve", "main"].includes(semanticStaticPropertyKey(callee.property, callee.computed) ?? "") ? callee.object : callee;
			const selected = selectedRequireSourcesAt(loader, node, state, factoryBindingIds)?.loader;
			return selected !== undefined && selected !== "unknown" ? selected : requireLoaderValueAt(loader, node, state, factoryBindingIds);
		};
		requireLoaderValueAt = (value, node, state, factoryBindingIds) => {
			const callee = unwrapJavaScriptExpression(value).node;
			if (!t.isIdentifier(callee)) return "local";
			const loader = callee;
			const binding = resolveSemanticBindingState(state, loader, loader.name);
			if (binding !== undefined && factoryBindingIds.has(binding.bindingId)) return semanticBindingHasPriorValueWrite(node, binding, state) ? "unknown" : "factory-loader";
			if (binding !== undefined && isSemanticCreateRequireBinding(binding, state)) return "create-require";
			if (loader.name !== "require") return "local";
			if (binding === undefined) {
				if (javaScriptRuntimeContext(state.program) === "module" || semanticResolutionBlocked(state, loader, "require")) return "unknown";
				return (state.ambientBindingWrites.get("require") ?? []).some((write) => semanticEffectTiming(node, write, state) !== "after") ? "unknown" : commonJsLoaderAt(node, state);
			}
			if (binding.hostOrigin === "commonjs-wrapper" && [...binding.declarationKinds].every((kind) => kind === "var")) {
				if (binding.definitions.some(({ kind }) => kind === "function")) return "local";
				return semanticBindingHasPriorValueWrite(node, binding, state) ? "unknown" : commonJsLoaderAt(node, state);
			}
			if ((t.isCallExpression(node) || t.isOptionalCallExpression(node) || t.isNewExpression(node)) && isWrapperRequireInitializerCall(binding, node, state)) return commonJsLoaderAt(node, state);
			const wrapperBinding = commonJsWrapperBindingDeclaration(loader, "require", state);
			if (wrapperBinding !== undefined && !semanticBindingHasPriorValueWrite(node, wrapperBinding, state)) return commonJsLoaderAt(node, state);
			const initializer = semanticStableInitializer(binding, state)?.node;
			if ((binding.kind === "function" || binding.kind === "class") && initializer !== undefined) return "local";
			if (binding.declarationKinds.size === 1 && binding.declarationKinds.has("const") && (t.isFunctionExpression(initializer) || t.isArrowFunctionExpression(initializer))) return "local";
			return "unknown";
		};
		semanticFactoryRequireLoaderAt = (node, state, bindingIds) => {
			const callee = unwrapJavaScriptExpression(node.callee).node;
			if (t.isIdentifier(callee)) return semanticFactoryLoaderMemberAt(node, state, bindingIds, null);
			if ((t.isMemberExpression(callee) || t.isOptionalMemberExpression(callee)) && semanticStaticPropertyKey(callee.property, callee.computed) === "bind") return semanticFactoryLoaderMemberAt(node, state, bindingIds, "bind");
			return undefined;
		};
		semanticFactoryLoaderMemberAt = (node, state, bindingIds, member) => {
			const callee = unwrapJavaScriptExpression(node.callee).node;
			let loader;
			if (member === null) {
				if (t.isIdentifier(callee)) loader = callee;
			} else if ((t.isMemberExpression(callee) || t.isOptionalMemberExpression(callee)) && semanticStaticPropertyKey(callee.property, callee.computed) === member) {
				const root = unwrapJavaScriptExpression(callee.object).node;
				if (t.isIdentifier(root)) loader = root;
			}
			if (loader === undefined) return undefined;
			const binding = resolveSemanticBindingState(state, loader, loader.name);
			if (binding === undefined || !bindingIds.has(binding.bindingId)) return undefined;
			return semanticBindingHasPriorValueWrite(node, binding, state) ? "unknown" : "factory-loader";
		};
		isSemanticCreateRequireBinding = (binding, state) => {
			if (binding.initializers.length !== 1) return false;
			const initializer = semanticStableInitializer(binding, state)?.node;
			return createRequireFactoryCallAt(initializer, state)?.loader === "create-require";
		};
		createRequireFactoryCallAt = (initializer, state, factoryBindingIds = new Set()) => !t.isCallExpression(initializer) ? undefined : selectedRequireSourcesAt(initializer.callee, initializer, state, factoryBindingIds, "factory");
		sourceRelativeCreateRequireBaseAt = (value, state) => {
			if (value === undefined) return undefined;
			if (isUnmodifiedImportMetaUrl(value, state)) return { kind: "source-file" };
			if (!t.isNewExpression(value) || value.arguments.length !== 2) return undefined;
			const callee = unwrapJavaScriptExpression(value.callee).node;
			if (!t.isIdentifier(callee, { name: "URL" }) || !isUnmodifiedGlobalReference(callee, state, "URL") || !isUnmodifiedImportMetaUrl(t.isNode(value.arguments[1]) ? value.arguments[1] : undefined, state)) return undefined;
			const urlPath = staticSourceRelativeUrlPath(value);
			return urlPath === undefined || urlPath.directory || urlPath.path.startsWith("/") ? undefined : {
				kind: "source-relative-file",
				path: urlPath.path
			};
		};
		hasSemanticCreateRequireFactoryOrigin = (initializer, state) => {
			const factory = createRequireFactoryCallAt(initializer, state);
			return factory !== undefined && factory.loader !== "local";
		};
		isCreateRequireOrigin = (origin, selected) => {
			if (!["module", "node:module"].includes(origin.specifier)) return false;
			const path = [...origin.importedPath, ...selected];
			return path.length === 1 && path[0] === "createRequire" || (origin.resolutionMode ?? "import") === "import" && path.length === 2 && path[0] === "default" && path[1] === "createRequire";
		};
		assignmentValueSources = (node) => node.operator === "=" ? [node.right] : [
			"||=",
			"&&=",
			"??="
		].includes(node.operator) ? [node.left, node.right] : [];
		selectedRequireSourcesAt = (root, site, state, factoryBindingIds, target = "loader") => {
			const pending = [{
				node: root,
				path: []
			}];
			const seen = new WeakMap();
			let count = 0;
			let found = false;
			let loaderBinding = false;
			let selectedLoader;
			let unknown = false;
			let local = false;
			let nativeMemberAlternative = false;
			let sourceRelative = true;
			let sourceRelativeBase;
			while (pending.length > 0) {
				const current = pending.pop();
				const node = unwrapJavaScriptExpression(current.node).node;
				const genericMember = current.path.length === 1 && semanticAliasSelectionChoices(current.path[0]).every((key) => key === "call" || key === "apply");
				const nativeGenericMember = target === "loader" && genericMember && t.isIdentifier(node) && requireLoaderValueAt(node, node, state, factoryBindingIds) !== "local";
				const key = JSON.stringify([current.path, loaderSourceContextKey(current)]);
				const paths = seen.get(node) ?? new Set();
				if (paths.has(key)) continue;
				paths.add(key);
				seen.set(node, paths);
				if (++count > 512) {
					state.valueResourceLimits.add("alias-selections");
					return {
						loader: "unknown",
						sourceRelative: false
					};
				}
				if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
					pending.push(...inheritLoaderSourceContext(current, [loaderMemberSource(current, node)]));
				} else if (t.isIdentifier(node)) {
					if (target === "loader" && current.path.length === 0) {
						const captured = requireLoaderValueAt(node, node, state, factoryBindingIds);
						if (captured !== "local" && captured !== "create-require") {
							const invoked = captured === "commonjs-loader" ? commonJsLoaderAt(site, state) : captured;
							found = true;
							unknown ||= invoked === "unknown" || selectedLoader !== undefined && selectedLoader !== invoked;
							selectedLoader ??= invoked;
							continue;
						}
					}
					const binding = resolveSemanticBindingState(state, node, node.name);
					if (binding === undefined) {
						unknown = true;
						continue;
					}
					loaderBinding ||= target === "loader" && binding.initializers.some((source) => hasSemanticCreateRequireFactoryOrigin(source.node, state) || t.isIdentifier(source.node) && requireLoaderValueAt(source.node, source.node, state, factoryBindingIds) !== "local");
					const facts = semanticProjectedSourceFactsAtRead(binding, node, current.path, state, true, current.readAt ?? node, current.capturedSelections);
					if (nativeGenericMember) nativeMemberAlternative ||= facts === undefined || facts.sources.length === 0 || !facts.sources.every(({ node: source }) => {
						const value = unwrapJavaScriptExpression(source).node;
						return t.isFunctionExpression(value) || t.isArrowFunctionExpression(value);
					});
					if (target === "factory" && binding.directOrigins.length > 0) {
						const native = binding.directOrigins.some((origin) => isCreateRequireOrigin(origin, current.path));
						loaderBinding ||= native;
						if (facts?.retainsOrigin) {
							found ||= native;
							local ||= !native;
							if (native) selectedLoader = "create-require";
						}
					}
					if (facts === undefined) {
						unknown = true;
						const retained = semanticBindingAtRead(binding, node, state.parentsByNode).binding;
						pending.push(...inheritLoaderSourceContext(current, projectedLoaderSources(current, [...retained.initializers, ...retained.referenceInitializers].filter((source) => !semanticReferenceSourcesInactive(source, state)).map((source) => ({
							node: source.node,
							path: [...source.projection, ...current.path]
						})))));
					} else {
						unknown ||= facts.sources.length === 0 && !(target === "factory" && facts.retainsOrigin && binding.directOrigins.length > 0);
						pending.push(...inheritLoaderSourceContext(current, projectedLoaderSources(current, facts.sources)));
					}
				} else if (t.isObjectExpression(node) || t.isArrayExpression(node)) {
					if (current.path.length === 0) {
						local = true;
						continue;
					}
					const sources = loaderObjectPropertySources(current, node, state);
					unknown ||= sources.length === 0;
					pending.push(...inheritLoaderSourceContext(current, sources));
				} else if (t.isSequenceExpression(node)) {
					const last = node.expressions.at(-1);
					if (last !== undefined) pending.push({
						...current,
						node: last
					});
				} else if (t.isAssignmentExpression(node)) {
					for (const source of assignmentValueSources(node)) pending.push({
						...current,
						node: source
					});
				} else if (t.isConditionalExpression(node) || t.isLogicalExpression(node)) {
					pending.push({
						...current,
						node: t.isConditionalExpression(node) ? node.consequent : node.left
					}, {
						...current,
						node: t.isConditionalExpression(node) ? node.alternate : node.right
					});
				} else if (t.isCallExpression(node)) {
					const callee = unwrapJavaScriptExpression(node.callee).node;
					if (target === "loader" && current.path.length === 0 && t.isFunction(callee)) {
						if (callee.async || callee.generator) {
							local = true;
							continue;
						}
						const returned = returnedLoaderReferences(state, "direct-call")(node.callee, node);
						unknown ||= returned.unresolvedInvocation === true || !t.isArrowFunctionExpression(callee) || t.isBlockStatement(callee.body);
						pending.push(...inheritLoaderSourceContext(current, returned.references.map((reference) => ({
							node: reference.node,
							path: reference.projection
						}))));
						continue;
					}
					if (target === "factory") {
						const origin = semanticRequireOrigin(node, state)?.origin;
						if (origin !== undefined && isCreateRequireOrigin(origin, current.path)) {
							found = true;
							selectedLoader = "create-require";
						} else unknown = true;
					} else if (current.path.length === 0 || genericMember) {
						const factory = createRequireFactoryCallAt(node, state, factoryBindingIds);
						if (factory !== undefined && factory.loader !== "local") {
							if (genericMember) {
								nativeMemberAlternative = true;
								if (factory.loader === "unknown") {
									loaderBinding = true;
									unknown = true;
								}
							} else {
								found = true;
								unknown ||= factory.loader === "unknown" || selectedLoader !== undefined && selectedLoader !== "create-require";
								selectedLoader ??= "create-require";
								unknown ||= state.conditionallySkippedExpressions.has(node);
								const factoryBase = sourceRelativeCreateRequireBaseAt(node.arguments[0], state);
								if (factoryBase === undefined) sourceRelative = false;
								else if (sourceRelativeBase === undefined) sourceRelativeBase = factoryBase;
								else if (sourceRelativeBase.kind !== factoryBase.kind || sourceRelativeBase.kind === "source-relative-file" && factoryBase.kind === "source-relative-file" && sourceRelativeBase.path !== factoryBase.path) {
									sourceRelative = false;
								}
							}
						} else if (factory?.loader === "local") local = true;
						else unknown = true;
					} else unknown = true;
				} else if (current.path.length === 0 && (t.isFunction(node) || t.isClassExpression(node) || t.isLiteral(node))) {
					local = true;
				} else {
					unknown = true;
				}
			}
			return found || local || loaderBinding && unknown ? {
				loader: unknown && (found || loaderBinding) || local && (found || nativeMemberAlternative) ? "unknown" : found ? selectedLoader ?? "unknown" : "local",
				sourceRelative: found && sourceRelative && !unknown,
				...found && !unknown && sourceRelative && sourceRelativeBase?.kind === "source-relative-file" ? { sourceRelativePath: sourceRelativeBase.path } : {}
			} : undefined;
		};
		loaderInvocationInterops = new WeakMap();
		loaderInvocationInterop = (state) => {
			const prior = loaderInvocationInterops.get(state);
			if (prior?.writes === state.ambientWriteEffects.length) return prior.interop;
			const interop = createSemanticModuleInterop(state);
			for (const effect of state.ambientWriteEffects) if (effect.path[0] === "global") interop.retainWrite(effect.node ?? state.program, ["intrinsic", ...effect.path.slice(1).map((key) => key === null || typeof key === "object" ? null : String(key))]);
			loaderInvocationInterops.set(state, {
				writes: state.ambientWriteEffects.length,
				interop
			});
			return interop;
		};
		semanticRequireCallAt = (node, state, factoryBindingIds) => {
			if (semanticModuleRequireCallAt(node, state)) return {
				operation: "load",
				loader: "unknown",
				arguments: undefined,
				sourceRelative: false
			};
			const callee = unwrapJavaScriptExpression(node.callee).node;
			if ((t.isMemberExpression(callee) || t.isOptionalMemberExpression(callee)) && ["call", "apply"].includes(semanticStaticPropertyKey(callee.property, callee.computed) ?? "") && selectedRequireSourcesAt(callee, node, state, factoryBindingIds)?.loader === "local") return {
				operation: "load",
				loader: "local",
				arguments: undefined,
				sourceRelative: false
			};
			if ((t.isMemberExpression(callee) || t.isOptionalMemberExpression(callee)) && semanticStaticPropertyKey(callee.property, callee.computed) === "resolve") {
				const loader = requireLoaderValueAt(callee.object, node, state, factoryBindingIds);
				if (loader === "unknown") return {
					operation: "load",
					loader,
					arguments: undefined,
					sourceRelative: false
				};
				if (loader === "commonjs-loader" || loader === "create-require") {
					const selected = selectedRequireSourcesAt(callee.object, node, state, factoryBindingIds);
					return {
						operation: "resolve",
						loader: selected?.loader ?? loader,
						arguments: node.arguments,
						sourceRelative: selected?.sourceRelative ?? loader === "commonjs-loader",
						...selected?.sourceRelativePath === undefined ? {} : { sourceRelativePath: selected.sourceRelativePath }
					};
				}
			}
			if (t.isNewExpression(node)) {
				const loader = requireLoaderValueAt(node.callee, node, state, factoryBindingIds);
				const selected = selectedRequireSourcesAt(node.callee, node, state, factoryBindingIds);
				if (selected !== undefined || loader !== "local") return {
					operation: "load",
					loader: selected?.loader ?? loader,
					arguments: node.arguments,
					sourceRelative: selected?.sourceRelative ?? loader !== "create-require",
					...selected?.sourceRelativePath === undefined ? {} : { sourceRelativePath: selected.sourceRelativePath }
				};
			}
			const interop = loaderInvocationInterop(state);
			if (!t.isNewExpression(node)) {
				const invocation = interop.intrinsicInvocation(node, (callee) => {
					const loader = requireLoaderValueAt(callee, node, state, factoryBindingIds);
					if (loader !== "local" && loader !== "create-require") return [
						"require-loader",
						loader,
						"relative"
					];
					const selected = selectedRequireSourcesAt(callee, node, state, factoryBindingIds);
					if (selected !== undefined) return [
						"require-loader",
						selected.loader,
						selected.sourceRelative ? "relative" : "unknown"
					];
					return interop.intrinsicPath(callee);
				});
				if (invocation?.path[0] === "require-loader") {
					const selected = selectedRequireSourcesAt(node.callee, node, state, factoryBindingIds);
					return {
						operation: "load",
						loader: invocation.path[1] === "local" ? "local" : invocation.kind === "opaque" ? "unknown" : invocation.path[1],
						arguments: invocation.arguments,
						sourceRelative: invocation.kind === "known" && invocation.path[2] === "relative",
						...selected?.sourceRelativePath === undefined ? {} : { sourceRelativePath: selected.sourceRelativePath }
					};
				}
			}
			const factory = semanticFactoryRequireLoaderAt(node, state, factoryBindingIds);
			return factory === undefined ? undefined : {
				operation: "load",
				loader: factory,
				arguments: node.arguments.slice(t.isIdentifier(node.callee) ? 0 : 1),
				sourceRelative: true
			};
		};
		isWrapperRequireInitializerCall = (binding, node, state) => {
			const scope = state.scopesById.get(binding.scopeId);
			if (scope?.kind !== "program" || binding.kind !== "variable" || binding.declarationKinds.size !== 1 || !binding.declarationKinds.has("var") || binding.initializers.length !== 1 || binding.initializers[0]?.node !== node) return false;
			const assignment = state.parentsByNode.get(node);
			if (!t.isAssignmentExpression(assignment) || assignment.right !== node || state.conditionallySkippedExpressions.has(node)) return false;
			const statement = state.parentsByNode.get(assignment);
			if (!t.isExpressionStatement(statement)) return false;
			if (state.parentsByNode.get(statement) !== state.program) return false;
			const target = unwrapJavaScriptExpression(assignment.left).node;
			return t.isIdentifier(target, { name: "require" }) && resolveSemanticBindingState(state, target, target.name) === binding;
		};
		globalProcessReplacements = new WeakMap();
		moduleRequireWrites = new WeakMap();
		moduleReturnedReferences = new WeakMap();
		returnedLoaderReferences = (state, mode) => {
			let factories = moduleReturnedReferences.get(state);
			if (factories === undefined) {
				factories = new Map();
				moduleReturnedReferences.set(state, factories);
			}
			let returned = factories.get(mode);
			if (returned === undefined) {
				returned = createSemanticReturnedReferences(state, mode);
				factories.set(mode, returned);
			}
			return returned;
		};
		loaderSourceContextKey = (source) => JSON.stringify([
			source.eligibility,
			source.readAt?.start,
			source.readAt?.end,
			source.capturedSelections?.map(({ at, depth, ownEnumerable }) => [
				at.start,
				at.end,
				depth,
				ownEnumerable
			])
		]);
		inheritLoaderSourceContext = (current, sources) => sources.map((source) => ({
			...current.eligibility ? { eligibility: true } : {},
			...current.readAt === undefined ? {} : { readAt: current.readAt },
			...source,
			capturedSelections: semanticNormalizeCapturedSelections(source.capturedSelections ?? current.capturedSelections, source.path.length)
		}));
		loaderMemberSource = (current, member) => ({
			node: member.object,
			readAt: current.readAt ?? member,
			capturedSelections: semanticShiftCapturedSelections(current.capturedSelections, 1),
			path: [semanticStaticPropertyKey(member.property, member.computed), ...current.path]
		});
		projectedLoaderSources = (current, sources) => sources.map((source) => ({
			...source,
			readAt: current.path.length === 0 ? undefined : current.readAt ?? current.node,
			capturedSelections: [...semanticShiftCapturedSelections(current.capturedSelections, source.path.length - current.path.length) ?? [], ...source.capturedSelections ?? []]
		}));
		loaderObjectPropertySources = (current, object, state) => {
			const [key, ...remaining] = current.path;
			if (key === undefined) return [];
			return semanticAliasSelectionChoices(key).flatMap((choice) => (t.isObjectExpression(object) ? semanticObjectPropertyReferences(object, [choice], state) : semanticArrayPropertyReferences(object, [choice])).filter((source) => !source.inherited || !current.capturedSelections?.some((capture) => capture.depth === 1 && capture.ownEnumerable)).map((source) => ({
				node: source.node,
				path: [...source.path, ...remaining],
				capturedSelections: semanticCapturedSelectionsAfterPropertyRead(current.capturedSelections, source)
			})));
		};
		isCommonJsModuleObject = (node, state, includeUnknown = true) => hasCommonJsModuleSource(node, state, includeUnknown, "module");
		isCommonJsRequireDelegate = (node, state, includeUnknown = false, readAt) => hasCommonJsModuleSource(node, state, includeUnknown, "delegate", readAt);
		hasCommonJsModuleSource = (node, state, includeUnknown, target, readAt) => {
			const pending = [{
				node,
				path: [],
				readAt,
				ancestors: new Set(),
				awaitDepths: []
			}];
			const selections = new SemanticAliasSelections(() => {
				state.valueResourceLimits.add("alias-selections");
			});
			const contexts = new WeakMap();
			const examined = new WeakSet();
			let additionalStates = 0;
			for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
				const value = unwrapJavaScriptExpression(next.node).node;
				const { awaitDepths } = next;
				const byMode = contexts.get(value) ?? new Map();
				const modeKey = JSON.stringify([awaitDepths, loaderSourceContextKey(next)]);
				let context = byMode.get(modeKey);
				if (context === undefined) {
					context = { identities: new Map() };
					byMode.set(modeKey, context);
					contexts.set(value, byMode);
				}
				const path = selections.normalize(context, next.path);
				if (selections.limited) return true;
				const pathKey = JSON.stringify(path);
				let identity = context.identities.get(pathKey);
				if (identity === undefined) {
					if ((byMode.size > 1 || context.identities.size > 0) && ++additionalStates > 512) {
						state.valueResourceLimits.add("alias-selections");
						return true;
					}
					identity = {};
					context.identities.set(pathKey, identity);
				}
				if (next.ancestors.has(identity)) {
					if (includeUnknown) return true;
					continue;
				}
				if (examined.has(identity)) continue;
				examined.add(identity);
				const ancestors = new Set([...next.ancestors, identity]);
				const enqueueAt = (depths, ...sources) => {
					pending.push(...inheritLoaderSourceContext(next, sources).map((source) => ({
						...source,
						ancestors,
						awaitDepths: depths
					})));
				};
				const enqueue = (...sources) => {
					enqueueAt(awaitDepths, ...sources);
				};
				if (t.isAwaitExpression(value)) {
					enqueueAt([...new Set([...awaitDepths, path.length])].sort((left, right) => left - right), {
						node: value.argument,
						path
					});
					continue;
				}
				if (t.isMemberExpression(value) || t.isOptionalMemberExpression(value)) {
					enqueue(loaderMemberSource({
						...next,
						path
					}, value));
					continue;
				}
				if (path.length > 0 && (t.isObjectExpression(value) || t.isArrayExpression(value))) {
					enqueueAt(awaitDepths.filter((depth) => depth !== path.length), ...loaderObjectPropertySources({
						...next,
						path
					}, value, state));
					continue;
				}
				if (t.isConditionalExpression(value) || t.isLogicalExpression(value)) {
					enqueue({
						node: t.isConditionalExpression(value) ? value.consequent : value.left,
						path
					}, {
						node: t.isConditionalExpression(value) ? value.alternate : value.right,
						path
					});
					continue;
				}
				if (t.isSequenceExpression(value)) {
					const last = value.expressions.at(-1);
					if (last !== undefined) enqueue({
						node: last,
						path
					});
					continue;
				}
				if (t.isAssignmentExpression(value)) {
					enqueue(...assignmentValueSources(value).map((node) => ({
						node,
						path
					})));
					continue;
				}
				if (t.isCallExpression(value) || t.isOptionalCallExpression(value) || t.isNewExpression(value)) {
					const mode = awaitDepths.includes(path.length) ? "awaited-call" : "direct-call";
					const returnedResult = returnedLoaderReferences(state, mode)(value.callee, t.isNewExpression(value) ? undefined : value);
					if (returnedResult.unresolvedInvocation) return true;
					enqueue(...returnedResult.references.map((source) => ({
						node: source.node,
						path: [...source.projection, ...path],
						capturedSelections: semanticShiftCapturedSelections(next.capturedSelections, source.projection.length)
					})));
					continue;
				}
				if (!t.isIdentifier(value)) continue;
				const binding = resolveSemanticBindingState(state, value, value.name);
				const processMainModulePath = semanticGlobalProcessOrigin(value, state) !== undefined && path.length === (target === "module" ? 1 : 2) && semanticAliasSelectionChoices(path[0]).some((key) => key === null || semanticPropertyPathKeyMatches(key, "mainModule")) && (target === "module" || semanticAliasSelectionChoices(path[1]).some((key) => key === null || semanticPropertyPathKeyMatches(key, "require")));
				if (processMainModulePath) return true;
				const mainModulePath = value.name === "require" && state.program.sourceType === "script" && path.length === (target === "module" ? 1 : 2) && semanticAliasSelectionChoices(path[0]).some((key) => key === null || semanticPropertyPathKeyMatches(key, "main")) && (target === "module" || semanticAliasSelectionChoices(path[1]).some((key) => key === null || semanticPropertyPathKeyMatches(key, "require")));
				if (mainModulePath && binding === undefined && !semanticResolutionBlocked(state, value, "require")) return true;
				const copyAdmitsModuleDelegate = value.name !== "module" || target !== "delegate" || path.length !== 1 || !next.capturedSelections?.some((capture) => capture.depth === 1 && capture.ownEnumerable && !semanticCommonJsRequireOwnEnumerableAt(capture.at, state));
				if (value.name === "module" && binding === undefined) {
					if (copyAdmitsModuleDelegate && (target === "module" ? path.length === 0 : path.length === 1 && semanticAliasSelectionChoices(path[0]).some((key) => key === null || semanticPropertyPathKeyMatches(key, "require"))) && !semanticResolutionBlocked(state, value, "module")) return true;
					continue;
				}
				if (binding === undefined) continue;
				const read = semanticBindingAtRead(binding, value, state.parentsByNode);
				const retainsMainModule = mainModulePath && commonJsWrapperBindingDeclaration(value, "require", state) !== undefined && !read.hasDefiniteInitializer;
				if (value.name === "module" && copyAdmitsModuleDelegate && (target === "module" ? path.length === 0 : path.length === 1 && semanticAliasSelectionChoices(path[0]).some((key) => key === null || semanticPropertyPathKeyMatches(key, "require"))) && commonJsWrapperBindingDeclaration(value, "module", state) !== undefined && !read.hasDefiniteInitializer) return true;
				let eligibility = next.eligibility;
				const facts = eligibility ? undefined : semanticProjectedSourceFactsAtRead(binding, value, path, state, includeUnknown, next.readAt ?? value, next.capturedSelections);
				if (retainsMainModule && (eligibility || facts?.retainsOrigin)) return true;
				let sources = eligibility ? semanticProjectedSourceEligibilityAtRead(binding, value, path, state, next.readAt ?? value, next.capturedSelections) : facts?.sources;
				if (sources === undefined) {
					if (target !== "delegate") return true;
					sources = semanticProjectedSourceEligibilityAtRead(binding, value, path, state, next.readAt ?? value, next.capturedSelections);
					if (sources === undefined) return true;
					eligibility = true;
				}
				enqueue(...projectedLoaderSources({
					...next,
					node: value,
					path
				}, sources).map((source) => eligibility ? {
					...source,
					eligibility
				} : source));
			}
			return false;
		};
		semanticModuleRequireReceiver = (node) => {
			let callee = unwrapJavaScriptExpression(node.callee).node;
			while ((t.isMemberExpression(callee) || t.isOptionalMemberExpression(callee)) && [
				"bind",
				"call",
				"apply"
			].includes(semanticStaticPropertyKey(callee.property, callee.computed) ?? "")) callee = unwrapJavaScriptExpression(callee.object).node;
			return (t.isMemberExpression(callee) || t.isOptionalMemberExpression(callee)) && semanticStaticPropertyKey(callee.property, callee.computed) === "require" ? callee.object : undefined;
		};
		semanticModuleRequireCallAt = (node, state, includeUnknown = true) => {
			const receiver = semanticModuleRequireReceiver(node);
			if (receiver !== undefined && isCommonJsModuleObject(receiver, state, includeUnknown)) return true;
			let target = unwrapJavaScriptExpression(node.callee).node;
			while ((t.isMemberExpression(target) || t.isOptionalMemberExpression(target)) && [
				"bind",
				"call",
				"apply"
			].includes(semanticStaticPropertyKey(target.property, target.computed) ?? "")) target = unwrapJavaScriptExpression(target.object).node;
			if (isCommonJsRequireDelegate(target, state, includeUnknown, node)) return true;
			if (t.isNewExpression(node)) return false;
			const interop = loaderInvocationInterop(state);
			return interop.intrinsicInvocation(node, (callee) => isCommonJsRequireDelegate(callee, state, false, node) ? ["commonjs-require-delegate"] : interop.intrinsicPath(callee))?.path[0] === "commonjs-require-delegate";
		};
		writesModuleRequire = (state) => {
			const cached = moduleRequireWrites.get(state);
			if (cached !== undefined) return cached;
			moduleRequireWrites.set(state, []);
			const writes = [];
			const interop = createSemanticModuleInterop(state);
			const isModuleObject = (node) => isCommonJsModuleObject(node, state, false);
			traverseJavaScriptValueAst(state.program, state.erasedSyntaxNodes, { enter: (node) => {
				const target = t.isAssignmentExpression(node) ? node.left : t.isUpdateExpression(node) || t.isUnaryExpression(node, { operator: "delete" }) ? node.argument : undefined;
				if (t.isMemberExpression(target) || t.isOptionalMemberExpression(target)) {
					const key = semanticStaticPropertyKey(target.property, target.computed);
					if ((key === "require" || key === null && target.computed) && isModuleObject(target.object)) writes.push(node);
				}
				if (t.isCallExpression(node) || t.isOptionalCallExpression(node)) {
					const invocation = interop.intrinsicInvocation(node);
					const owner = invocation?.path?.length === 3 ? invocation.path[1] : undefined;
					const method = invocation?.path?.at(-1);
					const args = invocation?.arguments;
					if ((owner === "Object" || owner === "Reflect") && method === "defineProperty" && isModuleObject(args?.[0] ?? t.nullLiteral())) {
						const key = interop.staticString(args?.[1]);
						if (key === "require" || key === undefined) writes.push(node);
					} else if (owner === "Object" && method === "defineProperties" && isModuleObject(args?.[0] ?? t.nullLiteral())) {
						const descriptors = args?.[1];
						if (!t.isObjectExpression(descriptors) || descriptors.properties.some((property) => t.isSpreadElement(property) || t.isObjectProperty(property) && semanticStaticPropertyKey(property.key, property.computed) === "require")) writes.push(node);
					} else if (owner === "Object" && method === "assign" && args?.some((arg) => isModuleObject(arg))) {
						const target = args?.[0];
						if (target !== undefined && isModuleObject(target)) {
							const sourceHasRequire = args?.slice(1).some((arg) => t.isObjectExpression(arg) && arg.properties.some((property) => t.isObjectProperty(property) && semanticStaticPropertyKey(property.key, property.computed) === "require"));
							if (sourceHasRequire || args?.slice(1).some((arg) => !t.isObjectExpression(arg))) writes.push(node);
						}
					}
				}
			} });
			moduleRequireWrites.set(state, writes);
			return writes;
		};
		semanticOriginalGlobalProcessAt = (node, state) => {
			let replacements = globalProcessReplacements.get(state);
			if (replacements === undefined) {
				replacements = [...state.ambientWriteEffects.filter(({ path }) => path.length <= 2 && path.every((key, index) => semanticPropertyPathKeyMatches(key, ["global", "process"][index]))).map(({ node: write }) => write), ...state.ambientBindingWrites.get("process") ?? []];
				globalProcessReplacements.set(state, replacements);
			}
			return !replacements.some((write) => !semanticTopLevelEffectFollowsCapture(node, write, state.parentsByNode));
		};
		semanticGlobalProcessOrigin = (node, state) => t.isIdentifier(node, { name: "process" }) && resolveSemanticBindingState(state, node, "process") === undefined && !semanticResolutionBlocked(state, node, "process") && semanticOriginalGlobalProcessAt(node, state) ? {
			specifier: "node:process",
			importedPath: [],
			resolutionMode: "require"
		} : undefined;
		semanticGlobalProcessPathOrigin = (node, state) => {
			const chain = semanticMemberChain(node);
			if (chain === undefined) return undefined;
			const { root: current, members } = chain;
			if (!t.isIdentifier(current) || ![
				"globalThis",
				"global",
				"window",
				"self"
			].includes(current.name) || resolveSemanticBindingState(state, current, current.name) !== undefined || semanticResolutionBlocked(state, current, current.name) || members[0] !== "process" || !semanticOriginalGlobalProcessAt(node, state)) return undefined;
			return {
				specifier: "node:process",
				importedPath: members.slice(1),
				resolutionMode: "require"
			};
		};
		semanticRequireOrigin = (node, state) => {
			const chain = semanticMemberChain(node);
			const current = chain?.root;
			if (chain === undefined || !t.isCallExpression(current) || !t.isIdentifier(current.callee, { name: "require" })) return undefined;
			if (commonJsDelegateChangedAt(current, state)) return undefined;
			const requireBinding = resolveSemanticBindingState(state, current.callee, "require");
			if (requireBinding !== undefined && !isUnmodifiedCommonJsWrapperBinding(current.callee, "require", state) && !isWrapperRequireInitializerCall(requireBinding, current, state) || requireBinding === undefined && (javaScriptRuntimeContext(state.program) === "module" || semanticResolutionBlocked(state, current.callee, "require")) || (state.ambientBindingWrites.get("require") ?? []).some((write) => !semanticTopLevelEffectFollowsCapture(current, write, state.parentsByNode))) return undefined;
			const specifier = stringValue(current.arguments[0]);
			return specifier === undefined ? undefined : {
				origin: {
					specifier,
					importedPath: chain.members,
					resolutionMode: "require"
				},
				call: current
			};
		};
		semanticRequireExportsIdentity = (specifier, path) => {
			const name = specifier.replace(/^node:/u, "");
			if (name === "fs/promises") return {
				specifier: name,
				path
			};
			if ([
				"path",
				"path/posix",
				"path/win32"
			].includes(name)) {
				let selected = name;
				let remaining = path;
				while (remaining.length > 1 && (remaining[0] === "posix" || remaining[0] === "win32")) {
					selected = `path/${remaining[0]}`;
					remaining = remaining.slice(1);
				}
				return {
					specifier: selected,
					path: remaining
				};
			}
			return name === "fs" && path[0] === "promises" && path.length > 1 ? {
				specifier: "fs/promises",
				path: path.slice(1)
			} : {
				specifier: name,
				path
			};
		};
		MUTABLE_BUILTIN_DEFAULTS = new Set([
			...Object.keys(BUILTIN_RESOURCE_METHODS),
			"http",
			"https",
			"child_process",
			"timers",
			"process",
			"path",
			"path/posix",
			"path/win32",
			"url"
		]);
		semanticMutableBuiltinOrigin = (origin, selected = []) => {
			const path = [...origin.importedPath, ...selected];
			if (origin.resolutionMode === "require") return {
				specifier: origin.specifier,
				path
			};
			const specifier = origin.specifier.replace(/^node:/u, "");
			if (!MUTABLE_BUILTIN_DEFAULTS.has(specifier)) return undefined;
			if (path[0] === "default") return {
				specifier,
				path: path.slice(1)
			};
			if (specifier === "process" && (path[0] === "env" || path[0] === "argv")) return {
				specifier,
				path
			};
			return specifier === "fs" && path[0] === "promises" ? {
				specifier,
				path
			} : undefined;
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptModuleInterop.js
var TO_ESM, COPY_PROPS, INTRINSICS, createSemanticModuleInterop, identityFunction, unprojectedInitializer, canonicalRoles, controlBodyOperation;
function init_javascriptModuleInterop() {
	return (init_javascriptModuleInterop = __esmMin((() => {
		init_javascriptSemanticState();
		init_javascriptSemanticRequireOrigin();
		init_javascriptSemanticTraversal();
		init_javascriptElectronMemberWrites();
		init_javascriptIntrinsicInvocation();
		init_javascriptSemanticPropertyPaths();
		init_javascriptAstValues();
		init_javascriptSemanticReferenceSources();
		TO_ESM = parseExpression(`(mod, isNodeMode, target) => (
  target = mod != null ? __create(__getProtoOf(mod)) : {},
  __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default")
    ? __defProp(target, "default", {value: mod, enumerable: true}) : target, mod)
)`);
		COPY_PROPS = parseExpression(`(to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function")
    for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
      key = keys[i];
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: ((k) => from[k]).bind(null, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
  return to;
}`);
		INTRINSICS = {
			__create: ["Object", "create"],
			__getProtoOf: ["Object", "getPrototypeOf"],
			__defProp: ["Object", "defineProperty"],
			__getOwnPropNames: ["Object", "getOwnPropertyNames"],
			__getOwnPropDesc: ["Object", "getOwnPropertyDescriptor"],
			__hasOwnProp: [
				"Object",
				"prototype",
				"hasOwnProperty"
			]
		};
		createSemanticModuleInterop = (state, options) => {
			const nativeArrayIteration = (array) => semanticKnownArrayIterationAt(array, state);
			const helpers = new Map();
			const origins = new Map();
			const calls = new WeakMap();
			const intrinsicBindings = new Map();
			const writes = [];
			const invalidatedBindings = new Map();
			const invalidatedCalls = new WeakMap();
			const opaqueMutationPath = (node) => {
				let current = node;
				while (current !== undefined) {
					if (t.isFunction(current)) return ["opaque-intrinsic", semanticScopeId("function", current)];
					current = state.parentsByNode.get(current);
				}
				return ["intrinsic"];
			};
			const intrinsicPath = options?.intrinsicPath ?? ((node) => {
				let current = node;
				const visited = new Set();
				const pending = [];
				let suffix = [];
				const finish = (path) => {
					for (const binding of pending) intrinsicBindings.set(binding.id, path === undefined ? null : path.slice(0, path.length - binding.suffixLength));
					return path;
				};
				for (;;) {
					const { root, members } = electronMemberPath(current);
					if (members.some((member) => member === null)) return finish(undefined);
					suffix = [...members, ...suffix];
					for (const global of [
						"Object",
						"Function",
						"Reflect"
					]) if (isUnshadowedGlobal(root, state, global)) return finish([
						"intrinsic",
						global,
						...suffix
					]);
					for (const global of [
						"globalThis",
						"global",
						"window",
						"self"
					]) if (isUnshadowedGlobal(root, state, global)) return finish(["intrinsic", ...suffix]);
					if (!t.isIdentifier(root)) return finish(undefined);
					const binding = resolveSemanticBindingState(state, root, root.name);
					const cached = binding === undefined ? undefined : intrinsicBindings.get(binding.bindingId);
					if (cached !== undefined) return finish(cached === null ? undefined : [...cached, ...suffix]);
					const initializer = semanticStableInitializer(binding, state);
					if (binding === undefined || initializer === undefined || initializer.projection.some((segment) => segment === null) || visited.has(binding.bindingId)) return finish(undefined);
					visited.add(binding.bindingId);
					pending.push({
						id: binding.bindingId,
						suffixLength: suffix.length
					});
					suffix = [...initializer.projection.map(String), ...suffix];
					current = initializer.node;
				}
			});
			const capturedIntrinsic = (node) => {
				const path = intrinsicPath(node);
				if (path === undefined) return undefined;
				const visited = new Set();
				let current = node;
				let capturedAt = node;
				let suffixLength = 0;
				for (;;) {
					const { root, members } = electronMemberPath(current);
					suffixLength += members.length;
					if (!t.isIdentifier(root)) return undefined;
					const binding = resolveSemanticBindingState(state, root, root.name);
					if (binding === undefined) return {
						path,
						capturedAt
					};
					const initializer = semanticStableInitializer(binding, state);
					if (initializer === undefined || (initializer.node.end ?? Infinity) >= (root.start ?? -1) || visited.has(binding.bindingId)) return undefined;
					visited.add(binding.bindingId);
					if (suffixLength === 0) capturedAt = initializer.node;
					suffixLength += initializer.projection.length;
					current = initializer.node;
				}
			};
			const staticString = (node) => {
				if (node === undefined) return undefined;
				const visited = new Set();
				let current = node;
				for (;;) {
					const literal = readExactJavaScriptLiteral(current);
					if (literal.found) return typeof literal.value === "string" ? literal.value : undefined;
					const expression = unwrapJavaScriptExpression(current).node;
					if (!t.isIdentifier(expression)) return undefined;
					const binding = resolveSemanticBindingState(state, expression, expression.name);
					const initializer = semanticStableInitializer(binding, state);
					if (binding === undefined || initializer === undefined || initializer.projection.length !== 0 || (initializer.node.end ?? Infinity) >= (expression.start ?? -1) || visited.has(binding.bindingId)) return undefined;
					visited.add(binding.bindingId);
					current = initializer.node;
				}
			};
			const intrinsicReadChanged = (node, path) => {
				const capture = capturedIntrinsic(node)?.capturedAt ?? node;
				const scope = opaqueMutationPath(capture).join(".");
				const method = path.at(-1);
				const invocationMethod = method === "bind" || method === "call" || method === "apply";
				return writes.some((write) => (write.scope === scope || write.scope === "intrinsic") && write.offset < (capture.start ?? -1) && (write.coverage.covers(path) || invocationMethod && write.coverage.covers([
					"intrinsic",
					"Function",
					"prototype",
					method
				])));
			};
			const resolveBoundIntrinsic = (node) => {
				const visited = new Set();
				const argumentGroups = [];
				const bindReads = [];
				let opaqueArguments = false;
				let receiver;
				let current = node;
				for (;;) {
					current = unwrapJavaScriptExpression(current).node;
					if (t.isIdentifier(current)) {
						const binding = resolveSemanticBindingState(state, current, current.name);
						const initializer = semanticStableInitializer(binding, state);
						if (binding === undefined || initializer === undefined || initializer.projection.length !== 0 || (initializer.node.end ?? Infinity) >= (current.start ?? -1) || visited.has(binding.bindingId)) return undefined;
						visited.add(binding.bindingId);
						current = initializer.node;
						continue;
					}
					if (!t.isCallExpression(current)) return undefined;
					const { root, members } = electronMemberPath(current.callee);
					let bindTarget = root;
					let bindingArguments = expandJavaScriptInvocationArguments(current.arguments, nativeArrayIteration);
					let captured = capturedIntrinsic(current.callee);
					let terminal = captured?.path.at(-1) === "bind";
					let path = captured?.path.slice(0, -1);
					if (members.at(-1) === "bind") {
						if (!terminal && members.length !== 1) return undefined;
						bindReads.push(captured?.capturedAt ?? current.callee);
					} else {
						const invocation = resolveJavaScriptIntrinsicInvocation(current, intrinsicPath, boundIntrinsic, intrinsicReadChanged, nativeArrayIteration);
						if (invocation?.kind !== "known" || invocation.path.join(".") !== "intrinsic.Function.prototype.bind" || invocation.receiver === undefined) return undefined;
						bindTarget = invocation.receiver;
						bindingArguments = invocation.arguments;
						captured = capturedIntrinsic(bindTarget);
						terminal = captured !== undefined;
						path = captured?.path;
					}
					receiver = bindingArguments?.[0];
					const ownArguments = bindingArguments?.slice(1) ?? [];
					opaqueArguments ||= bindingArguments === undefined || t.isSpreadElement(receiver);
					opaqueArguments ||= ownArguments.some((argument) => t.isSpreadElement(argument));
					argumentGroups.push(ownArguments);
					if (!terminal || path === undefined) {
						current = bindTarget;
						continue;
					}
					const boundPath = [...path, "bind"];
					const functionBind = [
						"intrinsic",
						"Function",
						"prototype",
						"bind"
					];
					opaqueArguments ||= bindReads.some((capture) => {
						const scope = opaqueMutationPath(capture).join(".");
						return writes.some((write) => (write.scope === scope || write.scope === "intrinsic") && write.offset < (capture.start ?? -1) && (write.coverage.covers(boundPath) || write.coverage.covers(functionBind)));
					});
					return {
						kind: opaqueArguments ? "opaque" : "known",
						path,
						...receiver === undefined ? {} : { receiver },
						arguments: opaqueArguments ? undefined : argumentGroups.toReversed().flat()
					};
				}
			};
			const activeBoundValues = new WeakSet();
			const boundIntrinsic = (node) => {
				if (activeBoundValues.has(node)) return undefined;
				activeBoundValues.add(node);
				try {
					return resolveBoundIntrinsic(node);
				} finally {
					activeBoundValues.delete(node);
				}
			};
			const isFreshObject = (node) => {
				const visited = new Set();
				let current = node;
				for (;;) {
					current = unwrapJavaScriptExpression(current).node;
					if (t.isObjectExpression(current) || t.isArrayExpression(current) || t.isFunction(current) || t.isClass(current) && !current.decorators?.length || t.isRegExpLiteral(current)) return true;
					if (!t.isIdentifier(current)) return false;
					const binding = resolveSemanticBindingState(state, current, current.name);
					const initializer = unprojectedInitializer(binding, state);
					if (binding === undefined || initializer === undefined || !t.isFunctionDeclaration(initializer) && (initializer.end ?? Infinity) >= (current.start ?? -1) || visited.has(binding.bindingId)) return false;
					visited.add(binding.bindingId);
					current = initializer;
				}
			};
			const helperProof = (binding) => {
				const cached = helpers.get(binding.bindingId);
				if (cached !== undefined) return cached ?? undefined;
				helpers.set(binding.bindingId, null);
				if (state.scopesById.get(binding.scopeId)?.kind !== "program") return undefined;
				const wrapper = unprojectedInitializer(binding, state);
				if (wrapper === undefined) return undefined;
				if (identityFunction(wrapper, state)) {
					const proof = {
						dependencies: [],
						readyAfter: t.isFunctionDeclaration(wrapper) ? -1 : wrapper.end ?? Infinity,
						identity: true
					};
					helpers.set(binding.bindingId, proof);
					return proof;
				}
				const wrapperRoles = canonicalRoles(wrapper, TO_ESM, state);
				const copyBinding = wrapperRoles?.get("__copyProps");
				const copy = unprojectedInitializer(copyBinding, state);
				const copyRoles = copy === undefined ? undefined : canonicalRoles(copy, COPY_PROPS, state);
				if (wrapperRoles === undefined || copyRoles === undefined || copy === undefined) return undefined;
				const dependencies = [];
				let readyAfter = Math.max(wrapper.end ?? Infinity, copy.end ?? Infinity);
				for (const roles of [wrapperRoles, copyRoles]) for (const [role, dependency] of roles) {
					const expected = INTRINSICS[role];
					if (expected === undefined) continue;
					const initializer = unprojectedInitializer(dependency, state);
					const captured = initializer === undefined ? undefined : capturedIntrinsic(initializer);
					if (initializer === undefined || captured === undefined || JSON.stringify(captured.path) !== JSON.stringify(["intrinsic", ...expected])) return undefined;
					readyAfter = Math.max(readyAfter, initializer.end ?? Infinity);
					dependencies.push(captured);
					if (role === "__hasOwnProp") dependencies.push({ path: [...captured.path, "call"] });
				}
				dependencies.push({ path: [
					"intrinsic",
					"Function",
					"prototype",
					"bind"
				] }, { path: [
					"intrinsic",
					"Function",
					"prototype",
					"call"
				] });
				const proof = {
					dependencies,
					identity: false,
					readyAfter
				};
				helpers.set(binding.bindingId, proof);
				return proof;
			};
			const provenCall = (node) => {
				if (!t.isCallExpression(node) || !t.isIdentifier(node.callee)) return undefined;
				const helper = resolveSemanticBindingState(state, node.callee, node.callee.name);
				const proof = helper === undefined ? undefined : helperProof(helper);
				const input = node.arguments[0];
				const mode = node.arguments[1];
				const literalMode = mode === undefined ? {
					found: true,
					value: false
				} : t.isExpression(mode) ? readExactJavaScriptLiteral(mode) : { found: false };
				if (proof === undefined || proof.readyAfter >= (node.start ?? -1) || !t.isExpression(input) || node.arguments.length > 2 || !literalMode.found) return undefined;
				return {
					input,
					defaultIsModule: !proof.identity && Boolean(literalMode.value),
					dependencies: proof.dependencies.map((dependency) => ({
						...dependency,
						capturedAt: dependency.capturedAt ?? node
					}))
				};
			};
			const callOrigin = (node) => {
				const cached = calls.get(node);
				if (cached !== undefined) return cached;
				const { root, members } = electronMemberPath(node);
				if (!members.every((member) => member !== null)) return undefined;
				const converted = provenCall(root);
				const required = converted === undefined ? undefined : semanticRequireOrigin(converted.input, state)?.origin;
				if (converted === undefined || required === undefined || required.importedPath.length !== 0 || members[0] === "default" && !converted.defaultIsModule) return undefined;
				const result = {
					origin: {
						...required,
						importedPath: members
					},
					dependencies: converted.dependencies,
					defaultIsModule: converted.defaultIsModule
				};
				calls.set(node, result);
				return result;
			};
			const origin = (binding) => {
				const single = semanticStableInitializer(binding, state);
				if (single !== undefined) {
					if (!single.projection.every((key) => typeof key === "string")) return undefined;
					const converted = callOrigin(single.node);
					if (converted?.origin.importedPath.length === 0 && single.projection[0] === "default" && !converted.defaultIsModule) return undefined;
					const result = converted === undefined ? undefined : {
						...converted,
						origin: {
							...converted.origin,
							importedPath: [...converted.origin.importedPath, ...single.projection]
						}
					};
					if (result !== undefined) origins.set(binding.bindingId, result);
					return result;
				}
				const [initial, converted] = binding.initializers;
				if (binding.definitions.length !== 2 || binding.definitions[0]?.kind !== "variable" || binding.definitions[1]?.kind !== "assignment" || binding.initializers.length !== 2 || initial === undefined || converted === undefined || initial.projection.length !== 0 || converted.projection.length !== 0 || state.conditionallySkippedExpressions.has(initial.node)) return undefined;
				const call = converted.node;
				const assignment = state.parentsByNode.get(call);
				const statement = assignment === undefined ? undefined : state.parentsByNode.get(assignment);
				const declaration = state.parentsByNode.get(initial.node);
				const declarationStatement = declaration === undefined ? undefined : state.parentsByNode.get(declaration);
				if (!t.isCallExpression(call) || !t.isIdentifier(call.callee) || !t.isAssignmentExpression(assignment, { operator: "=" }) || assignment.right !== call || !t.isIdentifier(assignment.left, { name: binding.name }) || !t.isExpressionStatement(statement) || !t.isVariableDeclarator(declaration) || !t.isVariableDeclaration(declarationStatement) || state.parentsByNode.get(statement) !== state.parentsByNode.get(declarationStatement) || (initial.node.start ?? Infinity) >= (call.start ?? -1)) return undefined;
				const convertedCall = provenCall(call);
				const input = convertedCall?.input;
				if (!t.isIdentifier(input) || resolveSemanticBindingState(state, input, input.name) !== binding) return undefined;
				const required = semanticRequireOrigin(initial.node, state)?.origin;
				if (required === undefined || required.importedPath.length !== 0) return undefined;
				if (convertedCall === undefined) return undefined;
				const result = {
					origin: required,
					dependencies: convertedCall.dependencies,
					defaultIsModule: convertedCall.defaultIsModule
				};
				origins.set(binding.bindingId, result);
				return result;
			};
			const invalidatedOrigin = (record) => record?.dependencies.some(({ path, capturedAt }) => {
				if (capturedAt === undefined) return true;
				const scope = opaqueMutationPath(capturedAt).join(".");
				return writes.some((write) => (write.scope === scope || write.scope === "intrinsic") && write.offset < (capturedAt.start ?? -1) && write.coverage.covers(path));
			}) ?? false;
			return {
				origin,
				callOrigin,
				intrinsicPath,
				intrinsicInvocation: (node, callablePath = intrinsicPath) => resolveJavaScriptIntrinsicInvocation(node, callablePath, boundIntrinsic, intrinsicReadChanged, nativeArrayIteration),
				boundIntrinsic,
				staticString,
				isFreshObject,
				opaqueMutationPath,
				retainWrite: (node, path) => {
					const coverage = new SemanticPropertyPathCoverage();
					coverage.retain(path[0] === "opaque-intrinsic" ? ["intrinsic"] : path);
					writes.push({
						scope: opaqueMutationPath(node).join("."),
						offset: node.start ?? Infinity,
						coverage
					});
				},
				invalidated: (binding) => {
					const cached = invalidatedBindings.get(binding.bindingId);
					if (cached !== undefined) return cached;
					const result = invalidatedOrigin(origins.get(binding.bindingId));
					invalidatedBindings.set(binding.bindingId, result);
					return result;
				},
				invalidatedCall: (node) => {
					const cached = invalidatedCalls.get(node);
					if (cached !== undefined) return cached;
					const result = invalidatedOrigin(calls.get(node));
					invalidatedCalls.set(node, result);
					return result;
				}
			};
		};
		identityFunction = (node, state) => {
			if (!t.isFunction(node) || node.async || node.generator || runtimeFunctionParameters(node).length !== 1) return false;
			const parameter = runtimeFunctionParameters(node)[0];
			const result = t.isBlockStatement(node.body) ? node.body.body.length === 1 && t.isReturnStatement(node.body.body[0]) ? node.body.body[0].argument : undefined : node.body;
			return t.isIdentifier(parameter) && t.isIdentifier(result) && resolveSemanticBindingState(state, parameter, parameter.name) !== undefined && resolveSemanticBindingState(state, parameter, parameter.name) === resolveSemanticBindingState(state, result, result.name);
		};
		unprojectedInitializer = (binding, state) => {
			const initializer = semanticStableInitializer(binding, state);
			return initializer?.projection.length === 0 ? initializer.node : undefined;
		};
		canonicalRoles = (actual, pattern, state) => {
			const roles = new Map();
			const used = new Map();
			const pending = [{
				actual,
				pattern,
				parent: null
			}];
			while (pending.length !== 0) {
				const pair = pending.pop();
				if (pair === undefined) return undefined;
				const { parent } = pair;
				const controlBody = t.isIfStatement(parent) && (parent.consequent === pair.pattern || parent.alternate === pair.pattern) || t.isForStatement(parent) && parent.body === pair.pattern;
				const node = controlBody ? controlBodyOperation(pair.actual) : pair.actual;
				const expected = controlBody ? controlBodyOperation(pair.pattern) : pair.pattern;
				if (node.type !== expected.type) return undefined;
				const literalKey = parent !== null && (t.isMemberExpression(parent) && !parent.computed && parent.property === expected || t.isObjectProperty(parent) && !parent.computed && parent.key === expected);
				if (t.isIdentifier(expected) && t.isIdentifier(node) && !literalKey) {
					const binding = resolveSemanticBindingState(state, node, node.name);
					if (binding === undefined || roles.has(expected.name) && roles.get(expected.name) !== binding || used.has(binding.bindingId) && used.get(binding.bindingId) !== expected.name) return undefined;
					roles.set(expected.name, binding);
					used.set(binding.bindingId, expected.name);
				}
				const visitorKeys = javaScriptAstChildKeys(expected);
				for (const [key, field] of Object.entries(t.NODE_FIELDS[expected.type] ?? {})) {
					if (visitorKeys.includes(key) || t.isIdentifier(expected) && key === "name" && !literalKey) continue;
					const fallback = Reflect.get(field, "default");
					if (JSON.stringify(Reflect.get(node, key) ?? fallback) !== JSON.stringify(Reflect.get(expected, key) ?? fallback)) return undefined;
				}
				const children = childNodes(node), expectedChildren = childNodes(expected);
				if (children.length !== expectedChildren.length) return undefined;
				for (const [index, child] of children.entries()) {
					const expectedChild = expectedChildren[index];
					if (expectedChild !== undefined) pending.push({
						actual: child,
						pattern: expectedChild,
						parent: expected
					});
				}
			}
			return roles;
		};
		controlBodyOperation = (node) => {
			while (t.isBlockStatement(node) && node.directives.length === 0 && node.body.length === 1) {
				const statement = node.body[0];
				if (statement === undefined) break;
				node = statement;
			}
			return node;
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticAmbientWrites.js
/**
* Index source-local writes through ambient identities and stable aliases.
* The shared invocation owner resolves intrinsic aliases, bind/call/apply and
* literal argument spreads. Runtime reachability and arbitrary call effects
* remain unevaluated; a visible possible write is sufficient.
*/
function* indexJavaScriptAmbientWritesSteps(program, state, observeOpaqueInvocation, observeWriteSite) {
	const ambientReads = createAmbientPathResolver(state, false);
	const browserReceiverMethods = new Set();
	const storedSites = new WeakSet();
	const storedReferences = [];
	const writes = [];
	const targets = [];
	const escapes = [];
	const stores = new WeakMap();
	const interop = createSemanticModuleInterop(state, { intrinsicPath: (node) => {
		const [path] = ambientReads(node).paths;
		return path?.[0] === "global" && path.every((key) => key !== null) ? ["intrinsic", ...path.slice(1)] : undefined;
	} });
	const ambientWrites = createAmbientPathResolver(state, true, {
		stores,
		freshObject: interop.isFreshObject,
		prototypeTarget: (node) => {
			if (!t.isCallExpression(node) && !t.isOptionalCallExpression(node)) return undefined;
			const invocation = interop.intrinsicInvocation(node);
			if (invocation?.kind !== "known" || invocation.path.length !== 3 || !["Object", "Reflect"].includes(invocation.path[1] ?? "") || invocation.path[2] !== "getPrototypeOf") return undefined;
			const target = invocation.arguments?.[0];
			return t.isNode(target) && !t.isSpreadElement(target) ? target : undefined;
		}
	});
	yield* collectJavaScriptIdentityWritesSteps(program, state.erasedSyntaxNodes, (root, kind, writeSite) => {
		if (kind === "opaque-call") return [];
		observeWriteSite?.(writeSite);
		if (kind === "binding") return t.isIdentifier(root) && isUnshadowedGlobal(root, state, root.name) ? [["global", root.name]] : [];
		if (!storedSites.has(writeSite)) {
			storedSites.add(writeSite);
			for (const source of semanticIterationSources(writeSite, state.parentsByNode.get(writeSite) ?? null)) {
				if (source.kind === "reference-store") storedReferences.push(source);
			}
		}
		const id = targets.push({
			node: root,
			capture: writeSite
		}) - 1;
		return [["pending-target", String(id)]];
	}, interop.intrinsicInvocation, interop.staticString, interop.isFreshObject, (node, path) => {
		writes.push({
			node,
			path
		});
	}, (node, invocation) => {
		observeOpaqueInvocation?.(node);
		const retainEscape = (target, browserReceiver = false) => {
			escapes.push({
				target,
				node,
				browserReceiver
			});
		};
		for (const argument of t.isTaggedTemplateExpression(node) ? node.quasi.expressions : node.arguments) if (t.isNode(argument)) retainEscape(t.isSpreadElement(argument) ? argument.argument : argument);
		const callee = unwrapJavaScriptExpression(t.isTaggedTemplateExpression(node) ? node.tag : node.callee).node;
		const browserMethod = invocation?.kind === "known" && invocation.path.length === 2 && ["open", "fetch"].includes(invocation.path[1] ?? "") ? invocation.path[1] : undefined;
		if (!t.isNewExpression(node) && (t.isMemberExpression(callee) || t.isOptionalMemberExpression(callee)) && !(invocation?.kind === "known" && ["Object", "Reflect"].includes(invocation.path[1] ?? ""))) {
			if (browserMethod !== undefined) browserReceiverMethods.add(browserMethod);
			retainEscape(callee.object, browserMethod !== undefined);
		}
	});
	const pendingStores = new Set(storedReferences);
	const dependents = new WeakMap();
	while (pendingStores.size > 0) {
		const source = pendingStores.values().next().value;
		if (source === undefined) break;
		pendingStores.delete(source);
		if (source.target === undefined) continue;
		const identities = new Map();
		ambientWrites(source.target, source.mutation, false, [], (node, path) => {
			const users = dependents.get(node) ?? new Set();
			users.add(source);
			dependents.set(node, users);
			identities.set(node, identities.has(node) ? joinAmbientProjection(identities.get(node), path) : path);
		});
		for (const [node, path] of identities) {
			const entries = stores.get(node) ?? new Map();
			const previous = entries.get(source);
			const joined = entries.has(source) ? joinAmbientProjection(previous, path) : path;
			if (entries.has(source) && (previous === undefined || joined !== undefined && previous.every((key, index) => key === joined[index]))) continue;
			entries.set(source, joined);
			stores.set(node, entries);
			for (const dependent of dependents.get(node) ?? []) pendingStores.add(dependent);
		}
		yield;
	}
	for (const source of storedReferences) {
		if (source.target === undefined) continue;
		const receiver = ambientWrites(source.target.object, source.mutation);
		if (receiver.ownership !== "local") {
			state.escapingReferenceStores.add(source.target);
			escapes.push({
				node: source.mutation,
				target: source.node,
				browserReceiver: false,
				projection: source.projection.map((key) => key === null || typeof key === "object" ? null : String(key))
			});
		}
	}
	for (const { node, path } of writes) {
		const target = path[0] === "pending-target" ? targets[Number(path[1])] : undefined;
		const paths = target === undefined ? [path] : ambientWrites(target.node, target.capture).paths.map((identity) => [...identity, ...path.slice(2)]);
		for (const resolved of paths) {
			retainSemanticAmbientEffect(state, "write", resolved, node);
		}
	}
	for (const { node, target, browserReceiver, projection } of escapes) {
		const resolved = ambientWrites(target, node, true, projection);
		if (browserReceiver && resolved.ownership === "ambient" && resolved.paths.length > 0 && resolved.paths.every((path) => path.length === 1 && path[0] === "global")) state.retainedGlobalCallReceivers.add(target);
		for (const path of resolved.paths) if (!(browserReceiver && path.length === 1 && path[0] === "global")) {
			retainSemanticAmbientEffect(state, "escape", path, node);
		}
	}
	if ([...browserReceiverMethods].some((method) => state.ambientWrites.covers(["global", method]))) state.ambientEscapes.retain(["global", null]);
}
var GLOBAL_OBJECT_NAMES, globalObjectName, canonicalAmbientPath, retainedAmbientEffects, retainSemanticAmbientEffect, joinAmbientProjection, createAmbientPathResolver, isUnmodifiedGlobalReference, isUnmodifiedImportMetaUrl;
function init_javascriptSemanticAmbientWrites() {
	return (init_javascriptSemanticAmbientWrites = __esmMin((() => {
		init_javascriptAstValues();
		init_javascriptElectronMemberWrites();
		init_javascriptModuleInterop();
		init_javascriptSemanticState();
		init_javascriptStaticAnalysisHelpers();
		init_javascriptSemanticMutationInitializers();
		init_javascriptSemanticIterationSources();
		init_javascriptSemanticPropertyPaths();
		init_javascriptSemanticReturnedReferences();
		init_javascriptSemanticReferenceSources();
		GLOBAL_OBJECT_NAMES = [
			"globalThis",
			"global",
			"window",
			"self"
		];
		globalObjectName = (node, state) => GLOBAL_OBJECT_NAMES.find((name) => isUnshadowedGlobal(node, state, name));
		canonicalAmbientPath = (path) => {
			if (path[0] !== "global") return path;
			let firstProperty = 1;
			while (GLOBAL_OBJECT_NAMES.includes(path[firstProperty] ?? "")) firstProperty += 1;
			return ["global", ...path.slice(firstProperty)];
		};
		retainedAmbientEffects = new WeakMap();
		retainSemanticAmbientEffect = (state, kind, path, node) => {
			const selected = kind === "escape" ? [...path, null] : path;
			const byNode = retainedAmbientEffects.get(state) ?? new Map();
			const keys = byNode.get(node) ?? new Set();
			const key = JSON.stringify([kind, selected]);
			if (keys.has(key)) return false;
			keys.add(key);
			byNode.set(node, keys);
			retainedAmbientEffects.set(state, byNode);
			if (kind === "write") {
				state.ambientWrites.retain(selected);
				state.ambientWriteEffects.push({
					path: selected,
					node
				});
			} else {
				state.ambientEscapes.retain(selected);
				state.ambientEscapeEffects.push({
					path: selected,
					node
				});
			}
			return true;
		};
		joinAmbientProjection = (left, right) => left === undefined || right === undefined || left.length !== right.length ? undefined : left.map((key, index) => key === right[index] ? key : null);
		createAmbientPathResolver = (state, possibleWrites, facts) => {
			const cached = new WeakMap();
			const returnedReferences = createSemanticReturnedReferences(state);
			return (node, capture, escapedContents = false, projection = [], localIdentity) => {
				const prior = possibleWrites ? undefined : cached.get(node);
				if (prior !== undefined) return prior;
				const result = new Map();
				let hasLocalIdentity = false;
				const unknownReasons = new Set();
				const pending = [{
					node,
					suffix: projection
				}];
				const expanded = new WeakMap();
				const retain = (path) => {
					let canonical = canonicalAmbientPath(path);
					for (;;) {
						result.set(JSON.stringify(canonical), canonical);
						if (possibleWrites && canonical[0] === "global" && canonical[2] === "prototype" && canonical[3] === "constructor") {
							canonical = [
								"global",
								canonical[1] ?? null,
								...canonical.slice(4)
							];
							continue;
						}
						if (!possibleWrites || canonical[0] !== "global" || canonical[1] !== null) break;
						canonical = canonicalAmbientPath(["global", ...canonical.slice(2)]);
					}
				};
				while (pending.length > 0) {
					const current = pending.pop();
					if (current === undefined) break;
					const queuedBefore = pending.length;
					const pathsBefore = result.size;
					let resolvedIdentity = false;
					try {
						const { root, members } = electronMemberPath(current.node);
						let suffix = current.suffix === undefined ? undefined : [...members, ...current.suffix];
						if (expanded.has(root)) {
							const previous = expanded.get(root);
							if (previous === undefined) {
								resolvedIdentity = true;
								continue;
							}
							if (suffix !== undefined && previous.length === suffix.length) {
								const joined = joinSemanticPropertyPaths(previous, suffix);
								if (joined === previous) {
									resolvedIdentity = true;
									continue;
								}
								suffix = joined;
							} else suffix = undefined;
							if (!possibleWrites) {
								const unresolved = {
									paths: [],
									ownership: "unknown",
									unknownReasons: ["widened-projection"]
								};
								cached.set(node, unresolved);
								return unresolved;
							}
						}
						expanded.set(root, suffix);
						if (suffix === undefined || suffix.includes(null)) unknownReasons.add("widened-projection");
						if (suffix === undefined && !possibleWrites) continue;
						const continueWith = (node, path = suffix) => pending.push({
							node,
							suffix: path,
							...current.readsAtSelf && { readsAtSelf: true }
						});
						const continueReturned = (callee, path) => {
							const returned = returnedReferences(callee);
							unknownReasons.add("unresolved-call");
							for (const source of returned.references) continueWith(source.node, path === undefined ? undefined : [...source.projection.map((key) => key === null || typeof key === "object" ? null : String(key)), ...path]);
						};
						if (!t.isIdentifier(root) && facts?.freshObject(root)) {
							localIdentity?.(root, suffix);
							if (suffix?.length === 0) {
								hasLocalIdentity = true;
								resolvedIdentity = true;
							}
							for (const [source, path] of facts?.stores.get(root) ?? []) {
								const selected = suffix === undefined || path === undefined || path.every((key, index) => index >= suffix.length || key === null || suffix[index] === null || key === suffix[index]);
								if (!selected || suffix !== undefined && path !== undefined && suffix.length < path.length && !escapedContents) continue;
								const remaining = suffix === undefined || path === undefined ? undefined : suffix.slice(path.length);
								pending.push({
									node: source.node,
									readsAtSelf: true,
									suffix: remaining === undefined ? undefined : [...source.projection.map((key) => key === null || typeof key === "object" ? null : String(key)), ...remaining]
								});
							}
						}
						if (t.isMetaProperty(root) && root.meta.name === "import" && root.property.name === "meta") {
							retain(["import-meta", ...suffix ?? []]);
							resolvedIdentity = true;
							continue;
						}
						if (t.isIdentifier(root)) {
							if (isUnshadowedGlobal(root, state, "module")) {
								retain(["commonjs-module", ...suffix ?? []]);
								resolvedIdentity = true;
								continue;
							}
							if (globalObjectName(root, state) !== undefined) {
								retain(["global", ...suffix ?? []]);
								resolvedIdentity = true;
								continue;
							}
							if (isUnshadowedGlobal(root, state, root.name)) {
								retain([
									"global",
									root.name,
									...suffix ?? []
								]);
								resolvedIdentity = true;
								continue;
							}
							const binding = resolveSemanticBindingState(state, root, root.name);
							if (binding === undefined) continue;
							const stable = possibleWrites ? undefined : semanticStableInitializer(binding, state);
							const readAt = current.readsAtSelf ? root : capture;
							const atRead = possibleWrites && readAt !== undefined ? semanticBindingAtRead(binding, readAt, state.parentsByNode) : undefined;
							const selected = atRead?.binding ?? binding;
							if (possibleWrites && atRead?.hasDefiniteInitializer === false) unknownReasons.add("unresolved-value");
							const initializers = possibleWrites ? [...selected.initializers, ...selected.referenceInitializers] : stable === undefined ? [] : [stable];
							for (const initializer of initializers) {
								if (semanticReferenceSourcesInactive(initializer, state)) continue;
								const path = semanticCopiedReferencePath(initializer, suffix ?? [null], escapedContents ? "escape" : "identity");
								if (path === null) continue;
								pending.push({
									node: initializer.node,
									readsAtSelf: true,
									suffix: suffix === undefined || semanticReferenceIterationUnknown(initializer, state) ? undefined : path.map((key) => key === null || typeof key === "object" ? null : String(key))
								});
							}
							continue;
						}
						if (possibleWrites && t.isNewExpression(root) && (suffix?.[0] === "__proto__" || suffix?.[0] === "constructor")) {
							continueWith(root.callee, suffix[0] === "__proto__" ? ["prototype", ...suffix.slice(1)] : suffix.slice(1));
							continue;
						}
						const prototypeTarget = possibleWrites ? facts?.prototypeTarget(root) : undefined;
						if (prototypeTarget !== undefined) {
							continueWith(prototypeTarget, suffix === undefined ? undefined : ["__proto__", ...suffix]);
							continue;
						}
						if (possibleWrites && (t.isCallExpression(root) || t.isOptionalCallExpression(root) || t.isNewExpression(root) || t.isTaggedTemplateExpression(root) || escapedContents && (t.isFunction(root) || t.isClass(root)))) {
							continueReturned(t.isFunction(root) || t.isClass(root) ? root : t.isTaggedTemplateExpression(root) ? root.tag : root.callee, suffix);
							continue;
						}
						if (possibleWrites && t.isConditionalExpression(root)) {
							continueWith(root.consequent);
							continueWith(root.alternate);
							continue;
						}
						if (possibleWrites && t.isLogicalExpression(root)) {
							continueWith(root.left);
							continueWith(root.right);
							continue;
						}
						if (possibleWrites && t.isSequenceExpression(root)) {
							const value = root.expressions.at(-1);
							if (value !== undefined) continueWith(value);
							continue;
						}
						if (possibleWrites && t.isAssignmentExpression(root) && root.operator === "=") {
							continueWith(root.right);
							continue;
						}
						const key = suffix?.[0];
						if (escapedContents && suffix?.length === 0) {
							if (t.isObjectExpression(root)) {
								for (const property of root.properties) if (t.isSpreadElement(property)) continueWith(property.argument, [null]);
								else if (t.isObjectProperty(property) && t.isExpression(property.value)) continueWith(property.value, []);
								else if (t.isObjectMethod(property) && property.kind === "get") continueReturned(property, []);
								continue;
							}
							if (t.isArrayExpression(root)) {
								for (const element of root.elements) if (t.isSpreadElement(element)) continueWith(element.argument, []);
								else if (t.isExpression(element)) continueWith(element, []);
								continue;
							}
						}
						if (suffix !== undefined && key === undefined) continue;
						if (t.isObjectExpression(root)) {
							if (possibleWrites) {
								for (const property of root.properties) {
									if (t.isSpreadElement(property)) continueWith(property.argument);
									else if (t.isObjectProperty(property) && t.isExpression(property.value) || t.isObjectMethod(property) && property.kind === "get") {
										const ownKey = semanticStaticPropertyKey(property.key, property.computed);
										if (suffix === undefined || key === null || ownKey === null || ownKey === key) {
											if (t.isObjectMethod(property)) continueReturned(property, suffix?.slice(1));
											else if (t.isExpression(property.value)) continueWith(property.value, suffix?.slice(1));
										}
									}
								}
							} else if (suffix !== undefined && key !== null && root.properties.every((property) => t.isObjectProperty(property) && semanticStaticPropertyKey(property.key, property.computed) !== null)) {
								const property = root.properties.findLast((property) => t.isObjectProperty(property) && semanticStaticPropertyKey(property.key, property.computed) === key);
								if (t.isObjectProperty(property) && t.isExpression(property.value)) continueWith(property.value, suffix.slice(1));
							}
						} else if (t.isArrayExpression(root)) {
							if (suffix === undefined) {
								for (const element of root.elements) if (t.isSpreadElement(element)) continueWith(element.argument);
								else if (t.isExpression(element)) continueWith(element);
							} else if (!root.elements.some(t.isSpreadElement)) {
								const index = Number(key);
								if (key === null && possibleWrites) {
									for (const element of root.elements) if (t.isExpression(element)) continueWith(element, suffix.slice(1));
								} else if (key !== null && Number.isInteger(index) && index >= 0 && String(index) === key) {
									const element = root.elements[index];
									if (t.isExpression(element)) continueWith(element, suffix.slice(1));
								}
							}
						}
					} finally {
						if (!resolvedIdentity && pending.length === queuedBefore && result.size === pathsBefore) unknownReasons.add("unresolved-value");
					}
				}
				const paths = [...result.values()];
				if (paths.length > 0 && hasLocalIdentity) unknownReasons.add("mixed-identities");
				const resolution = {
					paths,
					ownership: unknownReasons.size > 0 ? "unknown" : paths.length > 0 ? "ambient" : hasLocalIdentity ? "local" : "unknown",
					unknownReasons: [...unknownReasons]
				};
				if (!possibleWrites) cached.set(node, resolution);
				return resolution;
			};
		};
		isUnmodifiedGlobalReference = (callee, state, name) => {
			const path = typeof name === "string" ? [name] : name;
			if (state.ambientWrites.covers(["global", ...path])) return false;
			const { root, members } = electronMemberPath(callee);
			const matches = (expected) => members.length === expected.length && members.every((key, index) => key === expected[index]);
			if (isUnshadowedGlobal(root, state, path[0]) && matches(path.slice(1))) return true;
			const namespace = globalObjectName(root, state);
			return namespace !== undefined && matches(path) && !state.ambientWrites.covers(["global", namespace]);
		};
		isUnmodifiedImportMetaUrl = (node, state) => isImportMetaUrl(node) && !state.ambientWrites.covers(["import-meta", "url"]);
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptCommonJsExportReceivers.js
/**
* Capture receivers before their RHS, then compare with the final public
* identity. Fresh allocations prove distinctness; explicit wrapper reads
* preserve even opaque identities. Branches and deferred execution remain
* uncertain, as do local aliases. Facts live for one analysis and the
* cooperative traversal bounds work to the source tree size.
*/
function* indexCommonJsExportReceiversSteps(state) {
	const initial = state.program;
	let publicIdentity = initial;
	let exportsIdentity = initial;
	let moduleIntact = true;
	let deferredReplacement = false;
	const fresh = new WeakSet([initial]);
	const values = new WeakMap();
	const captures = new Map();
	const describedFields = new Map();
	const deletions = new Map();
	const execution = [];
	const publicCallWrites = new WeakSet();
	for (const { node, path } of state.ambientWriteEffects) {
		if ((t.isCallExpression(node) || t.isOptionalCallExpression(node)) && path[0] === "commonjs-module" && path.length <= 2 && (path.length === 1 || semanticPropertyPathKeyMatches(path[1] ?? null, "exports"))) publicCallWrites.add(node);
	}
	const valueOf = (node) => {
		const value = unwrapJavaScriptExpression(node).node;
		return values.has(value) ? values.get(value) ?? null : value;
	};
	const write = (target, identity, mode) => {
		target = unwrapJavaScriptExpression(target).node;
		const possiblePublicWrite = (t.isMemberExpression(target) || t.isOptionalMemberExpression(target)) && isUnshadowedGlobal(target.object, state, "module") && semanticStaticPropertyKey(target.property, target.computed) === null;
		const publicWrite = isCommonJsModuleExports(target, state) || possiblePublicWrite;
		const exportsWrite = isUnshadowedGlobal(target, state, "exports");
		const moduleWrite = isUnshadowedGlobal(target, state, "module");
		if (!publicWrite && !exportsWrite && !moduleWrite) return;
		if (mode === "deferred") {
			deferredReplacement = true;
			return;
		}
		const selected = mode === "ordered" && !possiblePublicWrite ? identity : null;
		if (moduleWrite) moduleIntact = false;
		if (publicWrite || moduleWrite) publicIdentity = moduleIntact ? selected : null;
		if (exportsWrite) exportsIdentity = selected;
	};
	yield* traverseJavaScriptValueAstSteps(state.program, state.erasedSyntaxNodes, {
		enter: (node, parent) => {
			const outer = execution.at(-1) ?? "ordered";
			const mode = outer === "deferred" || t.isFunction(node) || t.isClass(node) ? "deferred" : outer === "conditional" || hasDestructuringEvaluationOrder(node) || t.isIfStatement(node) || t.isSwitchStatement(node) || t.isLoop(node) || t.isTryStatement(node) || t.isObjectPattern(node) || t.isArrayPattern(node) || t.isLogicalExpression(parent) && parent.right === node || t.isAssignmentPattern(parent) && parent.right === node || t.isAssignmentExpression(parent) && [
				"&&=",
				"||=",
				"??="
			].includes(parent.operator) && parent.right === node || t.isOptionalCallExpression(parent) || t.isOptionalMemberExpression(parent) && parent.property === node || t.isConditionalExpression(parent) && parent.test !== node ? "conditional" : "ordered";
			execution.push(mode);
			if (t.isAssignmentExpression(node) && commonJsExportName(node.left, state) !== undefined && !isCommonJsModuleExports(node.left, state)) {
				const receiver = t.isMemberExpression(node.left) || t.isOptionalMemberExpression(node.left) ? node.left.object : null;
				captures.set(node, mode !== "ordered" ? null : receiver !== null && isUnshadowedGlobal(receiver, state, "exports") ? exportsIdentity : publicIdentity);
			}
			const descriptor = commonJsDefinedExport(node, state);
			if (descriptor !== undefined) {
				const receiver = isUnshadowedGlobal(descriptor.receiver, state, "exports") ? exportsIdentity : publicIdentity;
				const names = describedFields.get(receiver) ?? new Set();
				names.add(descriptor.exportedName);
				describedFields.set(receiver, names);
			}
			const defined = descriptor ?? commonJsAssignedExports(node, state);
			if (defined !== undefined && t.isCallExpression(node)) captures.set(node, mode !== "ordered" ? null : isUnshadowedGlobal(defined.receiver, state, "exports") ? exportsIdentity : publicIdentity);
		},
		exit: (node) => {
			const mode = execution.pop() ?? "conditional";
			if (publicCallWrites.has(node)) {
				if (mode === "deferred") deferredReplacement = true;
				else publicIdentity = null;
			}
			if (t.isAssignmentExpression(node)) {
				const left = unwrapJavaScriptExpression(node.left).node;
				const identity = node.operator === "=" && (t.isIdentifier(left) || t.isMemberExpression(left) || t.isOptionalMemberExpression(left)) ? valueOf(node.right) : null;
				for (const target of semanticWriteTargets(node.left)) write(target, identity, mode);
				values.set(node, identity);
			} else if (t.isVariableDeclarator(node) && node.init != null) {
				for (const target of semanticWriteTargets(node.id)) write(target, t.isIdentifier(node.id) ? valueOf(node.init) : null, mode);
			} else if (t.isForOfStatement(node) || t.isForInStatement(node)) {
				if (!t.isVariableDeclaration(node.left)) for (const target of semanticWriteTargets(node.left)) write(target, null, mode);
			} else if (t.isUpdateExpression(node) || t.isUnaryExpression(node, { operator: "delete" })) {
				if (t.isUnaryExpression(node, { operator: "delete" })) {
					const name = commonJsExportName(node.argument, state);
					if (name !== undefined && !isCommonJsModuleExports(node.argument, state) && (t.isMemberExpression(node.argument) || t.isOptionalMemberExpression(node.argument))) {
						const receiver = isUnshadowedGlobal(node.argument.object, state, "exports") ? exportsIdentity : publicIdentity;
						const fields = deletions.get(receiver) ?? new Map();
						fields.set(name, {
							node,
							mode: name === "*" && mode === "ordered" ? "conditional" : mode
						});
						deletions.set(receiver, fields);
					}
				}
				write(node.argument, null, mode);
			} else if (isUnshadowedGlobal(node, state, "exports")) {
				values.set(node, exportsIdentity);
			} else if (isCommonJsModuleExports(node, state)) {
				values.set(node, publicIdentity);
			} else if (t.isObjectExpression(node) || t.isArrayExpression(node) || t.isFunctionExpression(node) || t.isArrowFunctionExpression(node) || t.isClassExpression(node)) {
				values.set(node, node);
				fresh.add(node);
			} else if (t.isSequenceExpression(node)) {
				const last = node.expressions.at(-1);
				values.set(node, last === undefined ? null : valueOf(last));
			}
		}
	});
	const effects = new Map();
	for (const [node, receiver] of captures) {
		const status = deferredReplacement || receiver === null || publicIdentity === null ? "uncertain" : receiver === publicIdentity ? "connected" : fresh.has(receiver) && fresh.has(publicIdentity) ? "detached" : "uncertain";
		if (status === "detached") {
			effects.set(node, { receiver: status });
			continue;
		}
		const fields = new Map();
		for (const { exportedName } of commonJsRuntimeExportValues(node, state)) {
			const removed = [deletions.get(receiver)?.get(exportedName), deletions.get(receiver)?.get("*")].filter((deletion) => deletion !== undefined && (deletion.mode === "deferred" || (deletion.node.start ?? -1) > (node.start ?? -1)));
			if (removed.length === 0) continue;
			const configurable = (t.isAssignmentExpression(node) || commonJsAssignedExports(node, state) !== undefined) && !describedFields.get(receiver)?.has(exportedName) && !describedFields.get(receiver)?.has("*");
			fields.set(exportedName, configurable && status !== "uncertain" && removed.every((deletion) => deletion?.mode === "ordered") ? "detached" : "uncertain");
		}
		effects.set(node, {
			receiver: status,
			...fields.size === 0 ? {} : { fields }
		});
	}
	return effects;
}
var exportInvocations, commonJsExportInvocation, commonJsExportApplicability, copiedOwnFields, isCommonJsModuleExports, commonJsExportName, commonJsDefinedExport, commonJsAssignedExports, commonJsRuntimeExportValues, hasDestructuringEvaluationOrder;
function init_javascriptCommonJsExportReceivers() {
	return (init_javascriptCommonJsExportReceivers = __esmMin((() => {
		init_javascriptAstValues();
		init_javascriptSemanticState();
		init_javascriptSemanticAmbientWrites();
		init_javascriptSemanticTraversal();
		init_javascriptSemanticPropertyPaths();
		init_javascriptModuleInterop();
		init_javascriptSemanticValues();
		init_javascriptSemanticProjectedSources();
		init_javascriptSemanticMutationInitializers();
		init_javascriptSemanticResourceLimits();
		exportInvocations = new WeakMap();
		commonJsExportInvocation = (node, state) => {
			let interop = exportInvocations.get(state);
			if (interop === undefined) {
				interop = createSemanticModuleInterop(state);
				for (const { node: write, path } of state.ambientWriteEffects) if (write !== undefined && path[0] === "global") interop.retainWrite(write, ["intrinsic", ...path.slice(1).map((key) => typeof key === "string" || typeof key === "number" ? String(key) : null)]);
				exportInvocations.set(state, interop);
			}
			return interop.intrinsicInvocation(node);
		};
		commonJsExportApplicability = (effect, name) => effect?.receiver === "detached" ? "detached" : effect?.fields?.get(name) ?? effect?.receiver ?? "connected";
		copiedOwnFields = (source, state) => {
			const unknown = {
				definite: new Set(),
				complete: false
			};
			const pending = [source];
			const seen = new Set();
			let common;
			let complete = true;
			while (pending.length > 0) {
				const node = unwrapJavaScriptExpression(pending.pop()).node;
				if (seen.has(node)) continue;
				if (seen.size >= 512) {
					state.valueResourceLimits.add("alias-selections");
					return unknown;
				}
				seen.add(node);
				if (t.isIdentifier(node)) {
					const binding = resolveSemanticBindingState(state, node, node.name);
					if (binding === undefined) return unknown;
					if (binding.memberWrites.some((effect) => semanticEffectTiming(source, effect.node, state) !== "after") || binding.escapedPaths.some((effect) => effect.node !== undefined && !((effect.node.start ?? -1) <= (source.start ?? -1) && (effect.node.end ?? -1) >= (source.end ?? -1)) && semanticEffectTiming(source, effect.node, state) !== "after")) return unknown;
					const selected = semanticProjectedSourcesAtRead(binding, node, [], state, false, source);
					if (selected === undefined || selected.length === 0 || selected.some((value) => value.path.length !== 0)) return unknown;
					if (seen.size + pending.length + selected.length > 512) {
						state.valueResourceLimits.add("alias-selections");
						return unknown;
					}
					for (const value of selected) pending.push(value.node);
					continue;
				}
				if (t.isObjectExpression(node) && node.properties.some((property) => t.isObjectMethod(property) && property.kind !== "method")) return unknown;
				const selected = evaluateSemanticExpression(node, state, source);
				const fields = selected.status === "object" ? selected.properties : selected.status === "array" ? selected.items : [];
				const own = new Set(fields.filter((field) => field.presence === "present").map((field) => field.name));
				const exact = selected.status === "object" ? !selected.unknownProperties : selected.status === "array" ? !selected.unknownItems : selected.status === "literal" && selected.value === null;
				complete &&= exact && (common === undefined || common.size === own.size && [...common].every((key) => own.has(key)));
				common = common === undefined ? own : new Set([...common].filter((key) => own.has(key)));
			}
			return {
				definite: common ?? new Set(),
				complete
			};
		};
		isCommonJsModuleExports = (node, state) => (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) && isUnshadowedGlobal(node.object, state, "module") && semanticStaticPropertyKey(node.property, node.computed) === "exports";
		commonJsExportName = (node, state) => {
			if (!t.isMemberExpression(node) && !t.isOptionalMemberExpression(node)) return undefined;
			const key = semanticStaticPropertyKey(node.property, node.computed);
			if (isUnshadowedGlobal(node.object, state, "exports") || isCommonJsModuleExports(node.object, state)) return key === null ? "*" : key;
			return isCommonJsModuleExports(node, state) ? "default" : undefined;
		};
		commonJsDefinedExport = (node, state) => {
			if (!t.isCallExpression(node)) return undefined;
			const [target, key, descriptor] = node.arguments;
			if (target === undefined || key === undefined || descriptor === undefined || t.isSpreadElement(target) || t.isSpreadElement(key) || t.isSpreadElement(descriptor) || t.isArgumentPlaceholder(target) || t.isArgumentPlaceholder(key) || t.isArgumentPlaceholder(descriptor)) return undefined;
			const receiver = unwrapJavaScriptExpression(target).node;
			if (!isUnshadowedGlobal(receiver, state, "exports") && !isCommonJsModuleExports(receiver, state) || !isUnmodifiedGlobalReference(node.callee, state, ["Object", "defineProperty"])) return undefined;
			return {
				exportedName: semanticStaticPropertyKey(key, true) ?? "*",
				receiver,
				descriptor
			};
		};
		commonJsAssignedExports = (node, state) => {
			if (!t.isCallExpression(node)) return undefined;
			const invocation = commonJsExportInvocation(node, state);
			if (invocation?.kind !== "known" || invocation.path.length !== 3 || invocation.path[0] !== "intrinsic" || invocation.path[1] !== "Object" || invocation.path[2] !== "assign") return undefined;
			const [target, ...sources] = invocation.arguments ?? [];
			if (!t.isExpression(target)) return undefined;
			const receiver = unwrapJavaScriptExpression(target).node;
			if (!isUnshadowedGlobal(receiver, state, "exports") && !isCommonJsModuleExports(receiver, state)) return undefined;
			return {
				receiver,
				sources: sources.map((source) => ({
					value: t.isExpression(source) ? source : null,
					...t.isSpreadElement(source) ? { iterationSource: source.argument } : {}
				}))
			};
		};
		commonJsRuntimeExportValues = (node, state) => {
			if (t.isAssignmentExpression(node)) {
				const exportedName = commonJsExportName(node.left, state);
				return exportedName === undefined ? [] : [{
					exportedName,
					value: node.operator === "=" ? node.right : null
				}];
			}
			const assigned = commonJsAssignedExports(node, state);
			if (assigned !== undefined) {
				const exported = [];
				const overwritten = new Set();
				for (let index = assigned.sources.length - 1; index >= 0; index--) {
					const { value, iterationSource } = assigned.sources[index];
					if (value === null) {
						exported.push({
							exportedName: "*",
							value: null,
							...iterationSource === undefined ? {} : { iterationSource }
						});
						continue;
					}
					const fields = copiedOwnFields(value, state);
					if (fields.complete) {
						for (const name of fields.definite) if (!overwritten.has(name)) exported.push({
							exportedName: name,
							value,
							projection: [name],
							ownEnumerable: true
						});
					} else exported.push({
						exportedName: "*",
						value,
						projection: [{ excludedKeys: [...overwritten] }],
						ownEnumerable: true
					});
					for (const field of fields.definite) overwritten.add(field);
				}
				return exported;
			}
			const defined = commonJsDefinedExport(node, state);
			if (defined === undefined) return [];
			const descriptor = unwrapJavaScriptExpression(defined.descriptor).node;
			return [{
				exportedName: defined.exportedName,
				value: t.isObjectExpression(descriptor) ? semanticFinalObjectProperty(descriptor, "value") ?? null : null
			}];
		};
		hasDestructuringEvaluationOrder = (node) => {
			const pattern = t.isAssignmentExpression(node) ? unwrapJavaScriptExpression(node.left).node : t.isVariableDeclarator(node) ? node.id : undefined;
			return t.isObjectPattern(pattern) || t.isArrayPattern(pattern);
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticProjection.js
/** Collect lexical references in steps while preserving resolution and visit order. */
function* collectSemanticReferencesSteps(program, state, name) {
	const output = [];
	const seen = new Set();
	yield* traverseJavaScriptValueAstSteps(program, state.erasedSyntaxNodes, { enter: (node, parent, readAncestors) => {
		if (!t.isIdentifier(node) || parent === null || name !== undefined && node.name !== name) return;
		let ancestors;
		const ancestry = () => ancestors ??= readAncestors();
		const role = semanticIdentifierRole(node, parent, ancestry);
		if (role === null) return;
		const roles = role === "write" && semanticReadsBeforeWrite(node, semanticWrappedWriteSite(node, parent, ancestry()) ?? parent) ? ["read", "write"] : [role];
		for (const resolvedRole of roles) {
			const key = `${String(node.start)}:${resolvedRole}:${node.name}`;
			if (seen.has(key)) continue;
			seen.add(key);
			const binding = resolveSemanticBindingState(state, node, node.name);
			const blocked = binding === undefined && semanticResolutionBlocked(state, node, node.name);
			output.push({
				name: node.name,
				role: resolvedRole,
				location: range(node),
				bindingId: binding?.bindingId ?? null,
				resolution: binding !== undefined ? "resolved" : blocked ? "unknown" : "unbound"
			});
		}
	} });
	return output;
}
var collectSemanticCallable, collectSemanticModuleLink, collectImportEquals, collectSemanticReferences, immutableSemanticScopes, immutableSemanticBindings, callableKind, callableName, collectImports, collectNamedExports, collectRequireLink, collectUnboundRequireLink, requirePatternBindings, collectCommonJsExport, addCommonJsExport, addModuleLink, semanticCallableIdForNode, declarationCallableId, semanticReadsBeforeWrite, semanticIdentifierRole, enclosingPatternAncestor, bindsIdentifier, isPatternNode, isDeleteSite, isPatternOwnerDeclaration, semanticReferenceRole, patternNames, patternContains, declarationNames, defaultExportLocalName;
function init_javascriptSemanticProjection() {
	return (init_javascriptSemanticProjection = __esmMin((() => {
		init_javascriptSemanticState();
		init_javascriptSemanticRequireOrigin();
		init_unicodeCodePointOrder();
		init_javascriptSemanticTraversal();
		init_javascriptSemanticValues();
		init_javascriptStaticAnalysisHelpers();
		init_javascriptAstValues();
		init_javascriptModuleDeclaration();
		init_javascriptCommonJsExportReceivers();
		init_javascriptSemanticEvaluationOrder();
		collectSemanticCallable = (input) => {
			const { node, parent, containerScope, bodyScope, state } = input;
			const kind = callableKind(node);
			if (kind === undefined) return;
			const callableId = semanticCallableIdForNode(node) ?? "callable:unknown:-1:-1";
			state.callables.push({
				callableId,
				kind,
				name: callableName(node, parent),
				containerScopeId: containerScope.scopeId,
				bodyScopeId: bodyScope === undefined || !bodyScope.bindingsComplete ? null : bodyScope.scopeId,
				location: range(node),
				computedKeyLocation: "key" in node && t.isNode(node.key) && semanticComputedMethodKey(node, node.key) ? range(node.key) : null,
				returnSites: [],
				returnCoverage: {
					status: "partial",
					retainedCount: 0,
					omittedCount: null
				}
			});
			state.callableNodesById.set(callableId, node);
		};
		collectSemanticModuleLink = (node, state, commonJsReceivers) => {
			if (state.erasedSyntaxNodes.has(node) && !t.isTSImportEqualsDeclaration(node) && !t.isImportDeclaration(node) && !t.isExportNamedDeclaration(node) && !t.isExportAllDeclaration(node)) return;
			if (t.isTSImportEqualsDeclaration(node)) collectImportEquals(node, state);
			else if (t.isImportDeclaration(node)) collectImports(node, state);
			else if (t.isExportAllDeclaration(node)) addModuleLink(state, {
				kind: isTypeOnlyExportDeclaration(node) ? "type-import" : "re-export",
				specifier: node.source.value,
				importedName: "*",
				localName: null,
				exportedName: "*",
				location: range(node)
			}, node);
			else if (t.isExportNamedDeclaration(node)) collectNamedExports(node, state);
			else if (t.isExportDefaultDeclaration(node)) addModuleLink(state, {
				kind: isErasedJavaScriptDeclaration(node.declaration) ? "type-import" : "export",
				specifier: null,
				importedName: null,
				localName: defaultExportLocalName(node.declaration),
				exportedName: "default",
				callableId: semanticCallableIdForNode(node.declaration),
				location: range(node)
			}, node);
			else if (t.isVariableDeclarator(node)) collectRequireLink(node, state);
			else if (t.isAssignmentExpression(node)) collectCommonJsExport(node, state, commonJsReceivers.get(node));
			else if (t.isCallExpression(node)) {
				collectCommonJsExport(node, state, commonJsReceivers.get(node));
				collectUnboundRequireLink(node, state);
			}
		};
		collectImportEquals = (node, state) => {
			const moduleReference = node.moduleReference;
			const specifier = semanticImportEqualsSpecifier(node) ?? (node.importKind === "type" && t.isTSExternalModuleReference(moduleReference) && t.isStringLiteral(moduleReference.expression) ? moduleReference.expression.value : null);
			if (specifier === null) return;
			addModuleLink(state, {
				kind: node.importKind === "type" ? "type-import" : "require",
				specifier,
				importedName: null,
				localName: node.id.name,
				exportedName: null,
				location: range(node)
			}, node);
		};
		collectSemanticReferences = (program, state, name) => completeSemanticSteps(collectSemanticReferencesSteps(program, state, name));
		immutableSemanticScopes = (state) => state.scopes.map((scope) => ({
			scopeId: scope.scopeId,
			parentScopeId: scope.parentScopeId,
			kind: scope.kind,
			location: scope.location,
			bindingsComplete: scope.bindingsComplete,
			bindingIds: [...scope.bindings.values()].map(({ bindingId }) => bindingId).sort(compareUnicodeCodePoints)
		}));
		immutableSemanticBindings = (state) => [...state.bindingsById.values()].map((binding) => ({
			bindingId: binding.bindingId,
			scopeId: binding.scopeId,
			name: binding.name,
			kind: binding.kind,
			mutable: binding.mutable,
			definitions: binding.definitions,
			value: evaluateSemanticBinding(binding, state),
			provenance: evaluateSemanticProvenance(binding, state)
		})).sort((left, right) => compareUnicodeCodePoints(left.bindingId, right.bindingId));
		callableKind = (node) => {
			if (t.isClassMethod(node) || t.isClassPrivateMethod(node) || t.isObjectMethod(node)) return "method";
			if (t.isFunction(node)) return "function";
			if (t.isClass(node)) return "class";
			return undefined;
		};
		callableName = (node, parent) => {
			if ((t.isFunctionDeclaration(node) || t.isFunctionExpression(node) || t.isClassDeclaration(node) || t.isClassExpression(node)) && t.isIdentifier(node.id)) return node.id.name;
			if (t.isClassMethod(node) || t.isClassPrivateMethod(node) || t.isObjectMethod(node)) {
				if (t.isPrivateName(node.key)) return `#${node.key.id.name}`;
				return semanticStaticPropertyKey(node.key, node.computed) ?? `[computed@${String(node.start ?? -1)}]`;
			}
			if (parent !== null && t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) return parent.id.name;
			return null;
		};
		collectImports = (node, state) => {
			if (node.specifiers.length === 0) addModuleLink(state, {
				kind: isTypeOnlyImportDeclaration(node) ? "type-import" : "import",
				specifier: node.source.value,
				importedName: null,
				localName: null,
				exportedName: null,
				location: range(node)
			}, node);
			for (const specifier of node.specifiers) addModuleLink(state, {
				kind: isTypeOnlyImportDeclaration(node) || t.isImportSpecifier(specifier) && isTypeOnlyImportSpecifier(specifier) ? "type-import" : "import",
				specifier: node.source.value,
				importedName: t.isImportDefaultSpecifier(specifier) ? "default" : t.isImportNamespaceSpecifier(specifier) ? "*" : propertyName(specifier.imported),
				localName: specifier.local.name,
				exportedName: null,
				location: range(specifier)
			}, node);
		};
		collectNamedExports = (node, state) => {
			const declarationTypeOnly = isTypeOnlyExportDeclaration(node);
			if (node.declaration !== null && node.declaration !== undefined) for (const localName of declarationNames(node.declaration)) addModuleLink(state, {
				kind: declarationTypeOnly ? "type-import" : "export",
				specifier: null,
				importedName: null,
				localName,
				exportedName: localName,
				callableId: declarationCallableId(node.declaration, localName),
				location: range(node.declaration)
			}, node);
			for (const specifier of node.specifiers) if (t.isExportSpecifier(specifier) || t.isExportNamespaceSpecifier(specifier) && node.exportKind !== "type") addModuleLink(state, {
				kind: declarationTypeOnly || t.isExportSpecifier(specifier) && isTypeOnlyExportSpecifier(specifier) ? "type-import" : node.source == null ? "export" : "re-export",
				specifier: node.source?.value ?? null,
				importedName: t.isExportNamespaceSpecifier(specifier) ? "*" : propertyName(specifier.local),
				localName: node.source == null && t.isExportSpecifier(specifier) ? propertyName(specifier.local) : null,
				exportedName: propertyName(specifier.exported),
				location: range(specifier)
			}, node);
		};
		collectRequireLink = (node, state) => {
			const required = semanticRequireOrigin(node.init, state);
			if (required === undefined) return;
			const { origin, call } = required;
			const bindings = requirePatternBindings(node.id, origin.importedPath);
			for (const binding of bindings) addModuleLink(state, {
				kind: "require",
				specifier: origin.specifier,
				importedName: binding.importedName,
				localName: binding.localName,
				exportedName: null,
				location: range(node)
			}, node);
			if (bindings.length > 0) state.linkedRequireCalls.add(call);
		};
		collectUnboundRequireLink = (node, state) => {
			if (state.linkedRequireCalls.has(node)) return;
			const required = semanticRequireOrigin(node, state);
			if (required === undefined) return;
			addModuleLink(state, {
				kind: "require",
				specifier: required.origin.specifier,
				importedName: null,
				localName: null,
				exportedName: null,
				location: range(node)
			}, node);
			state.linkedRequireCalls.add(node);
		};
		requirePatternBindings = (pattern, path) => {
			if (t.isTSParameterProperty(pattern)) return requirePatternBindings(pattern.parameter, path);
			if (t.isIdentifier(pattern)) return [{
				importedName: path.at(-1) ?? "*",
				localName: pattern.name
			}];
			if (t.isAssignmentPattern(pattern)) return requirePatternBindings(pattern.left, path);
			if (t.isObjectPattern(pattern)) return pattern.properties.flatMap((property) => {
				if (t.isRestElement(property)) return [];
				const name = semanticStaticPropertyKey(property.key, property.computed);
				return name === null ? [] : requirePatternBindings(property.value, [...path, name]);
			});
			if (t.isArrayPattern(pattern)) return pattern.elements.flatMap((element, index) => element === null ? [] : requirePatternBindings(element, [...path, String(index)]));
			return [];
		};
		collectCommonJsExport = (node, state, receiverEffect) => {
			for (const exported of commonJsRuntimeExportValues(node, state)) {
				const applicability = commonJsExportApplicability(receiverEffect, exported.exportedName);
				if (applicability === "detached") continue;
				addCommonJsExport(node, state, exported.exportedName, applicability === "uncertain" ? null : exported.value, exported.projection);
			}
		};
		addCommonJsExport = (node, state, exportedName, exported, projection) => {
			let value = exported;
			while (t.isAssignmentExpression(value, { operator: "=" })) value = value.right;
			const required = value === null ? undefined : semanticRequireOrigin(value, state);
			const origin = projection?.some((key) => typeof key === "object" && key !== null && key.excludedKeys.length > 0) ? undefined : required?.origin;
			const selectedName = projection?.at(-1);
			addModuleLink(state, {
				kind: "commonjs-export",
				specifier: origin?.specifier ?? null,
				importedName: origin === undefined ? null : typeof selectedName === "string" || typeof selectedName === "number" ? String(selectedName) : origin.importedPath.at(-1) ?? null,
				localName: projection === undefined && value !== null && t.isIdentifier(value) ? value.name : null,
				exportedName,
				callableId: projection !== undefined || value === null ? null : semanticCallableIdForNode(value),
				location: range(node)
			}, node);
			if (origin !== undefined && required !== undefined) state.linkedRequireCalls.add(required.call);
		};
		addModuleLink = (state, link, referenceNode) => {
			const resolutionMode = link.resolutionMode ?? (link.kind === "import" || link.kind === "re-export" || link.kind === "type-import" ? state.staticImportResolutionMode : link.kind === "require" ? "require" : undefined);
			const collected = {
				...link,
				...resolutionMode === undefined ? {} : { resolutionMode },
				callableId: link.callableId ?? null
			};
			state.moduleLinks.push(collected);
			if (t.isExportDefaultDeclaration(referenceNode) && t.isExpression(referenceNode.declaration)) state.defaultExportExpressions.set(collected, referenceNode.declaration);
			if (link.localName !== null) {
				const binding = resolveSemanticBindingState(state, referenceNode, link.localName);
				if (binding !== undefined) state.moduleLinkBindings.set(collected, binding);
			}
		};
		semanticCallableIdForNode = (node) => {
			const kind = callableKind(node);
			return kind === undefined ? null : `callable:${kind}:${String(node.start ?? -1)}:${String(node.end ?? -1)}`;
		};
		declarationCallableId = (declaration, localName) => {
			if ((t.isFunctionDeclaration(declaration) || t.isClassDeclaration(declaration)) && declaration.id?.name === localName) return semanticCallableIdForNode(declaration);
			if (!t.isVariableDeclaration(declaration)) return null;
			const declarator = declaration.declarations.find(({ id }) => t.isIdentifier(id, { name: localName }));
			return declarator?.init === null || declarator?.init === undefined ? null : semanticCallableIdForNode(declarator.init);
		};
		semanticReadsBeforeWrite = (node, site) => {
			const target = semanticWriteSiteTarget(site);
			return target !== null && unwrapJavaScriptExpression(target).node === node && semanticWriteSiteReadsFirst(site);
		};
		semanticIdentifierRole = (node, parent, readAncestors) => {
			if (t.isMemberExpression(parent) || t.isOptionalMemberExpression(parent)) return semanticReferenceRole(node, parent);
			if (t.isObjectProperty(parent) && parent.key === node && !parent.computed && parent.value !== node) return null;
			const ancestors = readAncestors();
			const patternAncestor = enclosingPatternAncestor(node, parent, ancestors);
			if (patternAncestor !== null) {
				if (isPatternOwnerDeclaration(patternAncestor)) return null;
				return "write";
			}
			const site = semanticWrappedWriteSite(node, parent, ancestors);
			if (site !== null && site !== parent && !isDeleteSite(site)) return "write";
			return semanticReferenceRole(node, parent, ancestors.at(-2));
		};
		enclosingPatternAncestor = (node, parent, ancestors) => {
			const chain = [...ancestors, parent];
			for (let index = chain.length - 1; index >= 0; index -= 1) {
				const ancestor = chain[index];
				if (ancestor === undefined || !isPatternNode(ancestor)) continue;
				if (!bindsIdentifier(ancestor, parent, node)) continue;
				for (let owner = index - 1; owner >= 0; owner -= 1) {
					const candidate = chain[owner];
					if (candidate === undefined) continue;
					if (t.isAssignmentExpression(candidate) || t.isForInStatement(candidate) || t.isForOfStatement(candidate)) return candidate;
					if (isPatternOwnerDeclaration(candidate)) return candidate;
				}
				return null;
			}
			return null;
		};
		bindsIdentifier = (pattern, parent, node) => {
			if (parent === pattern) return patternContains(pattern, node);
			if (t.isObjectPattern(pattern)) return t.isObjectProperty(parent) && (parent.value === node || parent.shorthand && parent.key === node);
			if (t.isArrayPattern(pattern)) return pattern.elements.some((element) => element === parent);
			if (t.isAssignmentPattern(pattern)) return pattern.left === parent;
			return t.isRestElement(pattern) && pattern.argument === parent;
		};
		isPatternNode = (node) => t.isObjectPattern(node) || t.isArrayPattern(node) || t.isAssignmentPattern(node) || t.isRestElement(node);
		isDeleteSite = (site) => t.isUnaryExpression(site, { operator: "delete" });
		isPatternOwnerDeclaration = (node) => t.isTSParameterProperty(node) || t.isVariableDeclarator(node) && t.isPattern(node.id) || t.isFunction(node) && node.params.some((value) => t.isPattern(value)) || t.isCatchClause(node) && node.param !== null && t.isPattern(node.param);
		semanticReferenceRole = (node, parent, grandparent) => {
			if (t.isAssignmentExpression(parent) && parent.left === node || t.isUpdateExpression(parent) || (t.isForInStatement(parent) || t.isForOfStatement(parent)) && parent.left === node) return "write";
			if (t.isTSImportEqualsDeclaration(parent) && parent.id === node || t.isTSParameterProperty(parent) && patternContains(parent.parameter, node) || (t.isTSDeclareMethod(parent) || t.isTSMethodSignature(parent)) && parent.key === node && !parent.computed) return null;
			if (!t.isReferenced(node, parent, grandparent)) return null;
			return t.isExportSpecifier(parent) && parent.local === node ? "export" : "read";
		};
		patternNames = (pattern) => {
			if (t.isTSParameterProperty(pattern)) return patternNames(pattern.parameter);
			if (t.isIdentifier(pattern)) return [pattern.name];
			if (t.isAssignmentPattern(pattern)) return patternNames(pattern.left);
			if (t.isRestElement(pattern)) return patternNames(pattern.argument);
			if (t.isObjectPattern(pattern)) return pattern.properties.flatMap((property) => t.isRestElement(property) ? patternNames(property.argument) : patternNames(property.value));
			if (t.isArrayPattern(pattern)) return pattern.elements.flatMap((element) => element === null ? [] : patternNames(element));
			return [];
		};
		patternContains = (pattern, target) => pattern === target || t.isTSParameterProperty(pattern) && patternContains(pattern.parameter, target) || t.isAssignmentPattern(pattern) && patternContains(pattern.left, target) || t.isRestElement(pattern) && patternContains(pattern.argument, target) || t.isObjectPattern(pattern) && pattern.properties.some((property) => t.isRestElement(property) ? patternContains(property.argument, target) : patternContains(property.value, target)) || t.isArrayPattern(pattern) && pattern.elements.some((element) => element !== null && patternContains(element, target));
		declarationNames = (declaration) => {
			if (t.isVariableDeclaration(declaration)) return declaration.declarations.flatMap(({ id }) => patternNames(id));
			if ((t.isFunctionDeclaration(declaration) || t.isClassDeclaration(declaration)) && t.isIdentifier(declaration.id)) return [declaration.id.name];
			if ((t.isTSInterfaceDeclaration(declaration) || t.isTSTypeAliasDeclaration(declaration) || t.isTSDeclareFunction(declaration)) && t.isIdentifier(declaration.id)) return [declaration.id.name];
			if (t.isTSImportEqualsDeclaration(declaration) && semanticImportEqualsSpecifier(declaration) !== null) return [declaration.id.name];
			return [];
		};
		defaultExportLocalName = (declaration) => {
			const value = unwrapJavaScriptExpression(declaration).node;
			if (t.isIdentifier(value)) return value.name;
			return (t.isFunctionDeclaration(value) || t.isClassDeclaration(value)) && t.isIdentifier(value.id) ? value.id.name : null;
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticCoverage.js
var RETURNED_REFERENCE_WIDENING_LIMITATION, semanticCoverage, semanticCoverageResourceLimits, semanticResourceBounds, semanticResourceLimitCoverage, semanticReturnCoverage;
function init_javascriptSemanticCoverage() {
	return (init_javascriptSemanticCoverage = __esmMin((() => {
		init_javascriptSemanticResourceLimits();
		RETURNED_REFERENCE_WIDENING_LIMITATION = "Local returned-reference projections were conservatively widened; effects include additional source-local candidates.";
		semanticCoverage = (parserPartial, resourceLimits = [], widenedReturnedReferences = []) => {
			const widened = widenedReturnedReferences.length > 0 ? { widenedReturnedReferences } : {};
			if (resourceLimits.length > 0) return {
				status: "partial",
				omittedCount: null,
				resourceLimits,
				...widened
			};
			return {
				status: parserPartial || widenedReturnedReferences.length > 0 ? "partial" : "complete",
				omittedCount: 0,
				...widened
			};
		};
		semanticCoverageResourceLimits = (coverage) => coverage.resourceLimits ?? [];
		semanticResourceBounds = {
			"primitive-candidates": {
				value: 256,
				unit: "items"
			},
			"primitive-bytes": {
				value: SEMANTIC_PRIMITIVE_JSON_BYTES_LIMIT,
				unit: "bytes"
			},
			"expression-depth": {
				value: 256,
				unit: "depth"
			},
			"getter-expansion": {
				value: 512,
				unit: "items"
			},
			"alias-selections": {
				value: 512,
				unit: "items"
			}
		};
		semanticResourceLimitCoverage = (resourceLimits) => resourceLimits.map((resourceLimit) => ({
			name: `javascript_semantic_${resourceLimit.replaceAll("-", "_")}`,
			...semanticResourceBounds[resourceLimit]
		}));
		semanticReturnCoverage = (retainedCount, parserPartial) => ({
			status: parserPartial ? "partial" : "complete",
			retainedCount,
			omittedCount: 0
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticReturns.js
var collectSemanticReturns, semanticReturnSiteId, resolveSemanticModuleCallables, directReturnExpressions, callableIdsForBinding, callableIdsForNode, flattenSemanticReturnValue, flattenValue;
function init_javascriptSemanticReturns() {
	return (init_javascriptSemanticReturns = __esmMin((() => {
		init_javascriptSemanticSlots();
		init_unicodeCodePointOrder();
		init_javascriptSemanticProjection();
		init_javascriptAstValues();
		init_javascriptSemanticState();
		init_javascriptSemanticValues();
		init_javascriptStaticAnalysisHelpers();
		init_javascriptSemanticCoverage();
		init_javascriptSemanticCallableResults();
		init_javascriptSemanticMutationInitializers();
		collectSemanticReturns = (state, parserPartial) => {
			return state.callables.map((callable) => {
				const node = state.callableNodesById.get(callable.callableId);
				if (node === undefined) return {
					...callable,
					returnCoverage: {
						status: "partial",
						retainedCount: 0,
						omittedCount: null
					}
				};
				const expressions = directReturnExpressions(node);
				const sites = [];
				for (const expression of expressions) {
					const returned = expression.node === null ? null : unwrapJavaScriptExpression(expression.node).node;
					sites.push({
						returnSiteId: semanticReturnSiteId(callable.callableId, expression.location),
						location: expression.location,
						identityReferenceLocation: returned !== null && t.isIdentifier(returned) ? range(returned) : null,
						valueExpressionLocation: returned === null ? null : range(returned),
						value: expression.node === null ? {
							status: "unknown",
							reason: "Return has no value."
						} : evaluateSemanticExpression(expression.node, state)
					});
				}
				return {
					...callable,
					returnSites: sites,
					returnCoverage: semanticReturnCoverage(sites.length, parserPartial)
				};
			});
		};
		semanticReturnSiteId = (callableId, location) => [
			callableId,
			"return",
			String(location.start.line),
			String(location.start.column),
			String(location.end.line),
			String(location.end.column)
		].join(":");
		resolveSemanticModuleCallables = (state, callables, bindings) => {
			const callableIds = new Set(callables.map(({ callableId }) => callableId));
			const provenanceByBinding = new Map(bindings.map(({ bindingId, provenance }) => [bindingId, provenance]));
			return state.moduleLinks.map((link) => {
				if (link.kind === "type-import") return {
					...link,
					callableId: null
				};
				const captured = state.defaultExportExpressions.get(link);
				if (link.localName === null && captured === undefined) return link.callableId !== null && callableIds.has(link.callableId) ? link : {
					...link,
					callableId: null
				};
				const binding = state.moduleLinkBindings.get(link);
				const resolved = captured !== undefined ? callableIdsForNode(captured, state, callableIds, new Set(), true) : binding === undefined ? [] : callableIdsForBinding(binding, state, callableIds, new Set());
				const provenance = binding === undefined || link.specifier !== null ? undefined : provenanceByBinding.get(binding.bindingId);
				const resolutionMode = provenance?.status === "module" ? provenance.origins[0].resolutionMode : undefined;
				return {
					...link,
					...resolutionMode !== undefined ? { resolutionMode } : {},
					callableId: resolved.length === 1 ? resolved[0] ?? null : null
				};
			});
		};
		directReturnExpressions = (callable) => semanticCallableResultExpressions(callable).filter(({ kind }) => kind === "return").map(({ node, site }) => ({
			node,
			location: range(site)
		}));
		callableIdsForBinding = (binding, state, admitted, seen, read) => {
			if (seen.has(binding.bindingId) || read === undefined && binding.initializers.length !== 1 || binding.definitions.some(({ kind }) => read === undefined && kind === "assignment" || kind === "parameter" || kind === "catch")) return [];
			const selected = read === undefined ? binding : semanticBindingAtRead(binding, read, state.parentsByNode).binding;
			const initializer = selected.initializers[0];
			if (initializer === undefined || selected.initializers.length !== 1 || initializer.projection.length > 0 || state.conditionallySkippedExpressions.has(initializer.node)) return [];
			return callableIdsForNode(initializer.node, state, admitted, new Set([...seen, binding.bindingId]), read !== undefined);
		};
		callableIdsForNode = (node, state, admitted, seen, snapshot = false) => {
			const unwrapped = unwrapJavaScriptExpression(node).node;
			if (unwrapped !== node) return callableIdsForNode(unwrapped, state, admitted, seen, snapshot);
			const direct = semanticCallableIdForNode(node);
			if (direct !== null && admitted.has(direct)) return [direct];
			if (t.isIdentifier(node)) {
				const binding = resolveSemanticBindingState(state, node, node.name);
				return binding === undefined ? [] : callableIdsForBinding(binding, state, admitted, seen, snapshot ? node : undefined);
			}
			return [];
		};
		flattenSemanticReturnValue = (value) => {
			const fields = [];
			const propertyCoverage = [];
			flattenValue(value, "", fields, propertyCoverage);
			fields.sort((left, right) => compareUnicodeCodePoints(left.path, right.path));
			propertyCoverage.sort((left, right) => compareUnicodeCodePoints(left.path, right.path));
			return {
				fields,
				propertyCoverage
			};
		};
		flattenValue = (value, path, fields, coverage, presence = "present") => {
			if (presence !== "present") {
				fields.push({
					path,
					presence,
					state: "unknown",
					value: null,
					reason: "reason" in value ? value.reason : "Property presence is uncertain."
				});
				return;
			}
			if (value.status === "literal") {
				fields.push({
					path,
					presence,
					state: "literal",
					value: value.value,
					reason: null
				});
				return;
			}
			if (value.status === "union") {
				fields.push({
					path,
					presence,
					state: "union",
					value: [...value.values],
					reason: null
				});
				return;
			}
			if ("reason" in value) {
				fields.push({
					path,
					presence,
					state: "unknown",
					value: null,
					reason: value.reason
				});
				return;
			}
			const container = semanticContainer(value);
			coverage.push({
				path,
				...container.coverage
			});
			for (const slot of container.slots) flattenValue(slot.value, `${path}${semanticPropertyPointer([slot.name])}`, fields, coverage, slot.presence);
		};
	})))();
}

//#endregion
//#region dist/domain/native/nativeValueTrace.js
var nativeValueTraceInputSchema, nativeValueTraceSchema;
function init_nativeValueTrace() {
	return (init_nativeValueTrace = __esmMin((() => {
		init_nativeValueFlow();
		nativeValueTraceInputSchema = z.strictObject({
			procedure: z.string().min(1),
			max_depth: z.int().min(0).max(16).default(3),
			max_functions: z.int().min(1).max(64).default(16),
			max_call_sites: z.int().min(1).max(4096).default(256),
			max_nodes: z.int().min(1).max(2e4).default(5e3),
			max_edges: z.int().min(1).max(4e4).default(1e4),
			offset: z.int().min(0).default(0),
			limit: z.int().min(1).max(5e3).default(1e3)
		});
		nativeValueTraceSchema = z.strictObject({
			seed: z.string(),
			target_sha256: z.string(),
			nodes: z.array(z.strictObject({
				id: z.string(),
				procedure: z.string(),
				evidence_id: z.string(),
				kind: z.enum(["operation", "parameter"]),
				operation: nativePcodeOperationSchema.nullable(),
				parameter: z.strictObject({
					ordinal: z.int().nonnegative(),
					name: z.string(),
					data_type: z.string()
				}).nullable()
			})),
			edges: z.array(z.strictObject({
				source: z.string(),
				target: z.string(),
				input_index: z.int().nonnegative().nullable(),
				kind: z.enum([
					"def-use",
					"call",
					"parameter-use",
					"argument-binding",
					"return-binding"
				]),
				status: z.enum([
					"derived",
					"direct",
					"resolved-indirect",
					"candidate"
				]),
				evidence_id: z.string()
			})),
			procedures: z.array(z.strictObject({
				address: z.string(),
				depth: z.int().nonnegative(),
				evidence_id: z.string(),
				provider: z.string(),
				analysis_profile_digest: z.string().nullable()
			})),
			unknowns: z.array(z.strictObject({
				procedure: z.string(),
				address: z.string().nullable(),
				reason: z.string()
			})),
			total_nodes: z.int().nonnegative(),
			total_edges: z.int().nonnegative(),
			decompilations: z.int().nonnegative(),
			next_offset: z.int().nonnegative().nullable(),
			truncated: z.boolean(),
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/domain/native/nativeInstruction.js
var nativeInstructionInputSchema, reference, nativeInstructionSchema, nativeCallTargetsSchema;
function init_nativeInstruction() {
	return (init_nativeInstruction = __esmMin((() => {
		nativeInstructionInputSchema = z.strictObject({
			address: z.string().min(1),
			document: z.string().optional()
		});
		reference = z.strictObject({
			target_address: z.string(),
			type: z.string(),
			call: z.boolean(),
			jump: z.boolean(),
			indirect: z.boolean(),
			computed: z.boolean(),
			operand_index: z.int(),
			source_address: z.string().min(1).nullable().optional(),
			data: z.boolean().nullable().optional(),
			read: z.boolean().nullable().optional(),
			write: z.boolean().nullable().optional(),
			primary: z.boolean().nullable().optional().describe("Provider primary-reference status, not proof of literal addressing or a runtime access. Null or omission means unavailable."),
			provenance: z.string().min(1).nullable().optional().describe("Provider subsystem reporting this reference; null or omission means unavailable."),
			source: z.string().min(1).nullable().optional().describe("Provider reference origin, such as analysis, default, imported or user_defined; null or omission means unavailable.")
		});
		nativeInstructionSchema = z.strictObject({
			address: z.string(),
			status: z.enum([
				"decoded",
				"not-instruction-boundary",
				"data",
				"undecodable",
				"outside-memory"
			]),
			procedure: z.string().nullable(),
			architecture: z.string(),
			mode: z.string().describe("Provider-reported mode label. Per-address decoder context, when available, is reported separately; a program-wide label does not establish runtime encoding mode."),
			decoder_context: z.array(z.strictObject({
				register: z.string().min(1),
				value: z.string().min(1).nullable(),
				source: z.string().min(1)
			})).optional().describe("Observed per-address decoder context. Null means no value was available; omission means the provider or older capture does not expose this facet. The separate mode field retains the program language variant."),
			bytes: z.string().nullable(),
			length: z.int().positive().nullable(),
			mnemonic: z.string().nullable(),
			raw_disassembly: z.string().nullable(),
			operands: z.array(z.strictObject({
				index: z.int().nonnegative(),
				raw: z.string(),
				provider_type: z.int(),
				components: z.array(z.strictObject({
					kind: z.enum([
						"register",
						"immediate",
						"address",
						"unknown"
					]),
					text: z.string(),
					value: z.string().nullable(),
					bit_width: z.int().nonnegative().nullable()
				})),
				memory_addressing: z.literal("unavailable")
			})),
			flow: z.strictObject({
				kind: z.enum([
					"call",
					"jump",
					"return",
					"fallthrough",
					"terminal",
					"unavailable"
				]),
				conditional: z.boolean(),
				computed: z.boolean(),
				direct_destinations: z.array(z.string()),
				classification_evidence: z.array(z.strictObject({
					source: z.string().min(1),
					value: z.string().min(1)
				})).optional().describe("Observed provider facts used to classify flow; older captures or other providers may omit them.")
			}),
			references: z.array(reference),
			incoming_references: z.array(reference).nullable().optional().describe("Static references to this exact code or data address, excluding synthetic entry-point references. An empty array means the provider examined the address and found none; null or omission means unavailable. Analyzer references do not prove literal addressing or runtime access."),
			limitations: z.array(z.string())
		});
		nativeCallTargetsSchema = z.strictObject({
			call_site: z.string(),
			procedure: z.string().nullable(),
			status: z.enum([
				"direct",
				"resolved-indirect",
				"ambiguous",
				"unresolved",
				"not-call",
				"unavailable"
			]),
			mechanism: z.enum([
				"direct",
				"computed",
				"indirect",
				"unavailable"
			]),
			targets: z.array(z.strictObject({
				address: z.string(),
				procedure: z.string().nullable(),
				status: z.enum([
					"direct",
					"resolved-indirect",
					"candidate"
				]),
				basis: z.literal("provider-reference"),
				references: z.array(reference)
			})),
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/domain/apple/dyldPaths.js
var MAX_SYMLINK_HOPS, resolveTreePath, segmentsOf, directoryOf, joinPath, expandPrefix, COMPATIBLE_ARCHITECTURES, ARM32_CPU_TYPE, ARM32_SUBTYPE_PREFERENCES, compatibleSlice;
function init_dyldPaths() {
	return (init_dyldPaths = __esmMin((() => {
		init_machoCpuIdentity();
		MAX_SYMLINK_HOPS = 32;
		resolveTreePath = async (view, input) => {
			const pending = segmentsOf(input);
			const resolved = [];
			let last;
			let hops = 0;
			while (pending.length > 0) {
				const segment = pending.shift() ?? "";
				if (segment === ".") continue;
				if (segment === "..") {
					if (resolved.length === 0) return { kind: "escapes" };
					resolved.pop();
					last = { kind: "directory" };
					continue;
				}
				const path = [...resolved, segment].join("/");
				const entry = await view.entry(path);
				if (entry === undefined) return { kind: "absent" };
				if (entry.kind === "symlink") {
					hops += 1;
					if (hops > MAX_SYMLINK_HOPS) return { kind: "absent" };
					if (entry.target.startsWith("/")) return { kind: "escapes" };
					pending.unshift(...segmentsOf(entry.target));
					continue;
				}
				if (entry.kind === "file" && pending.length > 0) return { kind: "absent" };
				resolved.push(segment);
				last = entry;
			}
			return last?.kind === "file" ? {
				kind: "file",
				path: resolved.join("/")
			} : { kind: "not-file" };
		};
		segmentsOf = (path) => {
			const segments = path.split("/").filter((segment) => segment !== "");
			if (path.endsWith("/")) segments.push(".");
			return segments;
		};
		directoryOf = (path) => {
			const index = path.lastIndexOf("/");
			return index < 0 ? "" : path.slice(0, index);
		};
		joinPath = (directory, rest) => directory === "" ? rest : rest === "" ? directory : `${directory}/${rest}`;
		expandPrefix = (raw, context) => {
			const variable = /^@(executable_path|loader_path)(?:\/(.*))?$/su.exec(raw);
			if (variable !== null) {
				const rest = variable[2] ?? "";
				if (variable[1] === "loader_path") return {
					scope: "target",
					path: joinPath(context.ownerDirectory, rest)
				};
				return context.executable === null ? {
					scope: "undetermined",
					path: raw
				} : {
					scope: "target",
					path: joinPath(directoryOf(context.executable), rest)
				};
			}
			if (raw.startsWith("/")) {
				const lookupPath = context.rootRelativePath(raw);
				return lookupPath === undefined ? {
					scope: "outside",
					path: raw
				} : {
					scope: "target",
					path: raw,
					lookupPath
				};
			}
			return {
				scope: "undetermined",
				path: raw
			};
		};
		COMPATIBLE_ARCHITECTURES = { x86_64h: ["x86_64h", "x86_64"] };
		ARM32_CPU_TYPE = 12;
		ARM32_SUBTYPE_PREFERENCES = {
			0: [0],
			5: [5, 0],
			6: [
				6,
				7,
				5,
				0
			],
			7: [
				7,
				5,
				0
			],
			8: [
				8,
				7,
				5,
				0
			],
			9: [
				9,
				6,
				7,
				5,
				0
			],
			10: [
				10,
				9,
				6,
				7,
				5,
				0
			],
			11: [
				11,
				9,
				10,
				6,
				7,
				5,
				0
			],
			12: [12]
		};
		compatibleSlice = (slices, process) => {
			if (process.cpu_type === ARM32_CPU_TYPE) {
				const subtype = machoCpuSubtypeBase(process.cpu_subtype);
				const preferences = ARM32_SUBTYPE_PREFERENCES[subtype];
				if (preferences === undefined) return slices.some((item) => item.cpu_type === ARM32_CPU_TYPE) ? { kind: "unknown" } : { kind: "missing" };
				for (const preferredSubtype of preferences) {
					const slice = slices.find((item) => item.cpu_type === ARM32_CPU_TYPE && machoCpuSubtypeBase(item.cpu_subtype) === preferredSubtype);
					if (slice !== undefined) return {
						kind: "selected",
						slice
					};
				}
				return { kind: "missing" };
			}
			const processFamily = machoArchitectureFamily(process.architecture);
			for (const architecture of COMPATIBLE_ARCHITECTURES[processFamily] ?? [processFamily]) {
				const slice = slices.find((item) => machoArchitectureFamily(item.architecture) === architecture && (processFamily !== "arm64e" || item.cpu_type === process.cpu_type && machoCpuSubtypeBase(item.cpu_subtype) === machoCpuSubtypeBase(process.cpu_subtype)));
				if (slice !== undefined) return {
					kind: "selected",
					slice
				};
			}
			return { kind: "missing" };
		};
	})))();
}

//#endregion
//#region dist/domain/apple/dyldEnvironment.js
var embeddedDyldOverrides, overrideEffect, isFrameworkInstallName, hasApplicableDyldOverrides;
function init_dyldEnvironment() {
	return (init_dyldEnvironment = __esmMin((() => {
		embeddedDyldOverrides = (environment, platforms) => {
			const overrides = [];
			for (const setting of environment) {
				const delimiter = setting.indexOf("=");
				if (delimiter <= 0) continue;
				const variable = setting.slice(0, delimiter);
				const value = setting.slice(delimiter + 1);
				const effect = overrideEffect(variable, value);
				if (effect === undefined) continue;
				if (variable === "DYLD_ROOT_PATH" && platforms.length > 0 && platforms.every((platform) => platform >= 1 && platform <= 12) && !platforms.some((platform) => [
					7,
					8,
					9,
					12
				].includes(platform))) continue;
				overrides.push({
					variable,
					value,
					...effect
				});
			}
			return overrides;
		};
		overrideEffect = (variable, value) => {
			switch (variable) {
				case "DYLD_LIBRARY_PATH": return {
					phase: "override",
					scope: "library"
				};
				case "DYLD_FRAMEWORK_PATH": return {
					phase: "override",
					scope: "framework"
				};
				case "DYLD_FALLBACK_LIBRARY_PATH": return {
					phase: "fallback",
					scope: "library"
				};
				case "DYLD_FALLBACK_FRAMEWORK_PATH": return {
					phase: "fallback",
					scope: "framework"
				};
				case "DYLD_VERSIONED_LIBRARY_PATH":
				case "DYLD_VERSIONED_FRAMEWORK_PATH":
				case "DYLD_IMAGE_SUFFIX": return /[^:]/u.test(value) ? {
					phase: "override",
					scope: "all"
				} : undefined;
				case "DYLD_INSERT_LIBRARIES": return value === "" ? undefined : {
					phase: "override",
					scope: "all"
				};
				case "DYLD_ROOT_PATH":
				case "DYLD_OVERLAY_PATH": return value === "" ? undefined : {
					phase: "override",
					scope: "prefix"
				};
				default: return undefined;
			}
		};
		isFrameworkInstallName = (name, overrides) => {
			const separator = name.lastIndexOf(".framework/");
			if (separator < 0) return false;
			const framework = name.slice(0, separator).split("/").at(-1);
			const leaf = name.slice(name.lastIndexOf("/") + 1);
			return leaf === framework || overrides.some(({ variable, value }) => variable === "DYLD_IMAGE_SUFFIX" && leaf === `${framework}${value}`);
		};
		hasApplicableDyldOverrides = (overrides, installName, ordinarySearchFoundImage) => {
			const kind = isFrameworkInstallName(installName, overrides) ? "framework" : "library";
			return overrides.some(({ phase, scope }) => (phase === "override" || !ordinarySearchFoundImage) && (scope === "all" || scope === kind || scope === "prefix" && !installName.startsWith("@")));
		};
	})))();
}

//#endregion
//#region dist/domain/apple/dylibResolutionFindings.js
var isLazyLoadCommand, deriveFindings, unresolvedFinding, missingCandidateExplanation, candidateRejection, dependencyPhrase, lazyConsequence, DYLIB_RESOLUTION_LIMITATIONS;
function init_dylibResolutionFindings() {
	return (init_dylibResolutionFindings = __esmMin((() => {
		isLazyLoadCommand = (command) => command === "LC_LAZY_LOAD_DYLIB" || command === "LC_LAZY_LOAD_DYLIB_INFO";
		deriveFindings = (edges, roots) => {
			const findings = [];
			edges.forEach((edge, index) => {
				if (edge.resolution.status === "unresolved") findings.push(unresolvedFinding(edge, index));
				const resolvedAt = edge.candidates.findIndex(({ outcome }) => outcome === "resolved");
				const earlier = edge.candidates.slice(0, Math.max(resolvedAt, 0)).filter(({ source, outcome }) => source === "rpath" && outcome === "absent").map(({ path }) => path);
				if (resolvedAt > 0 && earlier.length > 0) findings.push({
					kind: "earlier-rpath-candidate-absent",
					edge_index: index,
					image: edge.loader,
					basis: "derived",
					explanation: `The modeled dyld search checks ${earlier.join(", ")} before ${edge.resolution.image ?? edge.install_name}. A compatible Mach-O placed at an earlier modeled path could take precedence over that fallback, subject to unmodeled search inputs and code-signing library validation; library validation is not evaluated here (see inspect_signature).${edge.loader_conditional ? " This loader loads only conditionally; if it never loads, this search never occurs." : ""}${edge.resolution.status === "conditional" ? " Unmodeled environment overrides or earlier unknown candidates may take precedence; placing an image at this rpath does not establish which image dyld will load." : ""}`
				});
			});
			for (const { image, slice } of roots) {
				const { architecture } = slice;
				const environment = slice.dyld_environment;
				if (environment.length > 0) findings.push({
					kind: "dyld-environment-present",
					edge_index: null,
					image,
					basis: "derived",
					explanation: slice.file_type === "execute" ? `${image} (${architecture}) sets dyld environment variables through LC_DYLD_ENVIRONMENT (${environment.join(", ")}); any image-selection overrides they request are not modeled. Diagnostic settings alone do not alter resolution.` : `${image} (${architecture}) contains LC_DYLD_ENVIRONMENT (${environment.join(", ")}). Dyld reads these commands only from the main executable; entries in this non-executable root are observations and do not alter resolution.`
				});
			}
			return findings;
		};
		unresolvedFinding = (edge, index) => {
			const base = {
				edge_index: index,
				image: edge.loader,
				basis: "derived"
			};
			const lazy = isLazyLoadCommand(edge.command);
			const missing = missingCandidateExplanation(edge, dependencyPhrase(edge, lazy));
			const when = edge.loader_conditional ? `. ${edge.loader} loads only conditionally; if it loads, ` : "; ";
			if (lazy) return {
				...base,
				kind: "lazy-load-unresolved",
				explanation: `${missing}${when}${lazyConsequence(edge.weak)}`
			};
			return edge.weak ? {
				...base,
				kind: "weak-load-unresolved",
				explanation: `${missing}${when}dyld continues without it.`
			} : {
				...base,
				kind: "required-load-unresolved",
				explanation: `${missing}${when}dyld would fail to load this required dependency for ${edge.root} (${edge.architecture}) unless the image is supplied elsewhere.`
			};
		};
		missingCandidateExplanation = (edge, dependency) => {
			const present = edge.candidates.flatMap(({ outcome, resolved_path }) => resolved_path === null ? [] : [{
				outcome,
				path: resolved_path
			}]);
			if (present.length === 0) return `No candidate for ${dependency} exists in the analyzed root`;
			const descriptions = present.map(({ outcome, path }) => `${path} (${candidateRejection(outcome)})`);
			return `No usable candidate for ${dependency} exists in the analyzed root; found ${descriptions.join(", ")}`;
		};
		candidateRejection = (outcome) => {
			switch (outcome) {
				case "not-mach-o": return "not a Mach-O image";
				case "malformed": return "malformed";
				case "architecture-missing": return "missing the process architecture";
				case "not-loadable": return "not a loadable dylib";
				case "platform-mismatch": return "incompatible with the process platform";
				case "unsupported": return "unsupported by the parser";
				case "resolved": return "loadable";
				case "absent": return "absent";
				case "outside-target": return "outside the analyzed root";
				case "escapes-target": return "escapes the analyzed root";
				case "undetermined": return "of undetermined loadability";
			}
		};
		dependencyPhrase = (edge, lazy) => {
			if (lazy && edge.weak) return `lazily loaded weak dependency ${edge.install_name}`;
			if (lazy) return `lazily loaded ${edge.install_name}`;
			if (edge.weak) return `weak dependency ${edge.install_name}`;
			return edge.install_name;
		};
		lazyConsequence = (weak) => weak ? "dyld loads it on first use and continues if it is absent." : "dyld loads it on first use, which would fail unless the image is supplied elsewhere.";
		DYLIB_RESOLUTION_LIMITATIONS = [
			"LC_LAZY_LOAD_DYLIB and LC_LAZY_LOAD_DYLIB_INFO dependencies are resolved but not traversed, because dyld loads them only on first use.",
			"Slices are matched by dyld's graded architectures (an x86_64h process also loads x86_64). arm64e processes that disable pointer authentication can also load arm64 slices; that fallback is not modeled.",
			"Absolute install names and rpaths are outside the analyzed root and are not evaluated, including /System and /usr/lib libraries that the dyld shared cache usually provides.",
			"Leaf and relative install names depend on dyld fallback paths, DYLD_* variables, and the working directory; they are undetermined.",
			"Load order follows dyld's dependents-first traversal in load-command order. An image reached through several chains is resolved once per process, with the rpath stack and conditionality of the first chain; a later @rpath request whose install name matches an already loaded image reuses it.",
			"@loader_path uses each image's symlink-resolved path within the analyzed root.",
			"Code-signing checks that can reject a found image, such as library validation and the hardened runtime, are not evaluated.",
			"Dylib compatibility versions are not compared. Apple's linker documentation describes a load-time rejection when an image's compatibility version is older than the loader requires, but dyld on macOS 26 was observed to load such an image."
		];
	})))();
}

//#endregion
//#region dist/domain/apple/dylibResolution.js
var ROOT_RELATIVE_PATH, rootRelativePathSchema, dylibResolutionInputSchema, dependencyCommandSchema, IMPLICIT_MACOS_PLATFORM, MACOS_DYLD_IMPLICIT_PLATFORM_CPU_TYPES, dependencySchema, machoSliceSchema, machoImageSlices, candidateSchema, edgeSchema, findingSchema, imageSchema, dylibResolutionResultSchema, expandCandidatePath, appendRpath, candidateTemplates, evaluateCandidate, platformLoadability, imageLoadabilityForPlatform, isKnownPlatform, imageFacts, resolution, resolveDependency, traceProcess, projectTraceResult, traceDylibLoading, withoutDependencies, compare;
function init_dylibResolution() {
	return (init_dylibResolution = __esmMin((() => {
		init_machoCpuIdentity();
		init_analysisErrorCore();
		init_dyldPaths();
		init_digests();
		init_dyldEnvironment();
		init_dylibResolutionFindings();
		ROOT_RELATIVE_PATH = /^(?:[^\x2f\\\x00.][^\x2f\\\x00]*|\.[^\x2f\\\x00.][^\x2f\\\x00]*|\.\.[^\x2f\\\x00]+)(?:\x2f(?:[^\x2f\\\x00.][^\x2f\\\x00]*|\.[^\x2f\\\x00.][^\x2f\\\x00]*|\.\.[^\x2f\\\x00]+))*$/u;
		rootRelativePathSchema = z.string().min(1).regex(ROOT_RELATIVE_PATH, "Use a normalized path relative to the analyzed root, without a leading or trailing '/', '//', or '.' and '..' segments");
		dylibResolutionInputSchema = z.strictObject({
			roots: z.array(rootRelativePathSchema).min(1).optional(),
			architecture: z.enum([
				"arm64",
				"arm64e",
				"x86_64"
			]).optional()
		});
		dependencyCommandSchema = z.enum([
			"LC_LOAD_DYLIB",
			"LC_LOAD_WEAK_DYLIB",
			"LC_REEXPORT_DYLIB",
			"LC_LAZY_LOAD_DYLIB",
			"LC_LAZY_LOAD_DYLIB_INFO",
			"LC_LOAD_UPWARD_DYLIB"
		]);
		IMPLICIT_MACOS_PLATFORM = 1;
		MACOS_DYLD_IMPLICIT_PLATFORM_CPU_TYPES = new Set([
			7,
			16777223,
			16777228
		]);
		dependencySchema = z.strictObject({
			command: dependencyCommandSchema,
			encoding: z.enum([
				"dylib_command",
				"dylib_use_command",
				"lazy_load_dylib_info"
			]),
			install_name: z.string(),
			weak: z.boolean(),
			upward: z.boolean(),
			reexport: z.boolean(),
			delayed_init: z.boolean(),
			/**
			* Null for `lazy_load_dylib_info`: that payload has no version fields.
			* Classic dylib commands still carry both versions.
			*/
			current_version: z.string().nullable(),
			compatibility_version: z.string().nullable()
		});
		machoSliceSchema = z.strictObject({
			architecture: z.string().min(1),
			hidden: z.boolean().exactOptional(),
			/** Physical identity observed in the thin header and, for FAT, its table. */
			slice_offset: z.int().nonnegative(),
			slice_size: z.int().positive(),
			cpu_type: z.int().nonnegative(),
			cpu_subtype: z.int().nonnegative(),
			fat_cpu_type: z.int().nonnegative().nullable(),
			fat_cpu_subtype: z.int().nonnegative().nullable(),
			fat_alignment_exponent: z.int().nonnegative().nullable(),
			file_type: z.enum([
				"execute",
				"dylib",
				"bundle",
				"other"
			]),
			file_type_code: z.int().nonnegative(),
			/** Raw LC_BUILD_VERSION platform number; null means no such command was observed. */
			platform: z.int().nonnegative().nullable(),
			/** Every distinct build platform declared by LC_BUILD_VERSION/version-min commands. */
			platforms: z.array(z.int().nonnegative()),
			install_name: z.string().nullable(),
			dependencies: z.array(dependencySchema),
			rpaths: z.array(z.string()),
			dyld_environment: z.array(z.string()),
			code_signature_present: z.boolean()
		});
		machoImageSlices = (facts) => facts.hiddenSlices === undefined ? facts.slices : [...facts.slices, ...facts.hiddenSlices];
		candidateSchema = z.strictObject({
			path: z.string(),
			source: z.enum([
				"literal",
				"executable_path",
				"loader_path",
				"rpath",
				"already-loaded"
			]),
			rpath: z.string().nullable(),
			rpath_owner: z.string().nullable(),
			outcome: z.enum([
				"resolved",
				"absent",
				"not-mach-o",
				"malformed",
				"unsupported",
				"architecture-missing",
				"not-loadable",
				"platform-mismatch",
				"outside-target",
				"escapes-target",
				"undetermined"
			]),
			resolved_path: z.string().nullable(),
			platform_basis: z.enum(["macos-dyld-implicit"]).optional()
		});
		edgeSchema = z.strictObject({
			root: z.string(),
			architecture: z.string(),
			loader: z.string(),
			via: z.array(z.string()),
			...dependencySchema.shape,
			candidates: z.array(candidateSchema),
			resolution: z.strictObject({
				status: z.enum([
					"resolved",
					"conditional",
					"unresolved",
					"undetermined"
				]),
				image: z.string().nullable()
			}),
			install_name_matches: z.boolean().nullable(),
			/**
			* The loader was reached through a conditional edge, so it might not load;
			* this edge describes what happens only if it does.
			*/
			loader_conditional: z.boolean()
		});
		findingSchema = z.strictObject({
			kind: z.enum([
				"required-load-unresolved",
				"weak-load-unresolved",
				"lazy-load-unresolved",
				"earlier-rpath-candidate-absent",
				"dyld-environment-present"
			]),
			edge_index: z.int().nonnegative().nullable(),
			image: z.string().nullable(),
			basis: z.literal("derived"),
			explanation: z.string().min(1)
		});
		imageSchema = z.strictObject({
			path: z.string(),
			sha256: digestSchema,
			parse_status: z.enum([
				"parsed",
				"malformed",
				"unsupported"
			]),
			reason: z.string().nullable(),
			slices: z.array(machoSliceSchema.omit({ dependencies: true }))
		});
		dylibResolutionResultSchema = z.strictObject({
			root_path: z.string(),
			target_sha256: digestSchema,
			roots: z.array(z.strictObject({
				image: z.string(),
				architecture: z.string()
			})),
			images: z.array(imageSchema),
			edges: z.array(edgeSchema),
			findings: z.array(findingSchema),
			coverage: z.strictObject({
				status: z.enum(["complete", "partial"]),
				unparsed_images: z.array(z.string()),
				roots_without_architecture: z.array(z.string())
			}),
			limitations: z.array(z.string().min(1))
		});
		expandCandidatePath = (raw, ownerDirectory, context) => expandPrefix(raw, {
			ownerDirectory,
			executable: context.executable,
			rootRelativePath: (absolutePath) => context.view.rootRelativePath(absolutePath)
		});
		appendRpath = (base, rest) => {
			if (base === "") return rest;
			if (base === "/") return `/${rest}`;
			return `${base.replace(/\/+$/u, "")}/${rest}`;
		};
		candidateTemplates = (dependency, loader, context) => {
			const name = dependency.install_name;
			if (!name.startsWith("@rpath/")) {
				const source = name.startsWith("@executable_path") ? "executable_path" : name.startsWith("@loader_path") ? "loader_path" : "literal";
				return [{
					expansion: expandCandidatePath(name, directoryOf(loader), context),
					source,
					rpath: null,
					rpathOwner: null
				}];
			}
			const rest = name.slice("@rpath/".length);
			const owners = [...context.loaded.get(loader)?.chain ?? [loader]].reverse();
			return owners.flatMap((owner) => (context.loaded.get(owner)?.slice.rpaths ?? []).map((rpath) => {
				const base = expandCandidatePath(rpath, directoryOf(owner), context);
				const lookupPath = base.scope === "target" ? base.lookupPath : undefined;
				const expansion = {
					scope: base.scope,
					path: base.scope === "outside" || lookupPath !== undefined ? appendRpath(base.path, rest) : `${base.path}${base.path === "" ? "" : "/"}${rest}`,
					...lookupPath === undefined ? {} : { lookupPath: appendRpath(lookupPath, rest) }
				};
				return {
					expansion,
					source: "rpath",
					rpath,
					rpathOwner: owner
				};
			}));
		};
		evaluateCandidate = async (template, context) => {
			const base = {
				path: template.expansion.path,
				source: template.source,
				rpath: template.rpath,
				rpath_owner: template.rpathOwner
			};
			if (template.expansion.scope === "outside") return {
				...base,
				outcome: "outside-target",
				resolved_path: null
			};
			if (template.expansion.scope === "undetermined") return {
				...base,
				outcome: "undetermined",
				resolved_path: null
			};
			const lookup = await resolveTreePath(context.view, template.expansion.lookupPath ?? template.expansion.path);
			if (lookup.kind === "escapes") return {
				...base,
				outcome: "escapes-target",
				resolved_path: null
			};
			if (lookup.kind !== "file") return {
				...base,
				outcome: "absent",
				resolved_path: null
			};
			const facts = await imageFacts(context, lookup.path);
			let outcome;
			if (facts.status !== "parsed") outcome = facts.status;
			else {
				const selection = compatibleSlice(machoImageSlices(facts), context.processIdentity);
				if (selection.kind === "unknown") outcome = "undetermined";
				else if (selection.kind === "missing") outcome = "architecture-missing";
				else if (selection.slice.file_type_code !== 6) outcome = "not-loadable";
				else {
					const { slice } = selection;
					const platformResult = platformLoadability(context, slice);
					outcome = platformResult.outcome === "compatible" ? "resolved" : platformResult.outcome === "incompatible" ? "platform-mismatch" : "undetermined";
					if (outcome === "undetermined") context.unknownPlatformCandidates.add(lookup.path);
					if (platformResult.basis !== undefined) {
						context.implicitMacOSPlatformCandidates.add(lookup.path);
						return {
							...base,
							outcome,
							resolved_path: lookup.path,
							platform_basis: platformResult.basis
						};
					}
				}
			}
			return {
				...base,
				outcome,
				resolved_path: lookup.path
			};
		};
		platformLoadability = (context, image) => {
			const { platforms: processPlatforms } = context;
			const { file_type_code: fileType, platforms: imagePlatforms } = image;
			let effectiveImagePlatforms = imagePlatforms;
			let basis;
			if (imagePlatforms.length === 0) {
				if (context.executable !== null && processPlatforms.length === 1 && processPlatforms[0] === IMPLICIT_MACOS_PLATFORM && MACOS_DYLD_IMPLICIT_PLATFORM_CPU_TYPES.has(image.cpu_type)) {
					effectiveImagePlatforms = [IMPLICIT_MACOS_PLATFORM];
					basis = "macos-dyld-implicit";
				} else return { outcome: "unknown" };
			}
			if (processPlatforms.length === 0) return { outcome: "unknown" };
			const outcomes = processPlatforms.map((processPlatform) => imageLoadabilityForPlatform(processPlatform, effectiveImagePlatforms, fileType, image.architecture));
			if (outcomes.every((outcome) => outcome === "compatible")) return {
				outcome: "compatible",
				...basis === undefined ? {} : { basis }
			};
			if (outcomes.every((outcome) => outcome === "incompatible")) return {
				outcome: "incompatible",
				...basis === undefined ? {} : { basis }
			};
			return {
				outcome: "unknown",
				...basis === undefined ? {} : { basis }
			};
		};
		imageLoadabilityForPlatform = (processPlatform, imagePlatforms, fileType, architecture) => {
			if (imagePlatforms.includes(processPlatform)) return "compatible";
			if (processPlatform === 6 && imagePlatforms.includes(1)) return "compatible";
			if (processPlatform === 2 && imagePlatforms.includes(6)) return "compatible";
			if (processPlatform === 2 && imagePlatforms.includes(11)) return "compatible";
			if (processPlatform === 7 && imagePlatforms.includes(12)) return "compatible";
			if (processPlatform === 1 && fileType === 2 && imagePlatforms.includes(6)) return "compatible";
			if (processPlatform === 2 && imagePlatforms.includes(1) && architecture.startsWith("arm64") || [
				7,
				8,
				9
			].includes(processPlatform) && imagePlatforms.includes(1)) return "unknown";
			if (isKnownPlatform(processPlatform) && imagePlatforms.every(isKnownPlatform)) return "incompatible";
			return "unknown";
		};
		isKnownPlatform = (platform) => platform >= 1 && platform <= 12;
		imageFacts = async (context, path) => {
			const known = context.images.get(path);
			if (known !== undefined) return known;
			const facts = await context.view.image(path);
			context.images.set(path, facts);
			return facts;
		};
		resolution = (candidates) => {
			let external = false;
			for (const candidate of candidates) {
				if (candidate.outcome === "resolved") return {
					status: external ? "conditional" : "resolved",
					image: candidate.resolved_path
				};
				if (candidate.outcome === "outside-target" || candidate.outcome === "escapes-target" || candidate.outcome === "unsupported" || candidate.outcome === "undetermined") external = true;
			}
			return {
				status: external ? "undetermined" : "unresolved",
				image: null
			};
		};
		resolveDependency = async (dependency, loader, context) => {
			const current = context.loaded.get(loader);
			const chain = current?.chain ?? [loader];
			const loaded = dependency.install_name.startsWith("@rpath/") ? context.byInstallName.get(dependency.install_name) : undefined;
			const candidates = [];
			if (loaded !== undefined) candidates.push({
				path: dependency.install_name,
				source: "already-loaded",
				rpath: null,
				rpath_owner: null,
				outcome: "resolved",
				resolved_path: loaded
			});
			else for (const template of candidateTemplates(dependency, loader, context)) {
				const candidate = await evaluateCandidate(template, context);
				candidates.push(candidate);
				if (candidate.outcome === "resolved") break;
			}
			const modeled = resolution(candidates);
			const searchUnknown = loaded === undefined && hasApplicableDyldOverrides(context.searchOverrides, dependency.install_name, modeled.image !== null);
			if (searchUnknown) context.environmentRoots.add(context.root);
			const searched = searchUnknown ? {
				...modeled,
				status: modeled.image === null ? "undetermined" : "conditional"
			} : modeled;
			const resolved = loaded !== undefined && context.loaded.get(loaded)?.conditional === true && searched.status === "resolved" ? {
				...searched,
				status: "conditional"
			} : searched;
			const image = resolved.image === null ? undefined : context.images.get(resolved.image);
			const selection = image?.status === "parsed" ? compatibleSlice(machoImageSlices(image), context.processIdentity) : undefined;
			const slice = selection?.kind === "selected" ? selection.slice : undefined;
			return {
				root: context.root,
				architecture: context.processIdentity.architecture,
				loader,
				via: [...chain],
				...dependency,
				candidates,
				resolution: resolved,
				install_name_matches: slice === undefined || slice.install_name === null ? null : slice.install_name === dependency.install_name,
				loader_conditional: current?.conditional ?? false
			};
		};
		traceProcess = async (context, rootSlice, signal) => {
			const edges = [];
			context.loaded.set(context.root, {
				slice: rootSlice,
				chain: [context.root],
				conditional: false
			});
			if (rootSlice.install_name !== null && rootSlice.install_name.startsWith("@rpath/")) context.byInstallName.set(rootSlice.install_name, context.root);
			const pending = [context.root];
			while (pending.length > 0) {
				if (signal?.aborted) throw new AnalysisCancelledError("trace_dylib_resolution", { cause: signal.reason });
				const loader = pending.pop() ?? "";
				const current = context.loaded.get(loader);
				if (current === undefined) continue;
				const created = [];
				for (const dependency of current.slice.dependencies) {
					const edge = await resolveDependency(dependency, loader, context);
					edges.push(edge);
					if (isLazyLoadCommand(dependency.command)) continue;
					const image = edge.resolution.image;
					if (image === null || context.loaded.has(image)) continue;
					const facts = context.images.get(image);
					const selection = facts?.status === "parsed" ? compatibleSlice(machoImageSlices(facts), context.processIdentity) : undefined;
					if (selection?.kind !== "selected") continue;
					const { slice } = selection;
					context.loaded.set(image, {
						slice,
						chain: [...current.chain, image],
						conditional: current.conditional || edge.resolution.status === "conditional"
					});
					if (slice.install_name !== null && slice.install_name.startsWith("@rpath/") && !context.byInstallName.has(slice.install_name)) context.byInstallName.set(slice.install_name, image);
					created.push(image);
				}
				pending.push(...created.reverse());
			}
			return edges;
		};
		projectTraceResult = (input) => {
			const reported = [...input.images.entries()].filter(([, facts]) => facts.status !== "not-mach-o").sort(([left], [right]) => compare(left, right));
			const unparsed = reported.filter(([, facts]) => facts.status !== "parsed").map(([path]) => path);
			return {
				roots: input.roots,
				images: reported.map(([path, facts]) => ({
					path,
					parse_status: facts.status === "not-mach-o" ? "unsupported" : facts.status,
					reason: facts.status === "parsed" || facts.status === "not-mach-o" ? null : facts.reason,
					slices: facts.status === "parsed" ? machoImageSlices(facts).map(withoutDependencies) : []
				})),
				edges: [...input.edges],
				findings: deriveFindings(input.edges, input.rootSlices),
				coverage: {
					status: unparsed.length === 0 && input.withoutArchitecture.length === 0 && input.environmentRoots.size === 0 && input.unknownPlatformCandidates.size === 0 && input.rootEnumeration?.status !== "unknown" ? "complete" : "partial",
					unparsed_images: unparsed,
					roots_without_architecture: [...input.withoutArchitecture]
				},
				limitations: [
					...DYLIB_RESOLUTION_LIMITATIONS,
					...input.rootEnumeration?.limitations ?? [],
					...input.environmentRoots.size === 0 ? [] : [`Roots ${[...input.environmentRoots].join(", ")} request applicable image-selection inputs through LC_DYLD_ENVIRONMENT that are not modeled; affected dependencies or inserted images remain uncertain.`],
					...input.unknownPlatformCandidates.size === 0 ? [] : [`In-root dylib candidates ${[...input.unknownPlatformCandidates].sort(compare).join(", ")} have unknown platform compatibility and are not treated as incompatible. Their dependent graphs may be incomplete.`],
					...input.implicitMacOSPlatformCandidates.size === 0 ? [] : [`In-root dylib candidates ${[...input.implicitMacOSPlatformCandidates].sort(compare).join(", ")} have no observed platform load command; macOS compatibility was derived from dyld's implicit-platform rule for an executable root with explicit macOS platform and a supported CPU type. Reported platform facts remain unchanged.`]
				]
			};
		};
		traceDylibLoading = async (view, request) => {
			const images = new Map();
			for (const path of request.unclassified ?? []) images.set(path, await view.image(path));
			const roots = [];
			const rootSlices = [];
			const edges = [];
			const withoutArchitecture = [];
			const environmentRoots = new Set();
			const unknownPlatformCandidates = new Set();
			const implicitMacOSPlatformCandidates = new Set();
			for (const root of request.roots) {
				const facts = await view.image(root);
				images.set(root, facts);
				if (facts.status !== "parsed") continue;
				const slices = machoImageSlices(facts).filter(({ architecture }) => request.architecture === undefined || machoArchitectureFamily(architecture) === request.architecture);
				if (slices.length === 0) withoutArchitecture.push(root);
				for (const slice of slices) {
					const executable = slice.file_type === "execute" ? root : null;
					const searchOverrides = executable === null ? [] : embeddedDyldOverrides(slice.dyld_environment, slice.platforms);
					if (searchOverrides.some(({ variable, value }) => variable === "DYLD_INSERT_LIBRARIES" && value !== "")) environmentRoots.add(root);
					roots.push({
						image: root,
						architecture: slice.architecture
					});
					rootSlices.push({
						image: root,
						slice
					});
					edges.push(...await traceProcess({
						view,
						root,
						processIdentity: {
							architecture: slice.architecture,
							cpu_type: slice.cpu_type,
							cpu_subtype: slice.cpu_subtype
						},
						searchOverrides,
						environmentRoots,
						unknownPlatformCandidates,
						implicitMacOSPlatformCandidates,
						platforms: slice.platforms,
						executable,
						loaded: new Map(),
						byInstallName: new Map(),
						images
					}, slice, request.signal));
				}
			}
			return projectTraceResult({
				images,
				roots,
				rootSlices,
				edges,
				withoutArchitecture,
				environmentRoots,
				unknownPlatformCandidates,
				implicitMacOSPlatformCandidates,
				rootEnumeration: request.rootEnumeration
			});
		};
		withoutDependencies = (slice) => ({
			architecture: slice.architecture,
			...slice.hidden === undefined ? {} : { hidden: slice.hidden },
			slice_offset: slice.slice_offset,
			slice_size: slice.slice_size,
			cpu_type: slice.cpu_type,
			cpu_subtype: slice.cpu_subtype,
			fat_cpu_type: slice.fat_cpu_type,
			fat_cpu_subtype: slice.fat_cpu_subtype,
			fat_alignment_exponent: slice.fat_alignment_exponent,
			file_type: slice.file_type,
			file_type_code: slice.file_type_code,
			platform: slice.platform,
			platforms: slice.platforms,
			install_name: slice.install_name,
			rpaths: slice.rpaths,
			dyld_environment: slice.dyld_environment,
			code_signature_present: slice.code_signature_present
		});
		compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
	})))();
}

//#endregion
//#region dist/domain/managed/managedInspectionEvidence.js
var managedTokenScopesMatch, readManagedInspectionEvidence, integrityFailure;
function init_managedInspectionEvidence() {
	return (init_managedInspectionEvidence = __esmMin((() => {
		init_analysisErrorCore();
		init_evidenceErrors();
		init_evidenceValidation();
		init_result();
		managedTokenScopesMatch = (leftMvid, rightMvid) => leftMvid !== null && rightMvid !== null && leftMvid.toLowerCase() === rightMvid.toLowerCase();
		readManagedInspectionEvidence = (rawEvidence, operation, schema, selection) => {
			const record = readEvidence(rawEvidence);
			if (!record.ok) return record;
			const evidence = record.value;
			if (evidence.operation !== operation || evidence.predicate_type !== "rea.analysis") {
				const message = `Expected rea.analysis ${operation} Evidence, received ${evidence.predicate_type} ${evidence.operation}`;
				return err(new AnalysisInputError(selection.operation, { userMessage: message }, [{
					path: selection.path,
					reason: "invalid_value",
					message
				}]));
			}
			const payload = readEvidencePayload(schema, evidence.normalized_result);
			if (!payload.ok) return payload;
			const result = payload.value;
			const artifactSha256 = result.artifact.sha256;
			const subjectSha256 = evidence.subject?.digest.sha256;
			if (subjectSha256 !== undefined && artifactSha256 !== subjectSha256) return err(integrityFailure(`Managed Evidence ${operation} (${evidence.evidence_id}) subject SHA-256 ${subjectSha256} does not match normalized artifact SHA-256 ${artifactSha256}`));
			const scope = result.identity_scope;
			if (scope !== undefined && scope.requires_artifact_sha256 !== artifactSha256) return err(integrityFailure(`Managed Evidence ${operation} (${evidence.evidence_id}) token scope SHA-256 ${scope.requires_artifact_sha256} does not match normalized artifact SHA-256 ${artifactSha256}`));
			const moduleMvid = result.module?.mvid ?? null;
			const scopedMvid = scope?.requires_mvid;
			if (scopedMvid !== undefined && scopedMvid?.toLowerCase() !== moduleMvid?.toLowerCase()) return err(integrityFailure(`Managed Evidence ${operation} (${evidence.evidence_id}) token scope MVID ${String(scopedMvid)} does not match module MVID ${String(moduleMvid)}`));
			return ok({
				evidence,
				result
			});
		};
		integrityFailure = (message) => new EvidenceIntegrityError(message, { userMessage: message });
	})))();
}

//#endregion
//#region dist/domain/managed/managedApplicationGraphCoverage.js
var omittedRelationSites, omitsUncounted, omitsAny, completeCoverage, managedSourceCoverage, assessManagedGraphOmissions, managedGraphEvidenceCoverage, managedGraphResultCoverage;
function init_managedApplicationGraphCoverage() {
	return (init_managedApplicationGraphCoverage = __esmMin((() => {
		init_managedInspectionEvidence();
		omittedRelationSites = (omissions) => omissions === null ? 0 : [...Object.values(omissions.callSites), ...Object.values(omissions.fieldAccessSites)].reduce((total, count) => total + count, 0);
		omitsUncounted = (omissions) => omissions.partialInput || omissions.unscopedTokenRelationships || omissions.selectedTypes !== null;
		omitsAny = (omissions) => omitsUncounted(omissions) || omittedRelationSites(omissions.relations) > 0;
		completeCoverage = () => ({
			status: "complete",
			truncated: false,
			omitted_count: 0,
			limits: []
		});
		managedSourceCoverage = (state) => state === "complete" ? completeCoverage() : {
			status: state,
			truncated: false,
			omitted_count: null,
			limits: []
		};
		assessManagedGraphOmissions = (sources, relations) => ({
			relations,
			unscopedTokenRelationships: sources.members !== null && sources.boundaries !== null && (sources.boundaries.pinvoke_imports.some(({ member_token }) => member_token !== null) || sources.boundaries.native_implementations.length > 0) && !managedTokenScopesMatch(sources.members.identity_scope.requires_mvid, sources.boundaries.identity_scope.requires_mvid),
			partialInput: [
				sources.members?.coverage.state,
				sources.boundaries?.coverage.state,
				sources.artifact?.coverage.state
			].some((state) => state !== undefined && state !== "complete"),
			selectedTypes: sources.members?.selection?.type_names ?? null
		});
		managedGraphEvidenceCoverage = (omissions) => omitsAny(omissions) ? {
			status: "partial",
			truncated: false,
			omitted_count: omitsUncounted(omissions) ? null : omittedRelationSites(omissions.relations),
			limits: []
		} : completeCoverage();
		managedGraphResultCoverage = (omissions) => ({ status: omitsAny(omissions) ? "partial" : "complete-within-inputs" });
	})))();
}

//#endregion
//#region dist/domain/managed/managedApplicationGraphNodes.js
var metadataLabel, addArtifactNode, addArtifactIdentityNodes, selectModuleSource, addMemberNodes, typeNode, methodNode, fieldNode, addBoundaryNodes, pinvokeNode, nativeImplementationNode, addContainsEdge, artifactLocalIdentity, sourceManagedEvidence, projectedManagedEvidence, pinvokeAssociationEvidence, createManagedEvidence, graphArtifactPath;
function init_managedApplicationGraphNodes() {
	return (init_managedApplicationGraphNodes = __esmMin((() => {
		init_javascriptApplicationGraph();
		init_managedApplicationGraphCoverage();
		init_managedInspectionEvidence();
		metadataLabel = (name) => name === "" ? null : name;
		addArtifactNode = (state) => {
			const node = createJavaScriptApplicationNode({
				kind: "artifact",
				identity: {
					strategy: "content-digest",
					stability: "global-exact",
					sha256: state.artifactSha256
				},
				observations: [{
					label: basename(state.artifactPath),
					properties: {
						format: "pe",
						source: "managed-application-graph"
					},
					evidence: projectedManagedEvidence(state, "project-managed-artifact")
				}]
			});
			state.nodes.push(node);
			return node;
		};
		addArtifactIdentityNodes = (state, artifactNode, parsed) => {
			const artifactInput = parsed.artifact;
			if (artifactInput !== null && artifactInput.result.assembly !== null) {
				const assemblyFacts = artifactInput.result.assembly;
				const artifactEvidence = sourceManagedEvidence(state, artifactInput.evidence, artifactInput.result.coverage.state);
				const assembly = createJavaScriptApplicationNode({
					kind: "managed-assembly",
					identity: artifactLocalIdentity(state.artifactSha256, "managed-assembly", assemblyFacts.token),
					observations: [{
						label: metadataLabel(assemblyFacts.name),
						properties: {
							name: assemblyFacts.name,
							version: assemblyFacts.version,
							culture: assemblyFacts.culture,
							public_key_kind: assemblyFacts.public_key.kind
						},
						evidence: artifactEvidence
					}]
				});
				state.nodes.push(assembly);
				addContainsEdge(state, artifactNode, assembly, {
					kind: "declares-managed-assembly",
					coverage: artifactEvidence.coverage
				});
			}
			const moduleSource = selectModuleSource(parsed);
			if (moduleSource !== null) {
				const { module } = moduleSource;
				const moduleEvidence = sourceManagedEvidence(state, moduleSource.evidence, moduleSource.coverageState);
				const moduleNode = createJavaScriptApplicationNode({
					kind: "managed-module",
					identity: artifactLocalIdentity(state.artifactSha256, "managed-module", module.mvid?.toLowerCase() ?? module.token),
					observations: [{
						label: metadataLabel(module.name),
						properties: {
							name: module.name,
							mvid: module.mvid,
							generation: module.generation,
							token: module.token
						},
						evidence: moduleEvidence
					}]
				});
				state.nodes.push(moduleNode);
				addContainsEdge(state, artifactNode, moduleNode, {
					kind: "declares-managed-module",
					coverage: moduleEvidence.coverage
				});
			}
		};
		selectModuleSource = (parsed) => {
			const sources = [
				parsed.artifact?.result.module == null ? null : {
					module: parsed.artifact.result.module,
					evidence: parsed.artifact.evidence,
					coverageState: parsed.artifact.result.coverage.state
				},
				parsed.members?.result.module == null ? null : {
					module: parsed.members.result.module,
					evidence: parsed.members.evidence,
					coverageState: parsed.members.result.coverage.state
				},
				parsed.boundaries?.result.module == null ? null : {
					module: parsed.boundaries.result.module,
					evidence: parsed.boundaries.evidence,
					coverageState: parsed.boundaries.result.coverage.state
				}
			].filter((source) => source !== null);
			return sources.find(({ module }) => module.mvid !== null) ?? sources[0] ?? null;
		};
		addMemberNodes = (state, artifactNode, parsed) => {
			const memberInput = parsed.members;
			if (memberInput === null) return;
			const members = memberInput.result;
			const { types, methods, fields } = members;
			const typeCoverage = managedSourceCoverage(members.coverage.state);
			const methodCoverage = managedSourceCoverage(members.coverage.state);
			const fieldCoverage = managedSourceCoverage(members.coverage.state);
			const sourceEvidence = sourceManagedEvidence(state, memberInput.evidence, members.coverage.state);
			for (const type of types) {
				const node = typeNode(state, type, sourceEvidence);
				state.nodes.push(node);
				state.typeNodes.set(type.token, node);
				addContainsEdge(state, artifactNode, node, {
					kind: "declares-managed-type",
					coverage: typeCoverage
				});
			}
			for (const method of methods) {
				const node = methodNode(state, method, sourceEvidence);
				state.nodes.push(node);
				state.methodNodes.set(method.token, node);
				const owner = method.declaring_type_token === null ? artifactNode : state.typeNodes.get(method.declaring_type_token) ?? artifactNode;
				addContainsEdge(state, owner, node, {
					kind: "declares-managed-method",
					coverage: methodCoverage
				});
			}
			for (const field of fields) {
				const node = fieldNode(state, field, sourceEvidence);
				state.nodes.push(node);
				state.fieldNodes.set(field.token, node);
				const owner = field.declaring_type_token === null ? artifactNode : state.typeNodes.get(field.declaring_type_token) ?? artifactNode;
				addContainsEdge(state, owner, node, {
					kind: "declares-managed-field",
					coverage: fieldCoverage
				});
			}
		};
		typeNode = (state, type, evidence) => createJavaScriptApplicationNode({
			kind: "managed-type",
			identity: artifactLocalIdentity(state.artifactSha256, "managed-type-token", type.token),
			observations: [{
				label: metadataLabel(type.full_name),
				properties: {
					token: type.token,
					namespace: type.namespace,
					name: type.name,
					full_name: type.full_name,
					flags: type.flags,
					extends_token: type.extends_token
				},
				evidence
			}]
		});
		methodNode = (state, method, evidence) => createJavaScriptApplicationNode({
			kind: "managed-method",
			identity: artifactLocalIdentity(state.artifactSha256, "managed-method-token", method.token),
			observations: [{
				label: metadataLabel(method.declaring_type === null ? method.name : `${method.declaring_type}.${method.name}`),
				properties: {
					token: method.token,
					declaring_type_token: method.declaring_type_token,
					declaring_type: method.declaring_type,
					name: method.name,
					rva: method.rva,
					signature_sha256: method.signature.raw_sha256,
					signature_status: method.signature.parse_status,
					body_status: method.body.status,
					normalized_il_sha256: method.body.normalized_il_sha256,
					il_size: method.body.il_size
				},
				evidence
			}]
		});
		fieldNode = (state, field, evidence) => createJavaScriptApplicationNode({
			kind: "managed-field",
			identity: artifactLocalIdentity(state.artifactSha256, "managed-field-token", field.token),
			observations: [{
				label: metadataLabel(field.declaring_type === null ? field.name : `${field.declaring_type}.${field.name}`),
				properties: {
					token: field.token,
					declaring_type_token: field.declaring_type_token,
					declaring_type: field.declaring_type,
					name: field.name,
					flags: field.flags,
					signature_sha256: field.signature.raw_sha256,
					signature_status: field.signature.parse_status
				},
				evidence
			}]
		});
		addBoundaryNodes = (state, artifactNode, parsed) => {
			const boundaryInput = parsed.boundaries;
			if (boundaryInput === null) return;
			const boundaries = boundaryInput.result;
			const { pinvoke_imports: pinvokes, native_implementations: implementations } = boundaries;
			const pinvokeCoverage = managedSourceCoverage(boundaries.coverage.state);
			const implementationCoverage = managedSourceCoverage(boundaries.coverage.state);
			const sourceEvidence = sourceManagedEvidence(state, boundaryInput.evidence, boundaries.coverage.state);
			const canJoinMemberTokens = parsed.members !== null && managedTokenScopesMatch(parsed.members.result.identity_scope.requires_mvid, boundaries.identity_scope.requires_mvid);
			for (const pinvoke of pinvokes) {
				const node = pinvokeNode(state, pinvoke, sourceEvidence);
				state.nodes.push(node);
				const method = pinvoke.member_token === null || !canJoinMemberTokens ? undefined : state.methodNodes.get(pinvoke.member_token);
				const memberEvidence = method === undefined || parsed.members === null ? undefined : parsed.members.evidence;
				const owner = method ?? artifactNode;
				state.edges.push(createJavaScriptApplicationEdge({
					source_node_id: owner.node_id,
					target_node_id: node.node_id,
					relation: "imports",
					properties: {
						kind: "managed-pinvoke",
						import_name: pinvoke.import_name,
						import_scope_name: pinvoke.import_scope_name
					},
					evidence: pinvokeAssociationEvidence(state, boundaryInput.evidence, pinvokeCoverage, memberEvidence)
				}));
			}
			for (const implementation of implementations) {
				const node = nativeImplementationNode(state, implementation, sourceEvidence);
				state.nodes.push(node);
				const owner = (canJoinMemberTokens ? state.methodNodes.get(implementation.token) : undefined) ?? artifactNode;
				addContainsEdge(state, owner, node, {
					kind: "declares-managed-native-implementation",
					coverage: implementationCoverage
				});
			}
		};
		pinvokeNode = (state, pinvoke, evidence) => createJavaScriptApplicationNode({
			kind: "managed-pinvoke-import",
			identity: artifactLocalIdentity(state.artifactSha256, "managed-pinvoke-token", pinvoke.token),
			observations: [{
				label: metadataLabel(pinvoke.import_name),
				properties: {
					token: pinvoke.token,
					member_token: pinvoke.member_token,
					member_name: pinvoke.member_name,
					import_name: pinvoke.import_name,
					import_scope_name: pinvoke.import_scope_name,
					char_set: pinvoke.char_set,
					call_convention: pinvoke.call_convention,
					verification: pinvoke.verification
				},
				evidence
			}]
		});
		nativeImplementationNode = (state, implementation, evidence) => createJavaScriptApplicationNode({
			kind: "managed-native-implementation",
			identity: artifactLocalIdentity(state.artifactSha256, "managed-native-implementation-token", implementation.token),
			observations: [{
				label: metadataLabel(implementation.name),
				properties: {
					token: implementation.token,
					name: implementation.name,
					rva: implementation.rva,
					code_type: implementation.code_type,
					managed_kind: implementation.managed_kind,
					pinvoke_declared: implementation.pinvoke_declared,
					boundary_kind: implementation.boundary_kind,
					body_interpretation: implementation.body_interpretation
				},
				evidence
			}]
		});
		addContainsEdge = (state, source, target, options) => {
			state.edges.push(createJavaScriptApplicationEdge({
				source_node_id: source.node_id,
				target_node_id: target.node_id,
				relation: "contains",
				properties: { kind: options.kind },
				evidence: projectedManagedEvidence(state, "project-managed-contains", options.coverage)
			}));
		};
		artifactLocalIdentity = (artifactSha256, namespace, key) => ({
			strategy: "artifact-local-key",
			stability: "artifact-version",
			artifact_sha256: artifactSha256,
			namespace,
			key
		});
		sourceManagedEvidence = (state, source, coverageState) => createManagedEvidence(state, source.operation, managedSourceCoverage(coverageState), [source.evidence_id]);
		projectedManagedEvidence = (state, operation, coverage = managedSourceCoverage("complete")) => createManagedEvidence(state, operation, coverage, state.evidenceLinks);
		pinvokeAssociationEvidence = (state, boundaryEvidence, coverage, memberEvidence) => createManagedEvidence(state, boundaryEvidence.operation, coverage, [boundaryEvidence.evidence_id, ...memberEvidence === undefined ? [] : [memberEvidence.evidence_id]]);
		createManagedEvidence = (state, operation, coverage, evidenceIds) => ({
			authority: "managed-static-analysis",
			state: "observed",
			confidence: "exact",
			artifact: {
				available: true,
				artifact_id: `art_${state.artifactSha256}`,
				sha256: state.artifactSha256
			},
			location: {
				available: true,
				value: {
					kind: "artifact-path",
					path: graphArtifactPath(state.artifactPath)
				}
			},
			extractor: {
				name: "rea-dotnet-static",
				version: "1",
				operation,
				executable_sha256: null
			},
			coverage,
			limitations: coverage.status === "complete" ? [] : ["The source managed Evidence slice is incomplete; unreturned or unavailable items remain unobserved."],
			evidence_ids: [...evidenceIds]
		});
		graphArtifactPath = (path) => {
			const name = basename(path).replaceAll(/[^A-Za-z0-9._-]/gu, "_");
			return `managed/${name.length === 0 ? "artifact.pe" : name}`;
		};
	})))();
}

//#endregion
//#region dist/domain/managed/managedApplicationGraphRelations.js
var CALL_OPCODES, FIELD_ACCESS_KINDS, isMemberReference, aggregate, siteProperties, addMemberRelations, REASON_LABELS, describeOmissions, relationOmissionLimitations;
function init_managedApplicationGraphRelations() {
	return (init_managedApplicationGraphRelations = __esmMin((() => {
		init_javascriptApplicationGraph();
		init_managedApplicationGraphNodes();
		CALL_OPCODES = new Set([
			"call",
			"callvirt",
			"newobj",
			"jmp"
		]);
		FIELD_ACCESS_KINDS = {
			ldfld: "read",
			ldsfld: "read",
			stfld: "write",
			stsfld: "write",
			ldflda: "address",
			ldsflda: "address"
		};
		isMemberReference = (token) => token.toLowerCase().startsWith("0x0a");
		aggregate = (relations, source, target, opcode) => {
			const key = `${source.node_id}\u0000${target.node_id}`;
			let relation = relations.get(key);
			if (relation === undefined) {
				relation = {
					source,
					target,
					opcodes: new Map()
				};
				relations.set(key, relation);
			}
			relation.opcodes.set(opcode, (relation.opcodes.get(opcode) ?? 0) + 1);
		};
		siteProperties = (opcodes) => {
			const sorted = [...opcodes].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
			return {
				site_count: sorted.reduce((total, [, count]) => total + count, 0),
				opcodes: Object.fromEntries(sorted)
			};
		};
		addMemberRelations = (state, parsed) => {
			const memberInput = parsed.members;
			if (memberInput === null) return null;
			const members = memberInput.result;
			const callSites = {
				"member-ref": 0,
				"method-spec": 0,
				"unknown-target": 0,
				"method-reference": 0,
				"absent-node": 0,
				"self-call": 0
			};
			const fieldAccessSites = {
				"member-ref": 0,
				"absent-node": 0
			};
			const calls = new Map();
			for (const edge of members.call_edges) {
				if (edge.target_kind !== "method-def") {
					callSites[edge.target_kind === "unknown" ? "unknown-target" : edge.target_kind]++;
					continue;
				}
				if (!CALL_OPCODES.has(edge.opcode)) {
					callSites["method-reference"]++;
					continue;
				}
				const caller = state.methodNodes.get(edge.caller_token);
				const target = state.methodNodes.get(edge.target_token);
				if (caller === undefined || target === undefined) {
					callSites["absent-node"]++;
					continue;
				}
				if (caller === target) {
					callSites["self-call"]++;
					continue;
				}
				aggregate(calls, caller, target, edge.opcode);
			}
			const accesses = new Map();
			for (const access of members.field_accesses) {
				const method = state.methodNodes.get(access.method_token);
				const field = state.fieldNodes.get(access.field_token);
				if (method === undefined || field === undefined) {
					fieldAccessSites[isMemberReference(access.field_token) ? "member-ref" : "absent-node"]++;
					continue;
				}
				aggregate(accesses, method, field, access.opcode);
			}
			const evidence = sourceManagedEvidence(state, memberInput.evidence, members.coverage.state);
			for (const { source, target, opcodes } of calls.values()) state.edges.push(createJavaScriptApplicationEdge({
				source_node_id: source.node_id,
				target_node_id: target.node_id,
				relation: "calls",
				properties: {
					kind: "managed-call",
					...siteProperties(opcodes)
				},
				evidence
			}));
			for (const { source, target, opcodes } of accesses.values()) state.edges.push(createJavaScriptApplicationEdge({
				source_node_id: source.node_id,
				target_node_id: target.node_id,
				relation: "accesses",
				properties: {
					kind: "managed-field-access",
					access: [...new Set([...opcodes.keys()].map((opcode) => FIELD_ACCESS_KINDS[opcode] ?? "unknown"))].sort(),
					...siteProperties(opcodes)
				},
				evidence
			}));
			return {
				callSites,
				fieldAccessSites
			};
		};
		REASON_LABELS = {
			"member-ref": "member-reference",
			"method-spec": "generic method-instantiation",
			"unknown-target": "unknown-target",
			"method-reference": "function-pointer (ldftn/ldvirtftn)",
			"absent-node": "missing-node",
			"self-call": "recursive self-call"
		};
		describeOmissions = (counts) => Object.entries(counts).filter(([, count]) => count > 0).map(([reason, count]) => `${String(count)} ${REASON_LABELS[reason]}`).join(", ");
		relationOmissionLimitations = (omissions) => {
			if (omissions === null) return [];
			const calls = describeOmissions(omissions.callSites);
			const fields = describeOmissions(omissions.fieldAccessSites);
			return [...calls === "" ? [] : [`Calls edges link only method nodes in the inspected module; these call sites are omitted: ${calls}.`], ...fields === "" ? [] : [`Accesses edges link only method and field nodes in the inspected module; these field-access sites are omitted: ${fields}.`]];
		};
	})))();
}

//#endregion
//#region dist/domain/managed/managedApplicationGraph.js
var evidenceIdSchema$4, textSchema$2, managedGraphRequestSchema, managedApplicationGraphResultSchema, projectManagedGraph, countNodes, countEdges, readManagedGraphProjection, OPERATION, chooseArtifact, artifactMismatch, moduleIdentityMismatch, projectionLimitations;
function init_managedApplicationGraph() {
	return (init_managedApplicationGraph = __esmMin((() => {
		init_javascriptApplicationGraph();
		init_managedArtifact();
		init_canonicalDigest();
		init_managedApplicationGraphCoverage();
		init_managedApplicationGraphNodes();
		init_managedApplicationGraphRelations();
		init_digests();
		init_managedInspectionEvidence();
		init_analysisErrorCore();
		init_inputIssueProjection();
		init_result();
		evidenceIdSchema$4 = prefixedDigestSchema("ev");
		textSchema$2 = z.string().min(1);
		managedGraphRequestSchema = z.strictObject({
			managed_artifact: z.unknown().optional(),
			managed_members: z.unknown().optional(),
			managed_native_boundaries: z.unknown().optional()
		}).superRefine((input, context) => {
			if (input.managed_artifact === undefined && input.managed_members === undefined && input.managed_native_boundaries === undefined) context.addIssue({
				code: "custom",
				message: "At least one managed artifact, member, or native-boundary Evidence record is required"
			});
		});
		managedApplicationGraphResultSchema = z.strictObject({
			projection_id: prefixedDigestSchema("magp"),
			root_artifact_sha256: digestSchema,
			source_evidence: z.strictObject({
				managed_artifact_evidence_id: evidenceIdSchema$4.nullable(),
				managed_members_evidence_id: evidenceIdSchema$4.nullable(),
				managed_native_boundaries_evidence_id: evidenceIdSchema$4.nullable()
			}),
			summary: z.strictObject({
				graph_nodes: z.int().min(0),
				graph_edges: z.int().min(0),
				assemblies: z.int().min(0),
				modules: z.int().min(0),
				types: z.int().min(0),
				methods: z.int().min(0),
				fields: z.int().min(0),
				pinvoke_imports: z.int().min(0),
				native_implementations: z.int().min(0),
				calls: z.int().min(0).nullable().default(null).describe("calls edges; null for graphs projected before calls edges"),
				field_accesses: z.int().min(0).nullable().default(null).describe("accesses edges; null for graphs projected before accesses edges")
			}),
			graph: javascriptApplicationGraphSchema,
			coverage: z.strictObject({ status: z.enum(["complete-within-inputs", "partial"]) }),
			evidence_links: z.array(evidenceIdSchema$4).min(1).max(3),
			limitations: z.array(textSchema$2)
		});
		projectManagedGraph = (request) => {
			const { sources: parsed, artifact: artifactIdentity } = request;
			const evidenceLinks = [
				parsed.artifact?.evidence.evidence_id,
				parsed.members?.evidence.evidence_id,
				parsed.boundaries?.evidence.evidence_id
			].filter((id) => id !== undefined);
			const state = {
				nodes: [],
				edges: [],
				artifactSha256: artifactIdentity.sha256,
				artifactPath: artifactIdentity.path,
				evidenceLinks,
				typeNodes: new Map(),
				methodNodes: new Map(),
				fieldNodes: new Map()
			};
			const artifactNode = addArtifactNode(state);
			addArtifactIdentityNodes(state, artifactNode, parsed);
			addMemberNodes(state, artifactNode, parsed);
			addBoundaryNodes(state, artifactNode, parsed);
			const relations = addMemberRelations(state, parsed);
			const omissions = assessManagedGraphOmissions({
				artifact: parsed.artifact?.result ?? null,
				members: parsed.members?.result ?? null,
				boundaries: parsed.boundaries?.result ?? null
			}, relations);
			const limitations = projectionLimitations(parsed, omissions);
			const graph = createJavaScriptApplicationGraph({
				schema: "JavaScriptApplicationGraph",
				root_node_ids: [artifactNode.node_id],
				nodes: state.nodes,
				edges: state.edges,
				coverage: managedGraphEvidenceCoverage(omissions),
				limitations
			});
			const withoutId = {
				root_artifact_sha256: state.artifactSha256,
				source_evidence: {
					managed_artifact_evidence_id: parsed.artifact?.evidence.evidence_id ?? null,
					managed_members_evidence_id: parsed.members?.evidence.evidence_id ?? null,
					managed_native_boundaries_evidence_id: parsed.boundaries?.evidence.evidence_id ?? null
				},
				summary: {
					graph_nodes: graph.nodes.length,
					graph_edges: graph.edges.length,
					assemblies: countNodes(graph.nodes, "managed-assembly"),
					modules: countNodes(graph.nodes, "managed-module"),
					types: countNodes(graph.nodes, "managed-type"),
					methods: countNodes(graph.nodes, "managed-method"),
					fields: countNodes(graph.nodes, "managed-field"),
					pinvoke_imports: countNodes(graph.nodes, "managed-pinvoke-import"),
					native_implementations: countNodes(graph.nodes, "managed-native-implementation"),
					calls: countEdges(graph.edges, "calls"),
					field_accesses: countEdges(graph.edges, "accesses")
				},
				graph,
				coverage: managedGraphResultCoverage(omissions),
				evidence_links: evidenceLinks,
				limitations
			};
			return managedApplicationGraphResultSchema.parse({
				...withoutId,
				projection_id: `magp_${digestCanonicalValue(withoutId, "Managed application graph")}`
			});
		};
		countNodes = (nodes, kind) => nodes.filter((node) => node.kind === kind).length;
		countEdges = (edges, relation) => edges.filter((edge) => edge.relation === relation).length;
		readManagedGraphProjection = (input) => {
			const frame = managedGraphRequestSchema.safeParse(input);
			if (!frame.success) return err(analysisInputErrorFromIssues(OPERATION, frame.error.issues, input, { cause: frame.error }));
			const { managed_artifact, managed_members, managed_native_boundaries } = frame.data;
			const artifact = managed_artifact === undefined ? ok(null) : readManagedInspectionEvidence(managed_artifact, "inspect_managed_artifact", managedArtifactInspectionSchema, {
				operation: OPERATION,
				path: ["managed_artifact"]
			});
			if (!artifact.ok) return artifact;
			const members = managed_members === undefined ? ok(null) : readManagedInspectionEvidence(managed_members, "inspect_managed_members", managedMemberInspectionSchema, {
				operation: OPERATION,
				path: ["managed_members"]
			});
			if (!members.ok) return members;
			const boundaries = managed_native_boundaries === undefined ? ok(null) : readManagedInspectionEvidence(managed_native_boundaries, "inspect_managed_native_boundaries", managedNativeBoundaryInspectionSchema, {
				operation: OPERATION,
				path: ["managed_native_boundaries"]
			});
			if (!boundaries.ok) return boundaries;
			const sources = {
				artifact: artifact.value,
				members: members.value,
				boundaries: boundaries.value
			};
			const identity = chooseArtifact(sources);
			const mismatch = artifactMismatch(sources, identity.sha256) ?? moduleIdentityMismatch(sources);
			if (mismatch !== null) return err(new AnalysisInputError(OPERATION, { userMessage: mismatch }, [{
				path: [],
				reason: "invalid_value",
				message: mismatch
			}]));
			return ok({
				sources,
				artifact: identity
			});
		};
		OPERATION = "project_managed_application_graph";
		chooseArtifact = (parsed) => {
			const result = parsed.artifact?.result ?? parsed.members?.result ?? parsed.boundaries?.result;
			if (result === undefined) throw new Error("Validated managed graph projection has no source");
			return {
				sha256: result.artifact.sha256,
				path: result.artifact.path
			};
		};
		artifactMismatch = (parsed, sha256Value) => {
			for (const result of [
				parsed.artifact?.result,
				parsed.members?.result,
				parsed.boundaries?.result
			]) if (result !== undefined && result.artifact.sha256 !== sha256Value) return "Managed graph projection inputs must describe the same artifact SHA-256";
			return null;
		};
		moduleIdentityMismatch = (parsed) => {
			const mvidClaims = [
				parsed.artifact?.result.module?.mvid,
				parsed.members?.result.module?.mvid,
				parsed.members?.result.identity_scope.requires_mvid,
				parsed.boundaries?.result.module?.mvid,
				parsed.boundaries?.result.identity_scope.requires_mvid
			].filter((mvid) => mvid !== undefined && mvid !== null).map((mvid) => mvid.toLowerCase());
			if (new Set(mvidClaims).size > 1) return "Managed graph inputs report conflicting known module MVIDs or token scopes";
			const modules = [
				parsed.artifact?.result.module,
				parsed.members?.result.module,
				parsed.boundaries?.result.module
			].filter((module) => module !== undefined && module !== null);
			for (const field of [
				"name",
				"generation",
				"token",
				"row_offset"
			]) {
				const values = new Set(modules.map((module) => module[field]));
				if (values.size > 1) return `Managed graph inputs report conflicting module ${field} values`;
			}
			for (const field of ["enc_id", "enc_base_id"]) {
				const values = new Set(modules.map((module) => module[field]?.toLowerCase()).filter((value) => value !== undefined));
				if (values.size > 1) return `Managed graph inputs report conflicting module ${field} values`;
			}
			return null;
		};
		projectionLimitations = (parsed, omissions) => [
			"Managed graph projection preserves static metadata observations only; it does not execute managed code, load assemblies, or map managed tokens to native addresses.",
			...parsed.members === null ? ["Managed member Evidence was not supplied; type, method, and field nodes are absent."] : [],
			...parsed.artifact === null ? ["Managed artifact Evidence was not supplied; assembly identity observations are absent."] : [],
			...parsed.boundaries === null ? ["Managed native-boundary Evidence was not supplied; P/Invoke and native-implementation nodes are absent."] : [],
			...omissions.partialInput ? ["At least one supplied managed Evidence record has partial coverage."] : [],
			...omissions.selectedTypes === null ? [] : [`Managed member Evidence selected only these declaring types: ${omissions.selectedTypes.join(", ")}; type, method, and field nodes of other types are omitted, not absent.`],
			...omissions.unscopedTokenRelationships ? ["Managed boundary tokens were not linked to member nodes because matching module MVID scope was not established."] : [],
			...relationOmissionLimitations(omissions.relations)
		];
	})))();
}

//#endregion
//#region dist/contracts/decompileDirectory.js
var DECOMPILE_DIRECTORY_JOURNAL_NAME, DECOMPILE_DIRECTORY_INDEX_NAME, DECOMPILE_DIRECTORY_FUNCTIONS_DIRECTORY, DECOMPILE_DIRECTORY_VERSION, DECOMPILE_DIRECTORY_INLINE_FAILURE_LIMIT, DECOMPILE_DIRECTORY_INLINE_FAILURE_BYTES, layoutSchema, exportProviderSchema, bodySchema, functionStatusSchema, failureFields, failureSchema, countSchema, decompileDirectoryInputSchema, decompileDirectoryManifestSchema, decompileDirectoryFunctionSchema, decompileJournalHeaderSchema, decompileJournalFunctionSchema, decompileJournalLineSchema, decompileDirectoryIndexSchema, isDecompileFunctionRelativePath;
function init_decompileDirectory() {
	return (init_decompileDirectory = __esmMin((() => {
		init_digests();
		init_localPath();
		DECOMPILE_DIRECTORY_JOURNAL_NAME = "decompile-journal.jsonl";
		DECOMPILE_DIRECTORY_INDEX_NAME = "decompile-index.json";
		DECOMPILE_DIRECTORY_FUNCTIONS_DIRECTORY = "functions";
		DECOMPILE_DIRECTORY_VERSION = 1;
		DECOMPILE_DIRECTORY_INLINE_FAILURE_LIMIT = 32;
		DECOMPILE_DIRECTORY_INLINE_FAILURE_BYTES = 2048;
		layoutSchema = z.enum(["address", "dwarf"]);
		exportProviderSchema = z.strictObject({
			id: z.string().min(1),
			name: z.string().min(1),
			version: z.string().min(1).nullable()
		});
		bodySchema = z.discriminatedUnion("available", [z.strictObject({
			available: z.literal(false),
			reason: z.string().min(1)
		}), z.strictObject({
			available: z.literal(true),
			ranges: z.array(z.strictObject({
				start: z.string().min(1),
				end: z.string().min(1).describe("Inclusive last address of this body range.")
			})),
			non_contiguous: z.boolean()
		})]);
		functionStatusSchema = z.enum([
			"written",
			"failed",
			"external"
		]);
		failureFields = {
			address: z.string().min(1),
			code: z.string().min(1),
			message: z.string().min(1)
		};
		failureSchema = z.union([z.strictObject({
			...failureFields,
			name: z.string().nullable().describe("Observed name, or null when unknown.")
		}), z.strictObject(failureFields).describe("Name omitted to fit the inline text budget; the index retains the full observed name.")]);
		countSchema = (description) => z.number().int().min(0).describe(description);
		decompileDirectoryInputSchema = z.strictObject({
			output_directory: absoluteLocalPathStringSchema.describe("Absolute output directory. The parent must exist. The directory itself must be absent unless resume is true. One run at a time may use a directory; a second run is refused while the first holds it."),
			layout: layoutSchema.default("address").describe("address names files by canonical address. dwarf asks for compilation-unit paths and is reported unavailable when the provider has no such fact."),
			resume: z.boolean().default(false).describe("Continue a journal for the same target SHA-256, provider, analysis profile, and layout. Both digests must be known. Verified files and functions recorded as external are skipped, conflicting files are left unchanged, and functions not yet tried run before retries of recorded failures."),
			name: z.string().min(1).optional().describe("Case-sensitive literal substring of the provider function name."),
			namespace: z.string().min(1).optional().describe("Case-sensitive prefix of the provider function name, including any separator such as Foo:: or Class."),
			address_start: z.string().min(1).optional().describe("Inclusive lower bound as 0xoffset or space:0xoffset. Must use the same address space as address_end."),
			address_end: z.string().min(1).optional().describe("Inclusive upper bound as 0xoffset or space:0xoffset. Must use the same address space as address_start."),
			limit: z.number().int().min(1).optional().describe("Maximum functions to attempt on this call after skipping verified files and functions recorded as external. Further matches remain for a later resume.")
		});
		decompileDirectoryManifestSchema = z.strictObject({
			output_directory: z.string().min(1).describe("Absolute directory containing the function files."),
			index_path: z.string().min(1).describe("Absolute path of the index. The index lists functions and does not contain pseudocode."),
			layout: layoutSchema,
			layout_status: z.enum(["address", "debug_layout_unavailable"]).describe("address when files are named by address on request. debug_layout_unavailable when dwarf was requested and no compilation-unit fact exists."),
			counts: z.strictObject({
				selected: countSchema("Functions matching the filter."),
				excluded: countSchema("Inventory functions excluded by the filter."),
				requested: countSchema("Functions this call attempted."),
				written: countSchema("Function files created by this call."),
				failed: countSchema("Functions this call could not write."),
				external: countSchema("Functions this call found procedure_info classifies as external. No file is written and no pseudocode is requested. A function without a matching procedure_info classification is decompiled as usual."),
				skipped: countSchema("Selected functions already settled: existing files that still hold the same bytes, whether recorded in the journal or found on disk, and functions the journal records as external."),
				remaining: countSchema("Selected functions not attempted because the limit was reached.")
			}),
			failures: z.array(failureSchema).max(32).describe("At most 32 failure details within 2,048 JSON-encoded UTF-8 bytes. Names may be omitted to preserve addresses and reasons; the index retains complete records."),
			failures_omitted: countSchema("Failure records omitted from failures because of the inline count or encoded-text budget."),
			provider: exportProviderSchema.describe("Provider that produced the pseudocode."),
			analysis_profile_digest: digestSchema.nullable().describe("Provider analysis-profile digest, or null when the provider did not commit one."),
			target_sha256: digestSchema.nullable().describe("SHA-256 of the analyzed target, or null when the observation has no file subject."),
			limitations: z.array(z.string()).describe("Limits of this export. Pseudocode is not included."),
			resume: z.boolean().describe("Whether this call continued a journal.")
		}).superRefine((manifest, context) => {
			const { counts } = manifest;
			if (counts.written + counts.failed + counts.external !== counts.requested) context.addIssue({
				code: "custom",
				path: ["counts", "requested"],
				message: "requested must equal written plus failed plus external"
			});
			if (counts.requested + counts.skipped + counts.remaining !== counts.selected) context.addIssue({
				code: "custom",
				path: ["counts", "selected"],
				message: "selected must equal requested plus skipped plus remaining"
			});
			if (manifest.failures.length + manifest.failures_omitted !== counts.failed) context.addIssue({
				code: "custom",
				path: ["failures_omitted"],
				message: "failures plus failures_omitted must equal failed"
			});
		});
		decompileDirectoryFunctionSchema = z.strictObject({
			address: z.string().min(1),
			name: z.string().nullable(),
			status: functionStatusSchema,
			relative_path: z.string().min(1).refine((path) => isDecompileFunctionRelativePath(path), "Function paths must remain inside functions/.").optional(),
			sha256: digestSchema.optional(),
			body: bodySchema,
			failure: z.strictObject({
				code: z.string().min(1),
				message: z.string().min(1)
			}).optional(),
			/** Complete provider caveats of the observations this attempt used. */
			limitations: z.array(z.string().min(1)).min(1).optional()
		}).superRefine((record, context) => {
			const valid = record.status === "written" ? record.relative_path !== undefined && record.sha256 !== undefined : record.status === "failed" ? record.failure !== undefined : record.relative_path === undefined && record.sha256 === undefined && record.failure === undefined;
			if (!valid) context.addIssue({
				code: "custom",
				path: ["status"],
				message: "Function record fields do not match its status."
			});
		});
		decompileJournalHeaderSchema = z.strictObject({
			kind: z.literal("header"),
			version: z.literal(1),
			target_sha256: digestSchema.nullable(),
			provider: exportProviderSchema,
			analysis_profile_digest: digestSchema.nullable(),
			layout: layoutSchema
		});
		decompileJournalFunctionSchema = decompileDirectoryFunctionSchema.safeExtend({ kind: z.literal("function") });
		decompileJournalLineSchema = z.discriminatedUnion("kind", [decompileJournalHeaderSchema, decompileJournalFunctionSchema]);
		decompileDirectoryIndexSchema = z.strictObject({
			version: z.literal(1),
			target_sha256: digestSchema.nullable(),
			provider: exportProviderSchema,
			analysis_profile_digest: digestSchema.nullable(),
			layout: layoutSchema,
			layout_status: z.enum(["address", "debug_layout_unavailable"]),
			limitations: z.array(z.string()),
			functions: z.array(decompileDirectoryFunctionSchema)
		});
		isDecompileFunctionRelativePath = (value) => {
			if (value.includes("\\") || value.includes("\0")) return false;
			const [directory, name, extra] = value.split("/");
			return extra === undefined && directory === "functions" && name !== undefined && /^[A-Za-z0-9._-]+\.c$/u.test(name);
		};
	})))();
}

//#endregion
//#region dist/domain/electron/electronFuses.js
var ELECTRON_FUSE_SENTINEL, ELECTRON_FUSE_STATE_BYTES, ELECTRON_FUSE_V1_NAMES, FUSE_IMPLICATIONS, OTHER_MEANS_LIMITATION, MISSING_SENTINEL_LIMITATION, byteSchema, fuseStateSchema, electronFuseSchema, electronFuseSentinelSchema, electronFuseSliceSchema, implicationLocation, electronFuseImplicationSchema, electronFuseReportSchema, inspectElectronFusesInputSchema, electronFuseState, electronFuseName, describeElectronFuseFindings, embeddedAsarIntegrityApplies, describeSentinel, implicationFor, validateReportBounds, implicationKey, validateSentinel;
function init_electronFuses() {
	return (init_electronFuses = __esmMin((() => {
		init_digests();
		init_localPath();
		ELECTRON_FUSE_SENTINEL = "dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX";
		ELECTRON_FUSE_STATE_BYTES = {
			disabled: 48,
			enabled: 49,
			removed: 114
		};
		ELECTRON_FUSE_V1_NAMES = [
			"RunAsNode",
			"EnableCookieEncryption",
			"EnableNodeOptionsEnvironmentVariable",
			"EnableNodeCliInspectArguments",
			"EnableEmbeddedAsarIntegrityValidation",
			"OnlyLoadAppFromAsar",
			"LoadBrowserProcessSpecificV8Snapshot",
			"GrantFileProtocolExtraPrivileges",
			"WasmTrapHandlers"
		];
		FUSE_IMPLICATIONS = [
			{
				subject: "node_cli_inspect_arguments",
				fuseIndex: 3,
				enabled: "honored",
				inactive: "not_honored"
			},
			{
				subject: "electron_run_as_node",
				fuseIndex: 0,
				enabled: "honored",
				inactive: "not_honored"
			},
			{
				subject: "embedded_asar_integrity_validation",
				fuseIndex: 4,
				enabled: "enforced",
				inactive: "not_enforced"
			},
			{
				subject: "only_load_app_from_asar",
				fuseIndex: 5,
				enabled: "restricted_to_app_asar",
				inactive: "not_restricted_to_app_asar"
			}
		];
		OTHER_MEANS_LIMITATION = "Fuse state does not prove the application enables Inspector through other means, such as app.commandLine or a remote-debugging switch in application code.";
		MISSING_SENTINEL_LIMITATION = "A missing sentinel means fuse state is unknown, not that every fuse is disabled.";
		byteSchema = z.int().min(0).max(255);
		fuseStateSchema = z.enum([
			"enabled",
			"disabled",
			"removed",
			"unknown"
		]);
		electronFuseSchema = z.strictObject({
			index: z.int().nonnegative(),
			name: z.string().min(1).nullable(),
			state: fuseStateSchema,
			raw_byte: byteSchema
		});
		electronFuseSentinelSchema = z.strictObject({
			sentinel_offset: z.int().nonnegative(),
			wire_version: byteSchema.nullable(),
			declared_length: byteSchema.nullable(),
			fuses: z.array(electronFuseSchema),
			complete: z.boolean()
		});
		electronFuseSliceSchema = z.strictObject({
			index: z.int().nonnegative(),
			file_offset: z.int().nonnegative(),
			size: z.int().nonnegative(),
			architecture: z.string().min(1).nullable(),
			hidden: z.boolean().exactOptional(),
			sentinel_count: z.int().nonnegative(),
			sentinels: z.array(electronFuseSentinelSchema)
		});
		implicationLocation = {
			relationship: z.literal("derivation"),
			slice_index: z.int().nonnegative(),
			sentinel_offset: z.int().nonnegative()
		};
		electronFuseImplicationSchema = z.discriminatedUnion("subject", [
			z.strictObject({
				...implicationLocation,
				subject: z.literal("node_cli_inspect_arguments"),
				fuse_index: z.literal(3),
				outcome: z.enum([
					"honored",
					"not_honored",
					"unknown"
				])
			}),
			z.strictObject({
				...implicationLocation,
				subject: z.literal("electron_run_as_node"),
				fuse_index: z.literal(0),
				outcome: z.enum([
					"honored",
					"not_honored",
					"unknown"
				])
			}),
			z.strictObject({
				...implicationLocation,
				subject: z.literal("embedded_asar_integrity_validation"),
				fuse_index: z.literal(4),
				outcome: z.enum([
					"enforced",
					"not_enforced",
					"unknown"
				])
			}),
			z.strictObject({
				...implicationLocation,
				subject: z.literal("only_load_app_from_asar"),
				fuse_index: z.literal(5),
				outcome: z.enum([
					"restricted_to_app_asar",
					"not_restricted_to_app_asar",
					"unknown"
				])
			})
		]);
		electronFuseReportSchema = z.strictObject({
			artifact: z.strictObject({
				selected_path: localPathStringSchema,
				resolved_path: localPathStringSchema,
				sha256: digestSchema,
				bytes: z.int().nonnegative(),
				format: z.enum([
					"mach-o",
					"mach-o-universal",
					"pe",
					"elf"
				])
			}).describe("Caller-selected path, resolved regular file, and the container that was read"),
			slices: z.array(electronFuseSliceSchema).describe("One entry per universal Mach-O slice, or a single entry for a thin Mach-O, PE, or ELF file. Sentinel offsets are file-absolute."),
			runtime_implications: z.array(electronFuseImplicationSchema).describe("Derivations from version-1 fuse bytes. Each entry names the fuse index it came from."),
			limitations: z.array(z.string().min(1))
		}).superRefine((report, context) => {
			validateReportBounds(report, context);
		});
		inspectElectronFusesInputSchema = z.strictObject({ path: absoluteLocalPathStringSchema.describe("Absolute filesystem path to a macOS .app bundle, Electron Framework binary, Windows PE executable, or Linux ELF executable") });
		electronFuseState = (byte) => {
			if (byte === ELECTRON_FUSE_STATE_BYTES.disabled) return "disabled";
			if (byte === ELECTRON_FUSE_STATE_BYTES.enabled) return "enabled";
			if (byte === ELECTRON_FUSE_STATE_BYTES.removed) return "removed";
			return "unknown";
		};
		electronFuseName = (wireVersion, index) => wireVersion === 1 ? ELECTRON_FUSE_V1_NAMES[index] ?? null : null;
		describeElectronFuseFindings = (slices, container) => {
			const runtime_implications = [];
			const limitations = [OTHER_MEANS_LIMITATION, MISSING_SENTINEL_LIMITATION];
			for (const slice of slices) {
				if (slice.sentinel_count === 0) limitations.push(`Slice ${slice.index} at file offset ${slice.file_offset} contains no Electron fuse sentinel; fuse state for that slice is unknown, not disabled.`);
				else if (slice.sentinel_count > 1) limitations.push(`Slice ${slice.index} at file offset ${slice.file_offset} contains ${slice.sentinel_count} Electron fuse sentinels; every sentinel is reported and none is selected.`);
				for (const sentinel of slice.sentinels) describeSentinel(slice.index, sentinel, container, runtime_implications, limitations);
			}
			return {
				runtime_implications,
				limitations
			};
		};
		embeddedAsarIntegrityApplies = (container) => container === "mach-o" || container === "mach-o-universal" || container === "pe";
		describeSentinel = (sliceIndex, sentinel, container, implications, limitations) => {
			if (!sentinel.complete) limitations.push(`Electron fuse wire at file offset ${sentinel.sentinel_offset} is truncated; fuse bytes past the slice stay unknown.`);
			if (sentinel.wire_version === null) return;
			if (sentinel.wire_version !== 1) {
				limitations.push(`Electron fuse wire at file offset ${sentinel.sentinel_offset} uses wire version ${sentinel.wire_version}; version 1 is the only pinned name table, so runtime implications for this wire are unknown.`);
				return;
			}
			for (const spec of FUSE_IMPLICATIONS) {
				const fuse = sentinel.fuses.find((item) => item.index === spec.fuseIndex);
				if (fuse === undefined) {
					limitations.push(`Electron fuse wire at file offset ${sentinel.sentinel_offset} does not include fuse index ${spec.fuseIndex}; that runtime implication is unknown.`);
					continue;
				}
				const applicabilityUnknown = spec.subject === "embedded_asar_integrity_validation" && !embeddedAsarIntegrityApplies(container);
				if (applicabilityUnknown) limitations.push(`Electron compiles embedded ASAR integrity validation only on macOS and Windows; the observed fuse byte at file offset ${sentinel.sentinel_offset} does not establish enforcement.`);
				implications.push(implicationFor(spec, applicabilityUnknown ? "unknown" : fuse.state, {
					slice_index: sliceIndex,
					sentinel_offset: sentinel.sentinel_offset
				}));
			}
		};
		implicationFor = (spec, state, location) => {
			const outcome = state === "enabled" ? spec.enabled : state === "unknown" ? "unknown" : spec.inactive;
			return {
				relationship: "derivation",
				subject: spec.subject,
				fuse_index: spec.fuseIndex,
				outcome,
				...location
			};
		};
		validateReportBounds = (report, context) => {
			const size = report.artifact.bytes;
			for (const [sliceIndex, slice] of report.slices.entries()) {
				if (slice.index !== sliceIndex) context.addIssue({
					code: "custom",
					path: [
						"slices",
						sliceIndex,
						"index"
					],
					message: "Slice index does not match its position in the report."
				});
				if (slice.sentinel_count !== slice.sentinels.length) context.addIssue({
					code: "custom",
					path: [
						"slices",
						sliceIndex,
						"sentinel_count"
					],
					message: "Sentinel count does not match the reported sentinels."
				});
				if (slice.file_offset > size || slice.size > size - slice.file_offset) context.addIssue({
					code: "custom",
					path: ["slices", sliceIndex],
					message: "Slice range extends outside the selected artifact."
				});
				for (const [sentinelIndex, sentinel] of slice.sentinels.entries()) validateSentinel(slice, sentinel, sliceIndex, sentinelIndex, context);
			}
			const expected = new Set(describeElectronFuseFindings(report.slices, report.artifact.format).runtime_implications.map(implicationKey));
			for (const [index, implication] of report.runtime_implications.entries()) {
				if (!expected.has(implicationKey(implication))) context.addIssue({
					code: "custom",
					path: ["runtime_implications", index],
					message: "Runtime implication is not supported by the reported fuse bytes and applicability."
				});
				const slice = report.slices[implication.slice_index];
				if (slice?.sentinels.some((sentinel) => sentinel.sentinel_offset === implication.sentinel_offset) !== true) context.addIssue({
					code: "custom",
					path: ["runtime_implications", index],
					message: "Runtime implication does not reference a reported sentinel."
				});
			}
		};
		implicationKey = (fact) => JSON.stringify([
			fact.slice_index,
			fact.sentinel_offset,
			fact.subject,
			fact.fuse_index,
			fact.outcome
		]);
		validateSentinel = (slice, sentinel, sliceIndex, sentinelIndex, context) => {
			const sentinelEnd = sentinel.sentinel_offset + ELECTRON_FUSE_SENTINEL.length;
			const wireEnd = sentinelEnd + (sentinel.wire_version === null ? 0 : 1) + (sentinel.declared_length === null ? 0 : 1) + sentinel.fuses.length;
			if (wireEnd > slice.file_offset + slice.size) context.addIssue({
				code: "custom",
				path: [
					"slices",
					sliceIndex,
					"sentinels",
					sentinelIndex
				],
				message: "Reported wire header or fuse bytes extend outside the slice."
			});
			if (sentinel.sentinel_offset < slice.file_offset || sentinelEnd > slice.file_offset + slice.size) context.addIssue({
				code: "custom",
				path: [
					"slices",
					sliceIndex,
					"sentinels",
					sentinelIndex,
					"sentinel_offset"
				],
				message: "Sentinel is outside its slice."
			});
			if (sentinel.wire_version === null && sentinel.declared_length !== null) context.addIssue({
				code: "custom",
				path: [
					"slices",
					sliceIndex,
					"sentinels",
					sentinelIndex,
					"declared_length"
				],
				message: "A wire without a version byte cannot declare a fuse count."
			});
			if (sentinel.complete && (sentinel.declared_length === null || sentinel.fuses.length !== sentinel.declared_length)) context.addIssue({
				code: "custom",
				path: [
					"slices",
					sliceIndex,
					"sentinels",
					sentinelIndex,
					"complete"
				],
				message: "A complete wire must contain every declared fuse byte."
			});
			if (!sentinel.complete && sentinel.declared_length !== null && sentinel.fuses.length >= sentinel.declared_length) context.addIssue({
				code: "custom",
				path: [
					"slices",
					sliceIndex,
					"sentinels",
					sentinelIndex,
					"complete"
				],
				message: "An incomplete wire must omit at least one declared fuse byte."
			});
			for (const [fuseIndex, fuse] of sentinel.fuses.entries()) {
				if (fuse.index !== fuseIndex) context.addIssue({
					code: "custom",
					path: [
						"slices",
						sliceIndex,
						"sentinels",
						sentinelIndex,
						"fuses",
						fuseIndex,
						"index"
					],
					message: "Fuse index does not match its wire position."
				});
				if (fuse.state !== electronFuseState(fuse.raw_byte)) context.addIssue({
					code: "custom",
					path: [
						"slices",
						sliceIndex,
						"sentinels",
						sentinelIndex,
						"fuses",
						fuseIndex,
						"state"
					],
					message: "Fuse state does not match its raw byte."
				});
				if (sentinel.wire_version !== null && fuse.name !== electronFuseName(sentinel.wire_version, fuse.index)) context.addIssue({
					code: "custom",
					path: [
						"slices",
						sliceIndex,
						"sentinels",
						sentinelIndex,
						"fuses",
						fuseIndex,
						"name"
					],
					message: "Fuse name does not match the pinned version-1 table."
				});
			}
		};
	})))();
}

//#endregion
//#region dist/domain/webRuntime.js
var SCRIPT_ID, RESOURCE_LINE, RESOURCE_COLUMN, START_LINE, START_COLUMN, webRuntimeScopeSchema, webRuntimeSourceSchema, webRuntimeLocationSchema, webRuntimeTargetSchema, WEB_RUNTIME_LIMITS;
function init_webRuntime() {
	return (init_webRuntime = __esmMin((() => {
		init_browserObservation();
		init_browserDeadline();
		init_jsonValue();
		SCRIPT_ID = "CDP session script ID; empty for a position a request initiator reported, which has no session-script association for joining captured source or resource_start.";
		RESOURCE_LINE = "Zero-based line in the resource named by url, as reported by CDP: the script file for an external script (including a module-import initiator), or the HTML document for an inline script or parser markup.";
		RESOURCE_COLUMN = "Zero-based UTF-16 column on that line of the resource named by url, as reported by CDP.";
		START_LINE = "Zero-based line where the script text starts in its enclosing resource (the HTML document for an inline script).";
		START_COLUMN = "Zero-based UTF-16 column where the script text starts on that line of its enclosing resource.";
		webRuntimeScopeSchema = z.strictObject({
			cdp_endpoint: browserEndpointSchema,
			allowed_origins: browserAllowedOriginsSchema,
			target_id: z.string().min(1),
			command_timeout_ms: webRuntimeCommandTimeoutSchema
		});
		webRuntimeSourceSchema = z.object({
			script_id: z.string().min(1),
			url: z.string(),
			execution_context_id: z.int().nullable(),
			reported_execution_context: jsonObjectSchema.nullable(),
			reported_script_context_aux_data: jsonObjectSchema.nullable(),
			frame_id: z.string().nullable(),
			producer_hash: z.string().nullable(),
			source_map_url: z.string().nullable(),
			has_source_url: z.boolean().nullable(),
			language: z.string().nullable(),
			resource_start: z.object({
				line_number: z.int().min(0).describe(START_LINE),
				column_number: z.int().min(0).describe(START_COLUMN)
			}).nullable(),
			source: z.discriminatedUnion("state", [z.object({
				state: z.literal("captured"),
				text: z.string(),
				sha256: z.string().regex(/^[a-f0-9]{64}$/u),
				utf8_bytes: z.int().min(0),
				utf16_units: z.int().min(0)
			}), z.object({
				state: z.enum(["unavailable", "excluded"]),
				reason: z.string().min(1)
			})])
		});
		webRuntimeLocationSchema = z.object({
			script_id: z.string().describe(SCRIPT_ID),
			url: z.string().nullable(),
			line_number: z.int().min(0).describe(RESOURCE_LINE),
			column_number: z.int().min(0).nullable().describe(RESOURCE_COLUMN),
			function_name: z.string().nullable(),
			source_association: z.enum(["script_id", "unknown"])
		});
		webRuntimeTargetSchema = z.object({
			target_id: z.string().min(1),
			origin: z.string().min(1),
			initial_url: z.string(),
			frame_id: z.string().min(1),
			loader_id: z.string().nullable()
		});
		WEB_RUNTIME_LIMITS = {
			protocolBytes: 64 * 1024 * 1024,
			retainedEventBytes: 8 * 1024 * 1024,
			sourceBytes: 32 * 1024 * 1024,
			commandTimeoutMs: DEFAULT_CDP_COMMAND_TIMEOUT_MS,
			cleanupTimeoutMs: CDP_CLEANUP_GRACE_MS
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/electronObservation.js
var approvedElectronInput, listElectronTargetsInputSchema, inspectElectronPageFacts, inspectElectronPageInputSchema, electronTargetSchema, electronTargetListSchema, electronScriptFrameClaimsSchema, electronPageInspectionSchema;
function init_electronObservation() {
	return (init_electronObservation = __esmMin((() => {
		init_browserDeadline();
		init_browserCompleteness();
		init_browserObservation();
		init_browserObservationSchemas();
		init_cdpObservationSchemas();
		init_digests();
		approvedElectronInput = { cdp_endpoint: browserEndpointSchema };
		listElectronTargetsInputSchema = z.strictObject({ ...approvedElectronInput });
		inspectElectronPageFacts = {
			...approvedElectronInput,
			target_id: z.string().trim().min(1),
			observation_ms: z.int().min(0).default(100),
			command_timeout_ms: webRuntimeCommandTimeoutSchema
		};
		inspectElectronPageInputSchema = z.union([z.strictObject({
			...inspectElectronPageFacts,
			include_script_sources: z.literal(false).default(false)
		}), z.strictObject({
			...inspectElectronPageFacts,
			include_script_sources: z.literal(true)
		})]);
		electronTargetSchema = z.object({
			target_id: z.string(),
			type: z.string(),
			title: z.string(),
			file_path: z.string(),
			attached: z.boolean().nullable().describe("Discovery-reported debugger attachment state; null means unknown")
		});
		electronTargetListSchema = z.object({
			browser: browserVersionSchema,
			targets: z.array(electronTargetSchema),
			excluded: z.object({
				unsupported_url: z.int().min(0),
				non_page: z.int().min(0)
			}),
			limitations: z.array(z.string())
		});
		electronScriptFrameClaimsSchema = z.object({
			script_event_frame_id: z.string().exactOptional(),
			execution_context_frame_id: z.string().exactOptional()
		});
		electronPageInspectionSchema = z.object({
			browser: browserVersionSchema,
			target: electronTargetSchema,
			capture_window: z.object({
				started_at: z.iso.datetime(),
				ended_at: z.iso.datetime(),
				observation_ms: z.int().min(0)
			}),
			completeness: browserCompletenessSchema,
			frames: z.array(z.object({
				frame_id: z.string(),
				parent_frame_id: z.string().nullable(),
				file_path: z.string()
			})),
			dom: z.object({
				total_nodes: z.int().min(0),
				nodes: z.array(cdpDomNodeSchema)
			}),
			scripts: z.object({
				total: z.int().min(0),
				items: z.array(z.object({
					script_key: prefixedDigestSchema("electron_script"),
					frame_id: z.string().nullable().default(null),
					frame_scope: z.enum(["authorized", "unknown"]).exactOptional(),
					frame_claims: electronScriptFrameClaimsSchema.exactOptional(),
					file_path: z.string(),
					has_source_url: z.boolean().nullable().exactOptional(),
					reported_url: z.string().exactOptional(),
					...cdpScriptMetadataSchema.shape,
					source: cdpScriptSourceSchema
				}))
			}),
			resources: z.array(z.object({
				resource_key: prefixedDigestSchema("electron_resource"),
				file_path: z.string(),
				type: z.string(),
				mime_type: z.string(),
				content_size: z.number().min(0).nullable()
			})),
			workers: z.array(z.object({
				target_id: z.string().min(1),
				type: z.string().min(1),
				file_path: z.string(),
				attached: z.boolean(),
				opener_target_id: z.string().min(1).nullable(),
				parent_frame_id: z.string().min(1).nullable()
			})).default([]),
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/electronActiveObservation.js
var absolutePathSchema, windowIndexSchema, deepLinkUrlSchema, actionSchema, electronActiveObservationInputSchema, electronActiveTimelineEventSchema, ipcEventSchema, electronActiveProcessMetricSchema, electronActiveWindowSchema, coverageSchema, actionResultContextShape, actionResultSchema, electronActiveObservationResultSchema;
function init_electronActiveObservation() {
	return (init_electronActiveObservation = __esmMin((() => {
		init_localPath();
		absolutePathSchema = z.string().min(1).refine((value) => value.startsWith("/") || /^[A-Za-z]:[\\/]/u.test(value) || value.startsWith("\\\\"), "provider path must be absolute");
		windowIndexSchema = z.int().min(0);
		deepLinkUrlSchema = z.string().min(1).refine((value) => {
			try {
				return new URL(value).protocol.length > 0;
			} catch (cause) {
				void cause;
				return false;
			}
		}, "deep-link url must be an absolute URL");
		actionSchema = z.discriminatedUnion("kind", [
			z.strictObject({
				step_id: z.string().min(1),
				kind: z.literal("click"),
				selector: z.string().min(1),
				window_index: windowIndexSchema.default(0)
			}),
			z.strictObject({
				step_id: z.string().min(1),
				kind: z.literal("wait"),
				duration_ms: z.int().min(0),
				window_index: windowIndexSchema.optional()
			}),
			z.strictObject({
				step_id: z.string().min(1),
				kind: z.literal("renderer-reload"),
				window_index: windowIndexSchema.default(0)
			}),
			z.strictObject({
				step_id: z.string().min(1),
				kind: z.literal("renderer-crash"),
				window_index: windowIndexSchema.default(0)
			}),
			z.strictObject({
				step_id: z.string().min(1),
				kind: z.literal("deep-link"),
				delivery: z.enum(["open-url", "second-instance"]),
				url: deepLinkUrlSchema
			})
		]);
		electronActiveObservationInputSchema = z.strictObject({
			executable_path: absoluteLocalPathStringSchema.describe("Absolute local filesystem path for the Electron executable; relative paths are rejected."),
			application_path: absoluteLocalPathStringSchema.describe("Absolute local filesystem path for the Electron application; relative paths are rejected."),
			application_root: absoluteLocalPathStringSchema.optional().describe("Absolute local filesystem root for application-relative paths; omit to derive it from the application path. Relative paths are rejected."),
			args: z.array(z.string().regex(/^[^\x00]*$/u, "Electron arguments must not contain NUL")).default([]),
			actions: z.array(actionSchema).default([])
		});
		electronActiveTimelineEventSchema = z.strictObject({
			sequence: z.int().min(1),
			correlation_id: z.string().nullable(),
			kind: z.enum([
				"main-handler-invocation",
				"main-event-invocation",
				"ipc-observation-gap",
				"utility-process-fork",
				"utility-process-message",
				"ipc-main-to-renderer",
				"ipc-utility-to-main",
				"ipc-renderer-send",
				"ipc-renderer-invoke",
				"ipc-renderer-post-message",
				"app-lifecycle",
				"window-lifecycle",
				"web-contents-lifecycle",
				"navigation",
				"shell-attempt",
				"process-lifecycle",
				"permission",
				"popup-attempt",
				"download",
				"protocol",
				"preload",
				"native-addon",
				"updater",
				"error"
			]),
			event: z.string().nullable(),
			phase: z.enum([
				"attempted",
				"completed",
				"blocked",
				"failed",
				"observed"
			]),
			channel: z.string().nullable(),
			direction: z.enum([
				"renderer-to-main",
				"main-to-renderer",
				"main-to-utility",
				"utility-to-main"
			]).nullable(),
			sender: z.string().nullable(),
			receiver: z.string().nullable(),
			frame: z.string().nullable(),
			target: z.string().nullable(),
			argument_shapes: z.array(z.string()),
			result_shape: z.string().nullable(),
			process_type: z.string().nullable(),
			source: z.string(),
			capture_method: z.enum([
				"api-wrapper",
				"event-emitter",
				"process-hook"
			]),
			artifact_path: z.string().nullable(),
			artifact_sha256: z.string().regex(/^[a-f0-9]{64}$/u).nullable(),
			error: z.boolean()
		});
		ipcEventSchema = electronActiveTimelineEventSchema.extend({ kind: z.enum([
			"main-handler-invocation",
			"main-event-invocation",
			"utility-process-fork",
			"utility-process-message",
			"ipc-main-to-renderer",
			"ipc-utility-to-main",
			"ipc-renderer-send",
			"ipc-renderer-invoke",
			"ipc-renderer-post-message"
		]) });
		electronActiveProcessMetricSchema = z.strictObject({
			pid: z.int().min(1),
			type: z.string().min(1),
			name: z.string().nullable(),
			service_name: z.string().nullable()
		});
		electronActiveWindowSchema = z.strictObject({
			window_id: z.string(),
			web_contents_id: z.string(),
			url: z.string(),
			title: z.string(),
			visible: z.boolean().nullable(),
			destroyed: z.boolean()
		});
		coverageSchema = z.strictObject({
			status: z.enum([
				"complete",
				"partial_attach",
				"hook_conflict",
				"target_exited",
				"cleanup_failed"
			]),
			observed_event_families: z.array(z.string()),
			unavailable_event_families: z.array(z.string()),
			observed_roles: z.array(z.string()),
			pre_capture_activity: z.literal("unavailable")
		});
		actionResultContextShape = {
			step_id: z.string().min(1),
			kind: z.enum([
				"click",
				"wait",
				"renderer-reload",
				"renderer-crash",
				"deep-link"
			]),
			window_index: windowIndexSchema.nullable(),
			target: z.string().nullable(),
			elapsed_ms: z.int().min(0)
		};
		actionResultSchema = z.discriminatedUnion("status", [z.strictObject({
			...actionResultContextShape,
			status: z.literal("completed"),
			error: z.null()
		}), z.strictObject({
			...actionResultContextShape,
			status: z.enum(["failed", "cancelled"]),
			error: z.string()
		})]);
		electronActiveObservationResultSchema = z.strictObject({
			application: z.strictObject({
				executable_path: absolutePathSchema,
				application_path: absolutePathSchema,
				electron_version: z.string().min(1),
				process_ownership: z.literal("provider-owned"),
				cleanup: z.literal("terminated-owned-process")
			}),
			actions: z.array(actionResultSchema),
			windows: z.array(electronActiveWindowSchema),
			processes: z.strictObject({ items: z.array(electronActiveProcessMetricSchema) }),
			ipc: z.strictObject({
				events: z.array(ipcEventSchema),
				observed: z.int().min(0),
				dropped: z.int().min(0)
			}),
			timeline: z.strictObject({
				events: z.array(electronActiveTimelineEventSchema),
				observed: z.int().min(0),
				dropped: z.int().min(0)
			}),
			retention: z.strictObject({
				budget_bytes: z.int().min(0),
				estimated_retained_bytes: z.int().min(0),
				event_serialized_byte_upper_bound: z.int().min(0),
				retained: z.int().min(0),
				dropped: z.int().min(0),
				dropped_event_families: z.array(z.strictObject({
					family: z.string().min(1),
					count: z.int().min(1)
				})),
				dropped_event_roles: z.array(z.strictObject({
					role: z.string().min(1),
					count: z.int().min(1)
				})),
				observed_ipc: z.int().min(0),
				dropped_ipc: z.int().min(0),
				observed_runtime: z.int().min(0),
				dropped_runtime: z.int().min(0)
			}),
			coverage: coverageSchema,
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRuntimeObservation.js
var observationTextSchema, runtimeEndpoint, listJavaScriptRuntimeTargetsInputSchema, javascriptRuntimeKindSchema, observedJavaScriptRuntimeKindSchema, observeJavaScriptRuntimeInputSchema, javascriptRuntimeVersionSchema, javascriptRuntimeLocationSchema, javascriptRuntimeUnresolvedLocationSchema, javascriptRuntimeTargetLocationSchema, javascriptRuntimeTargetSchema, javascriptRuntimeTargetListSchema, javascriptRuntimeScriptSchema, javascriptRuntimeContextSchema, javascriptRuntimeObservationSchema;
function init_javascriptRuntimeObservation() {
	return (init_javascriptRuntimeObservation = __esmMin((() => {
		init_browserObservation();
		init_digests();
		observationTextSchema = z.string().min(1);
		runtimeEndpoint = { inspector_endpoint: browserEndpointSchema };
		listJavaScriptRuntimeTargetsInputSchema = z.strictObject({ ...runtimeEndpoint });
		javascriptRuntimeKindSchema = z.enum([
			"node",
			"electron-main",
			"electron-preload",
			"electron-renderer"
		]);
		observedJavaScriptRuntimeKindSchema = javascriptRuntimeKindSchema.or(z.literal("unknown"));
		observeJavaScriptRuntimeInputSchema = z.strictObject({
			...runtimeEndpoint,
			target_id: z.string().trim().min(1),
			runtime_kind: javascriptRuntimeKindSchema.optional(),
			observation_ms: z.int().min(0).default(100)
		});
		javascriptRuntimeVersionSchema = z.strictObject({
			product: z.string().min(1),
			protocol_version: z.string().min(1),
			v8_version: z.string().nullable()
		});
		javascriptRuntimeLocationSchema = z.discriminatedUnion("kind", [
			z.strictObject({
				kind: z.literal("file"),
				file_path: z.string().min(1)
			}),
			z.strictObject({
				kind: z.literal("url"),
				origin: z.string().min(1),
				sanitized_url: z.string().min(1)
			}),
			z.strictObject({
				kind: z.literal("builtin"),
				specifier: z.string().min(1)
			})
		]);
		javascriptRuntimeUnresolvedLocationSchema = z.strictObject({
			kind: z.literal("unresolved"),
			reported_url: z.string().describe("Raw Inspector URL, which may be empty for anonymous or evaluated code."),
			reason: z.enum(["unverifiable-file-location", "location-authorization-not-attempted"])
		});
		javascriptRuntimeTargetLocationSchema = z.union([javascriptRuntimeLocationSchema, javascriptRuntimeUnresolvedLocationSchema]);
		javascriptRuntimeTargetSchema = z.strictObject({
			target_id: z.string().min(1),
			protocol_type: z.string().min(1),
			attached: z.boolean().nullable().describe("Discovery-reported debugger attachment state; null means unknown"),
			location: javascriptRuntimeTargetLocationSchema
		});
		javascriptRuntimeTargetListSchema = z.strictObject({
			runtime: javascriptRuntimeVersionSchema,
			targets: z.array(javascriptRuntimeTargetSchema),
			excluded: z.strictObject({
				unsupported_location: z.int().min(0),
				unconnectable: z.int().min(0)
			}),
			limitations: z.array(observationTextSchema)
		});
		javascriptRuntimeScriptSchema = z.strictObject({
			script_key: prefixedDigestSchema("v8_script"),
			location: javascriptRuntimeTargetLocationSchema,
			reported_url: z.string().optional().describe("Exact Inspector URL for an authorized file script, retained separately from its verified filesystem path."),
			execution_context_key: z.string().nullable(),
			cdp_hash: z.string().nullable(),
			length: z.int().min(0).nullable().describe("Producer-reported script length; null when unavailable."),
			is_module: z.boolean().nullable().describe("Producer-reported module classification; null when unavailable."),
			status: z.literal("observed-loaded")
		});
		javascriptRuntimeContextSchema = z.strictObject({
			context_key: z.string().min(1),
			state: z.enum([
				"created",
				"destroyed",
				"cleared"
			]),
			name: z.string().nullable(),
			origin: z.string().nullable()
		});
		javascriptRuntimeObservationSchema = z.strictObject({
			runtime: javascriptRuntimeVersionSchema,
			target: javascriptRuntimeTargetSchema.extend({
				runtime_kind: observedJavaScriptRuntimeKindSchema,
				runtime_kind_authority: z.enum(["caller-declared-unverified", "not-declared"])
			}),
			capture: z.strictObject({
				observation_ms: z.int().min(0),
				events_observed: z.int().min(0),
				events_retained: z.int().min(0),
				events_dropped: z.int().min(0),
				metadata_bytes_retained: z.int().min(0),
				truncated: z.boolean(),
				truncation_reasons: z.array(observationTextSchema)
			}),
			scripts: z.strictObject({
				items: z.array(javascriptRuntimeScriptSchema),
				observed_total: z.int().min(0),
				parse_failed_total: z.int().min(0).optional().describe("Valid scriptFailedToParse events observed; absent in legacy snapshots."),
				excluded: z.strictObject({
					unsupported_location: z.int().min(0),
					invalid_protocol_value: z.int().min(0)
				})
			}),
			execution_contexts: z.array(javascriptRuntimeContextSchema),
			directly_observed: z.array(observationTextSchema),
			unavailable_without_instrumentation: z.array(observationTextSchema),
			unknowns: z.array(observationTextSchema),
			limitations: z.array(observationTextSchema)
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticQuerySchemas.js
var semanticNodeIdSchema, literalValueSchema, literalSeedSchema, javaScriptSemanticQuerySeedSchema, javaScriptSemanticQueryInputSchema, javaScriptSemanticQueryResultSchema;
function init_javascriptSemanticQuerySchemas() {
	return (init_javascriptSemanticQuerySchemas = __esmMin((() => {
		init_javascriptSemanticGraphSchemas();
		init_digests();
		semanticNodeIdSchema = prefixedDigestSchema("jsrg_node");
		literalValueSchema = z.union([
			z.string(),
			z.number(),
			z.boolean(),
			z.null()
		]);
		literalSeedSchema = z.strictObject({
			kind: z.literal("literal"),
			value: literalValueSchema
		});
		javaScriptSemanticQuerySeedSchema = z.discriminatedUnion("kind", [
			z.strictObject({
				kind: z.literal("semantic-node"),
				node_id: semanticNodeIdSchema
			}),
			z.strictObject({
				kind: z.literal("application-node"),
				node_id: prefixedDigestSchema("jag_node")
			}),
			literalSeedSchema,
			z.strictObject({
				kind: z.literal("function"),
				fingerprint_sha256: digestSchema
			}),
			z.strictObject({
				kind: z.literal("property"),
				name: z.string()
			}),
			z.strictObject({
				kind: z.literal("endpoint"),
				value: z.string().min(1)
			}),
			z.strictObject({
				kind: z.literal("event"),
				name: z.string()
			}),
			z.strictObject({
				kind: z.literal("boundary-field"),
				field: z.string().min(1)
			})
		]);
		javaScriptSemanticQueryInputSchema = z.strictObject({
			seed: javaScriptSemanticQuerySeedSchema,
			direction: z.enum([
				"backward-provenance",
				"forward-influence",
				"callers",
				"ownership"
			]),
			allowed_relations: z.array(z.enum(JAVASCRIPT_SEMANTIC_RELATIONS)).min(1).optional(),
			include_ambiguous_dynamic_edges: z.boolean().default(false),
			expected: z.strictObject({
				role: z.enum(["source", "sink"]),
				classes: z.array(z.enum(JAVASCRIPT_SEMANTIC_NODE_KINDS)).min(1)
			}).nullable().default(null)
		});
		javaScriptSemanticQueryResultSchema = z.strictObject({
			query_id: prefixedDigestSchema("jsrq"),
			source_graph_id: prefixedDigestSchema("jsrg"),
			seed: javaScriptSemanticQuerySeedSchema,
			direction: javaScriptSemanticQueryInputSchema.shape.direction,
			status: z.enum([
				"found",
				"no-match",
				"ambiguous",
				"partial",
				"unsupported"
			]),
			seed_node_ids: z.array(semanticNodeIdSchema),
			evidence_contexts: z.array(javaScriptSemanticEvidenceContextSchema),
			nodes: z.array(javaScriptSemanticNodeSchema),
			relations: z.array(javaScriptSemanticRelationSchema),
			unknowns: z.array(javaScriptSemanticUnknownSchema),
			expected_match_node_ids: z.array(semanticNodeIdSchema),
			summary: z.strictObject({
				total_seed_matches: z.int().min(0),
				traversed_nodes: z.int().min(0),
				traversed_relations: z.int().min(0),
				traversed_functions: z.int().min(0),
				traversed_modules: z.int().min(0),
				relevant_unknowns: z.int().min(0)
			}),
			coverage: z.strictObject({ status: z.enum([
				"complete",
				"partial",
				"unavailable"
			]) }),
			limitations: z.array(z.string().min(1))
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticTraceSchemas.js
var evidenceIdSchema$3, traceJavaScriptSemanticsInputSchema, javaScriptSemanticTraceResultSchema;
function init_javascriptSemanticTraceSchemas() {
	return (init_javascriptSemanticTraceSchemas = __esmMin((() => {
		init_evidence();
		init_javascriptSemanticQuerySchemas();
		init_digests();
		evidenceIdSchema$3 = prefixedDigestSchema("ev");
		traceJavaScriptSemanticsInputSchema = z.strictObject({
			application: evidenceSchema,
			query: javaScriptSemanticQueryInputSchema
		});
		javaScriptSemanticTraceResultSchema = javaScriptSemanticQueryResultSchema.extend({
			source_evidence_id: evidenceIdSchema$3,
			evidence_links: z.array(evidenceIdSchema$3).length(1)
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptApplicationVersionComparisonSchemas.js
var evidenceIdSchema$2, nodeIdSchema$2, textSchema$1, validateApplicationVersionIdentities, evidenceIdentitySchema$1, applicationVersionIdentitiesSchema, compareApplicationVersionsInputSchema, candidateNodesSchema, exactMatchSchema, sourceMapMatchSchema, inferredMatchSchema, matchedItemMatchSchema, unmatchedItemMatchSchema, leftAmbiguousMatchSchema, rightAmbiguousMatchSchema, comparisonItemContextShape, comparisonItemSchema, comparisonCoverageSchema, applicationVersionComparisonResultSchema, ownedApplicationVersionComparisonResultSchema;
function init_javascriptApplicationVersionComparisonSchemas() {
	return (init_javascriptApplicationVersionComparisonSchemas = __esmMin((() => {
		init_emptyArraySchema();
		init_evidence();
		init_javascriptApplicationGraph();
		init_javascriptApplicationGraphSchemas();
		init_digests();
		evidenceIdSchema$2 = prefixedDigestSchema("ev");
		nodeIdSchema$2 = prefixedDigestSchema("jag_node");
		textSchema$1 = z.string().min(1);
		validateApplicationVersionIdentities = (input, context) => {
			if (input.left.evidence_id === input.right.evidence_id) context.addIssue({
				code: "custom",
				path: ["right"],
				message: "Application version Evidence must be distinct"
			});
			for (const side of ["left_native_observations", "right_native_observations"]) {
				const ids = input[side].map(({ evidence_id: id }) => id);
				if (new Set(ids).size !== ids.length) context.addIssue({
					code: "custom",
					path: [side],
					message: "Native observations must be unique on each side"
				});
			}
		};
		evidenceIdentitySchema$1 = z.object({ evidence_id: evidenceIdSchema$2 });
		applicationVersionIdentitiesSchema = z.object({
			left: evidenceIdentitySchema$1,
			right: evidenceIdentitySchema$1,
			left_native_observations: z.array(evidenceIdentitySchema$1),
			right_native_observations: z.array(evidenceIdentitySchema$1)
		}).superRefine(validateApplicationVersionIdentities);
		compareApplicationVersionsInputSchema = z.strictObject({
			left: evidenceSchema,
			right: evidenceSchema,
			left_native_observations: z.array(evidenceSchema).default([]),
			right_native_observations: z.array(evidenceSchema).default([])
		}).superRefine(validateApplicationVersionIdentities);
		candidateNodesSchema = z.tuple([nodeIdSchema$2], nodeIdSchema$2).check(z.minLength(1));
		exactMatchSchema = z.strictObject({
			status: z.literal("matched"),
			basis: z.enum([
				"exact-node-identity",
				"exact-content-digest",
				"exact-module-source-digest"
			]),
			confidence: z.literal("exact"),
			candidate_left_node_ids: emptyArraySchema,
			candidate_right_node_ids: emptyArraySchema
		});
		sourceMapMatchSchema = z.strictObject({
			status: z.literal("matched"),
			basis: z.literal("source-map-identity"),
			confidence: z.literal("high"),
			candidate_left_node_ids: emptyArraySchema,
			candidate_right_node_ids: emptyArraySchema
		});
		inferredMatchSchema = z.strictObject({
			status: z.literal("matched"),
			basis: z.enum(["structural-fingerprint", "semantic-key"]),
			confidence: z.literal("medium"),
			candidate_left_node_ids: emptyArraySchema,
			candidate_right_node_ids: emptyArraySchema
		});
		matchedItemMatchSchema = z.union([
			exactMatchSchema,
			sourceMapMatchSchema,
			inferredMatchSchema
		]);
		unmatchedItemMatchSchema = z.strictObject({
			status: z.literal("unmatched"),
			basis: z.literal("none"),
			confidence: z.literal("unknown"),
			candidate_left_node_ids: emptyArraySchema,
			candidate_right_node_ids: emptyArraySchema
		});
		leftAmbiguousMatchSchema = z.strictObject({
			status: z.literal("ambiguous"),
			basis: z.literal("none"),
			confidence: z.literal("unknown"),
			candidate_left_node_ids: emptyArraySchema,
			candidate_right_node_ids: candidateNodesSchema
		});
		rightAmbiguousMatchSchema = z.strictObject({
			status: z.literal("ambiguous"),
			basis: z.literal("none"),
			confidence: z.literal("unknown"),
			candidate_left_node_ids: candidateNodesSchema,
			candidate_right_node_ids: emptyArraySchema
		});
		comparisonItemContextShape = {
			item_id: prefixedDigestSchema("javc_item"),
			node_kind: z.enum(JAVASCRIPT_APPLICATION_NODE_KINDS),
			dimensions: z.array(z.enum([
				"content",
				"location",
				"properties",
				"relationships",
				"availability",
				"coverage"
			])),
			evidence_links: z.array(evidenceIdSchema$2).min(2),
			limitations: z.array(textSchema$1)
		};
		comparisonItemSchema = z.union([
			z.strictObject({
				...comparisonItemContextShape,
				status: z.enum([
					"unchanged",
					"changed",
					"unknown"
				]),
				left_node_id: nodeIdSchema$2,
				right_node_id: nodeIdSchema$2,
				match: matchedItemMatchSchema
			}),
			z.strictObject({
				...comparisonItemContextShape,
				status: z.enum(["removed", "unknown"]),
				left_node_id: nodeIdSchema$2,
				right_node_id: z.null(),
				match: unmatchedItemMatchSchema
			}),
			z.strictObject({
				...comparisonItemContextShape,
				status: z.enum(["added", "unknown"]),
				left_node_id: z.null(),
				right_node_id: nodeIdSchema$2,
				match: unmatchedItemMatchSchema
			}),
			z.strictObject({
				...comparisonItemContextShape,
				status: z.literal("unknown"),
				left_node_id: nodeIdSchema$2,
				right_node_id: z.null(),
				match: leftAmbiguousMatchSchema
			}),
			z.strictObject({
				...comparisonItemContextShape,
				status: z.literal("unknown"),
				left_node_id: z.null(),
				right_node_id: nodeIdSchema$2,
				match: rightAmbiguousMatchSchema
			})
		]);
		comparisonCoverageSchema = z.strictObject({
			left_graph_status: z.enum([
				"complete",
				"partial",
				"unknown",
				"unavailable"
			]),
			right_graph_status: z.enum([
				"complete",
				"partial",
				"unknown",
				"unavailable"
			]),
			left_graph_omitted_count: z.int().min(0).nullable(),
			right_graph_omitted_count: z.int().min(0).nullable(),
			status: z.enum([
				"complete-within-inputs",
				"partial",
				"truncated"
			])
		});
		applicationVersionComparisonResultSchema = z.strictObject({
			comparison_id: prefixedDigestSchema("javc"),
			left: z.strictObject({
				evidence_id: evidenceIdSchema$2,
				graph_id: prefixedDigestSchema("jag"),
				root_artifact_sha256: z.string().regex(/^[a-f0-9]{64}$/u)
			}),
			right: z.strictObject({
				evidence_id: evidenceIdSchema$2,
				graph_id: prefixedDigestSchema("jag"),
				root_artifact_sha256: z.string().regex(/^[a-f0-9]{64}$/u)
			}),
			summary: z.strictObject({
				unchanged: z.int().min(0),
				added: z.int().min(0),
				removed: z.int().min(0),
				changed: z.int().min(0),
				unknown: z.int().min(0)
			}),
			matching: z.strictObject({
				exact_node_identity: z.int().min(0),
				exact_content_digest: z.int().min(0),
				exact_module_source_digest: z.int().min(0),
				source_map_identity: z.int().min(0),
				structural_fingerprint: z.int().min(0),
				semantic_key: z.int().min(0),
				ambiguous: z.int().min(0),
				unmatched: z.int().min(0)
			}),
			items: z.array(comparisonItemSchema),
			graph: javascriptApplicationGraphSchema,
			coverage: comparisonCoverageSchema,
			evidence_links: z.array(evidenceIdSchema$2).min(2),
			limitations: z.array(textSchema$1)
		}).superRefine((result, context) => {
			const sourceGraphsComplete = result.coverage.left_graph_status === "complete" && result.coverage.right_graph_status === "complete";
			if (result.coverage.status === "complete-within-inputs" !== sourceGraphsComplete) context.addIssue({
				code: "custom",
				path: ["coverage", "status"],
				message: "Comparison coverage must match source graph completeness"
			});
		});
		ownedApplicationVersionComparisonResultSchema = applicationVersionComparisonResultSchema.safeExtend({ graph: z.custom(isValidatedImmutableJavaScriptApplicationGraph) });
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptExportShapeComparisonSchemas.js
function isJsonPointer(value) {
	if (value === "") return true;
	if (!value.startsWith("/")) return false;
	for (let index = 0; index < value.length; index += 1) {
		if (value[index] !== "~") continue;
		const escaped = value[index + 1];
		if (escaped !== "0" && escaped !== "1") return false;
		index += 1;
	}
	return true;
}
var evidenceIdSchema$1, graphIdSchema, nodeIdSchema$1, textSchema, exportNameSchema, semanticPrimitiveSchema, jsonPointerSchema, validateJavaScriptExportShapeIdentities, evidenceIdentitySchema, javaScriptExportShapeIdentitiesSchema, compareJavaScriptExportShapesInputSchema, projectedReturnFieldShape, projectedReturnFieldSchema, projectedPropertyCoverageSchema, projectedReturnShapeSchema, projectedExportReturnShapesSchema, exportCandidateSchema, selectorResultShape, selectorResultSchema, valueAvailabilitySchema, discriminantSchema, propertyPresenceSchema, javaScriptExportShapeComparisonChangeSchema, inventoryPropertyCoverageSchema, propertyInventorySchema, javaScriptExportShapeComparisonResultSchema;
function init_javascriptExportShapeComparisonSchemas() {
	return (init_javascriptExportShapeComparisonSchemas = __esmMin((() => {
		init_javascriptSourceCoordinates();
		init_evidence();
		init_digests();
		evidenceIdSchema$1 = prefixedDigestSchema("ev");
		graphIdSchema = prefixedDigestSchema("jag");
		nodeIdSchema$1 = prefixedDigestSchema("jag_node");
		textSchema = z.string().min(1);
		exportNameSchema = z.string();
		semanticPrimitiveSchema = z.union([
			z.string(),
			z.number().finite(),
			z.boolean(),
			z.null()
		]);
		jsonPointerSchema = z.string().refine(isJsonPointer, "Expected an RFC 6901 JSON Pointer");
		validateJavaScriptExportShapeIdentities = (input, context) => {
			if (input.left.evidence_id === input.right.evidence_id) context.addIssue({
				code: "custom",
				path: ["right"],
				message: "JavaScript export shape Evidence must be distinct"
			});
		};
		evidenceIdentitySchema = z.object({ evidence_id: evidenceIdSchema$1 });
		javaScriptExportShapeIdentitiesSchema = z.object({
			left: evidenceIdentitySchema,
			right: evidenceIdentitySchema
		}).superRefine(validateJavaScriptExportShapeIdentities);
		compareJavaScriptExportShapesInputSchema = z.strictObject({
			left: evidenceSchema,
			right: evidenceSchema,
			left_module_path: textSchema,
			left_export_name: exportNameSchema,
			right_module_path: textSchema,
			right_export_name: exportNameSchema
		}).superRefine(validateJavaScriptExportShapeIdentities);
		projectedReturnFieldShape = {
			path: jsonPointerSchema,
			presence: z.enum([
				"present",
				"absent",
				"unknown-coverage"
			])
		};
		projectedReturnFieldSchema = z.discriminatedUnion("state", [
			z.strictObject({
				...projectedReturnFieldShape,
				state: z.literal("literal"),
				value: semanticPrimitiveSchema,
				reason: z.null()
			}),
			z.strictObject({
				...projectedReturnFieldShape,
				state: z.literal("union"),
				value: z.array(semanticPrimitiveSchema).min(1),
				reason: z.null()
			}),
			z.strictObject({
				...projectedReturnFieldShape,
				state: z.literal("unknown"),
				value: z.null(),
				reason: textSchema
			})
		]);
		projectedPropertyCoverageSchema = z.discriminatedUnion("status", [z.strictObject({
			path: jsonPointerSchema,
			status: z.literal("complete"),
			omitted: z.literal(0)
		}), z.strictObject({
			path: jsonPointerSchema,
			status: z.literal("partial"),
			omitted: z.union([z.int().positive(), z.null()])
		})]);
		projectedReturnShapeSchema = z.strictObject({
			source_range: javascriptSourceRangeSchema,
			value_status: z.enum([
				"literal",
				"union",
				"object",
				"array",
				"unknown",
				"ambiguous",
				"cycle"
			]),
			fields: z.array(projectedReturnFieldSchema),
			property_coverage: z.array(projectedPropertyCoverageSchema)
		}).superRefine((shape, context) => {
			const fieldPaths = shape.fields.map(({ path }) => path);
			if (new Set(fieldPaths).size !== fieldPaths.length) context.addIssue({
				code: "custom",
				path: ["fields"],
				message: "Projected return field paths must be unique"
			});
			const coveragePaths = shape.property_coverage.map(({ path }) => path);
			if (new Set(coveragePaths).size !== coveragePaths.length) context.addIssue({
				code: "custom",
				path: ["property_coverage"],
				message: "Projected property coverage paths must be unique"
			});
		});
		projectedExportReturnShapesSchema = z.strictObject({
			semantic_role: z.literal("export-return-shapes"),
			module_path: textSchema,
			exported_name: exportNameSchema,
			callable_id: textSchema,
			callable_kind: z.enum([
				"function",
				"class",
				"method"
			]),
			static_return_shapes: z.array(projectedReturnShapeSchema),
			return_shape_coverage: z.strictObject({
				status: z.enum([
					"complete",
					"partial",
					"truncated"
				]),
				retained_return_sites: z.int().min(0),
				omitted_return_sites: z.int().min(0).nullable(),
				omitted_fields: z.int().min(0),
				omitted_property_coverage: z.int().min(0),
				projection_complete: z.boolean()
			})
		}).superRefine((projection, context) => {
			if (projection.return_shape_coverage.retained_return_sites !== projection.static_return_shapes.length) context.addIssue({
				code: "custom",
				path: ["return_shape_coverage", "retained_return_sites"],
				message: "Retained return-site count must match projected shapes"
			});
		});
		exportCandidateSchema = z.strictObject({
			node_id: nodeIdSchema$1,
			module_path: textSchema,
			export_name: exportNameSchema,
			matches_requested_module: z.boolean(),
			matches_requested_export: z.boolean()
		});
		selectorResultShape = {
			evidence_id: evidenceIdSchema$1,
			graph_id: graphIdSchema,
			requested_module_path: textSchema,
			requested_export_name: exportNameSchema,
			candidates: z.array(exportCandidateSchema),
			omitted_candidates: z.int().min(0)
		};
		selectorResultSchema = z.union([
			z.strictObject({
				...selectorResultShape,
				status: z.literal("selected"),
				selected_node_id: nodeIdSchema$1
			}),
			z.strictObject({
				...selectorResultShape,
				status: z.enum(["missing", "ambiguous"]),
				selected_node_id: z.null()
			}),
			z.strictObject({
				...selectorResultShape,
				status: z.literal("unavailable"),
				selected_node_id: nodeIdSchema$1.nullable()
			})
		]);
		valueAvailabilitySchema = z.discriminatedUnion("availability", [
			z.strictObject({ availability: z.literal("absent") }),
			z.strictObject({
				availability: z.literal("literal"),
				value: semanticPrimitiveSchema
			}),
			z.strictObject({
				availability: z.literal("union"),
				values: z.array(semanticPrimitiveSchema).min(1)
			}),
			z.strictObject({
				availability: z.literal("unknown"),
				reason: textSchema
			})
		]);
		discriminantSchema = z.strictObject({
			path: jsonPointerSchema,
			value: semanticPrimitiveSchema
		});
		propertyPresenceSchema = z.enum([
			"present",
			"absent",
			"unknown-coverage"
		]);
		javaScriptExportShapeComparisonChangeSchema = z.strictObject({
			change_id: prefixedDigestSchema("jesc_change"),
			status: z.enum([
				"added",
				"removed",
				"changed",
				"unknown"
			]),
			path: jsonPointerSchema,
			discriminant: discriminantSchema.nullable(),
			presence: z.strictObject({
				left: propertyPresenceSchema,
				right: propertyPresenceSchema
			}),
			left: valueAvailabilitySchema,
			right: valueAvailabilitySchema,
			left_source_range: javascriptSourceRangeSchema.nullable(),
			right_source_range: javascriptSourceRangeSchema.nullable(),
			evidence_links: z.array(evidenceIdSchema$1).length(2),
			limitations: z.array(textSchema)
		});
		inventoryPropertyCoverageSchema = z.strictObject({
			path: jsonPointerSchema,
			status: z.enum(["complete", "partial"])
		});
		propertyInventorySchema = z.strictObject({
			side: z.enum(["left", "right"]),
			variant_index: z.int().nonnegative(),
			discriminant: discriminantSchema.nullable(),
			paired: z.boolean(),
			source_range: javascriptSourceRangeSchema,
			properties: z.array(jsonPointerSchema),
			property_coverage: z.array(inventoryPropertyCoverageSchema)
		});
		javaScriptExportShapeComparisonResultSchema = z.strictObject({
			comparison_id: prefixedDigestSchema("jesc"),
			left: selectorResultSchema,
			right: selectorResultSchema,
			property_inventories: z.array(propertyInventorySchema),
			summary: z.strictObject({
				added: z.int().min(0),
				removed: z.int().min(0),
				changed: z.int().min(0),
				unknown: z.int().min(0)
			}),
			changes: z.array(javaScriptExportShapeComparisonChangeSchema),
			coverage: z.strictObject({
				status: z.enum([
					"complete-within-inputs",
					"partial",
					"truncated"
				]),
				left_graph_status: z.enum([
					"complete",
					"partial",
					"unknown",
					"unavailable"
				]),
				right_graph_status: z.enum([
					"complete",
					"partial",
					"unknown",
					"unavailable"
				]),
				paired_variants: z.int().min(0),
				unpaired_left_variants: z.int().min(0),
				unpaired_right_variants: z.int().min(0),
				omitted_left_variants: z.int().min(0),
				omitted_right_variants: z.int().min(0),
				left_source_omitted_variants: z.int().min(0).nullable(),
				right_source_omitted_variants: z.int().min(0).nullable(),
				left_omitted_fields: z.int().min(0),
				right_omitted_fields: z.int().min(0),
				left_omitted_property_coverage: z.int().min(0),
				right_omitted_property_coverage: z.int().min(0),
				omitted_candidates: z.int().min(0),
				omitted_changes: z.int().min(0)
			}),
			evidence_links: z.array(evidenceIdSchema$1).length(2),
			limitations: z.array(textSchema)
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptFeatureTraceSchemas.js
var evidenceIdSchema, nodeIdSchema, edgeIdSchema, boundedTextSchema, featureSeedMatchMode, apiSeedSchema, apiPathSeedSchema, applicationFeatureSeedSchema, validateApplicationTraceIdentities, applicationTraceIdentitiesSchema, traceApplicationFeatureInputSchema, seedMatchSchema, tracePathSchema, nativeHandoffSchema, applicationFeatureTraceResultSchema;
function init_javascriptFeatureTraceSchemas() {
	return (init_javascriptFeatureTraceSchemas = __esmMin((() => {
		init_evidence();
		init_javascriptApplicationGraph();
		init_digests();
		evidenceIdSchema = prefixedDigestSchema("ev");
		nodeIdSchema = prefixedDigestSchema("jag_node");
		edgeIdSchema = prefixedDigestSchema("jag_edge");
		boundedTextSchema = z.string().min(1);
		featureSeedMatchMode = (seed) => seed.match ?? (seed.kind === "string" ? "contains" : "exact");
		apiSeedSchema = z.union([z.strictObject({
			kind: z.literal("api"),
			value: boundedTextSchema,
			match: z.enum(["exact", "contains"]).nullable().default(null),
			case_sensitive: z.boolean().default(false)
		}), z.strictObject({
			kind: z.literal("api"),
			value: z.literal(""),
			match: z.literal("exact"),
			case_sensitive: z.boolean().default(false)
		})]);
		apiPathSeedSchema = z.union([z.strictObject({
			kind: z.literal("api"),
			value: boundedTextSchema,
			match: z.enum(["exact", "contains"]).nullable().default(null),
			case_sensitive: z.boolean().default(false),
			entry_path: z.array(z.string()).min(1)
		}), z.strictObject({
			kind: z.literal("api"),
			value: z.literal(""),
			match: z.literal("exact"),
			case_sensitive: z.boolean().default(false),
			entry_path: z.array(z.string()).min(1)
		})]);
		applicationFeatureSeedSchema = z.union([
			z.strictObject({
				kind: z.enum([
					"node-id",
					"route",
					"string",
					"channel",
					"module",
					"native-export"
				]),
				value: boundedTextSchema,
				match: z.enum(["exact", "contains"]).nullable().default(null),
				case_sensitive: z.boolean().default(false)
			}),
			z.strictObject({
				kind: z.enum([
					"route",
					"string",
					"channel",
					"module",
					"native-export"
				]),
				value: z.literal(""),
				match: z.literal("exact"),
				case_sensitive: z.boolean().default(false)
			}),
			apiSeedSchema,
			apiPathSeedSchema
		]);
		validateApplicationTraceIdentities = (input, context) => {
			const ids = input.native_observations.map(({ evidence_id: id }) => id);
			if (new Set(ids).size !== ids.length) context.addIssue({
				code: "custom",
				path: ["native_observations"],
				message: "Native observations must be unique"
			});
		};
		applicationTraceIdentitiesSchema = z.object({ native_observations: z.array(z.object({ evidence_id: evidenceIdSchema })) }).superRefine(validateApplicationTraceIdentities);
		traceApplicationFeatureInputSchema = z.strictObject({
			application: evidenceSchema,
			native_observations: z.array(evidenceSchema).default([]),
			seed: applicationFeatureSeedSchema,
			direction: z.enum([
				"outgoing",
				"incoming",
				"both"
			]).default("both")
		}).superRefine(validateApplicationTraceIdentities);
		seedMatchSchema = z.strictObject({
			node_id: nodeIdSchema,
			kind: z.string().min(1),
			basis: z.enum([
				"node-id",
				"label",
				"identity",
				"property"
			]),
			field: z.string().min(1)
		});
		tracePathSchema = z.strictObject({
			path_id: prefixedDigestSchema("jatp"),
			start_node_id: nodeIdSchema,
			end_node_id: nodeIdSchema,
			end_kind: z.string().min(1),
			node_ids: z.array(nodeIdSchema).min(1),
			edge_ids: z.array(edgeIdSchema),
			authorities: z.array(z.string().min(1)),
			contains_inference: z.boolean()
		});
		nativeHandoffSchema = z.strictObject({
			native_node_id: nodeIdSchema,
			artifact_sha256: digestSchema,
			artifact_path: z.string().min(1).nullable(),
			export_node_ids: z.array(nodeIdSchema),
			requested_exports: z.array(boundedTextSchema),
			status: z.enum(["evidence-linked", "requires-provider-analysis"]),
			providers: z.array(providerSchema),
			evidence_ids: z.array(evidenceIdSchema),
			recommended_tools: z.array(z.enum([
				"open_binary",
				"binary_overview",
				"search_procedures",
				"analyze_function",
				"xrefs"
			]))
		});
		applicationFeatureTraceResultSchema = z.strictObject({
			trace_id: prefixedDigestSchema("jatr"),
			source_evidence_id: evidenceIdSchema,
			source_graph_id: prefixedDigestSchema("jag"),
			seed: applicationFeatureSeedSchema,
			direction: z.enum([
				"outgoing",
				"incoming",
				"both"
			]),
			seed_matches: z.array(seedMatchSchema),
			graph: javascriptApplicationGraphSchema.nullable(),
			paths: z.array(tracePathSchema),
			native_handoffs: z.array(nativeHandoffSchema),
			summary: z.strictObject({
				matched_seeds: z.int().min(0),
				traced_nodes: z.int().min(0),
				traced_edges: z.int().min(0),
				terminal_paths: z.int().min(0),
				native_handoffs: z.int().min(0),
				observed_facts: z.int().min(0),
				inferred_facts: z.int().min(0),
				unknown_facts: z.int().min(0),
				unavailable_facts: z.int().min(0)
			}),
			coverage: z.strictObject({
				status: z.enum([
					"complete-within-source",
					"partial",
					"no-match"
				]),
				source_graph_status: z.enum([
					"complete",
					"partial",
					"unknown",
					"unavailable"
				]),
				total_seed_matches: z.int().min(0)
			}),
			evidence_links: z.array(evidenceIdSchema).min(1),
			limitations: z.array(boundedTextSchema)
		});
	})))();
}

//#endregion
export { APK_V1_MANIFEST_PATH, APK_V1_META_INF_PREFIX, ArtifactInventoryCarrierError, ArtifactInventoryValidationError, BINARY_ARCHITECTURES, BUILTIN_RESOURCE_METHODS, BUILTIN_RESOURCE_SPECIFIERS, CDP_CLEANUP_GRACE_MS, CDP_DISCOVERY_RESPONSE_TIMEOUT_MS, CLI_COMMANDS, CLI_COMMAND_NAMES, COMPACT_INPUT_SCHEMA_BUDGET_BYTES, DECOMPILE_DIRECTORY_FUNCTIONS_DIRECTORY, DECOMPILE_DIRECTORY_INDEX_NAME, DECOMPILE_DIRECTORY_INLINE_FAILURE_BYTES, DECOMPILE_DIRECTORY_JOURNAL_NAME, DEFAULT_ASAR_MAX_HEADER_BYTES, DEFAULT_CDP_COMMAND_TIMEOUT_MS, DEFAULT_GHIDRA_STARTUP_TIMEOUT_MS, DEFAULT_HOPPER_STARTUP_TIMEOUT_MS, DEFAULT_JADX_OPERATION_TIMEOUT_MS, DEFAULT_NATIVE_COMMAND_TIMEOUT_MS, DEFAULT_NATIVE_UI_DEADLINE_MS, DEFAULT_PWNTOOLS_TIMEOUT_MS, DEFAULT_REGEX_MATCHING_DEADLINE_MS, DEFAULT_WASM_COMMAND_TIMEOUT_MS, ELECTRON_FUSE_SENTINEL, ELECTRON_IDENTITY_LIMITATION, ELECTRON_MODULE, IDENTIFIER_PATTERN, JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS, JAVASCRIPT_PARENT_CHECKPOINT_HEAP_REMEDIATION, JAVASCRIPT_PARENT_HEAP_NODE_OPTIONS, JAVASCRIPT_PARENT_RESULT_BUDGET_REMEDIATION, JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM, JAVASCRIPT_SEMANTIC_RELATIONS, JAVASCRIPT_SEMANTIC_RELATION_FAMILIES, JAVASCRIPT_SEMANTIC_RELATION_FAMILY, JAVASCRIPT_STATIC_FACT_BYTES, JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM, JavaScriptSemanticEvidenceContextRegistry, MAXIMUM_ASAR_MAX_HEADER_BYTES, MAXIMUM_CAPTURE_DECODER_OLD_GENERATION_MIB, MAXIMUM_REGEX_MATCHING_DEADLINE_MS, MAXIMUM_REGEX_WORKER_HEAP_REQUEST_MIB, MAX_BROWSER_DEADLINE_MS, MAX_GHIDRA_DECOMPILE_TIMEOUT_SECONDS, MAX_INSPECT_PE_DIRECTORY_ENTRIES, MAX_INSPECT_PE_FILE_BYTES, MAX_NATIVE_TIMER_MS, MAX_PROVIDER_STARTUP_TIMEOUT_MS, MAX_WASM_COMMAND_TIMEOUT_MS, NATIVE_UI_WAIT_STEP_MAX_MS, PROCESS_PROVIDER, PRODUCT_IDENTITY, PROVIDER_REJECTION_CODES, RAW_ONLY_ARCHITECTURES, RETURNED_REFERENCE_WIDENING_LIMITATION, SDK_IDENTITY, SOURCE_TO_BUNDLE_SIGNAL_WEIGHTS, STABLE_IDENTIFIER_PATTERN, SemanticPropertyPathCoverage, WASM_INTERFACE_REPRESENTATION_BYTES, WEB_NETWORK_CAPTURE_FORMATS, WEB_NETWORK_CAPTURE_LIMITS, WEB_RUNTIME_LIMITS, ZIP_NON_ENTRY_LIMITATION, ZIP_PACKAGE_FORMATS, absenceClaimable, absoluteLocalPathStringSchema, addressCoordinate, analysisBookmarkSchema, analysisInputErrorFromIssues, analysisOperationInputErrorFromIssues, analysisProfileSchema, analysisProfilesEqual, analysisProviderIdSchema, analysisProviderSelectorSchema, analysisSettingIdSchema, analysisSettingIds, analysisSettingLimit, analysisSettingValueSchema, analysisStringSchema, analyzeJavaScriptApplicationInputSchema, applicationCoverageSchema, applicationFeatureTraceResultSchema, applicationGraphEvidenceSchema, applicationNodeIdentitySchema, applicationNodeObservationSchema, applicationNodeSchema, applicationTraceIdentitiesSchema, applicationVersionComparisonResultSchema, applicationVersionIdentitiesSchema, argumentValue, artifactContradictionId, artifactEdgeId, artifactEdgeSchema, artifactExtractionResultSchema, artifactFormatMetadataSchema, artifactGraphDigest, artifactGraphManifestSchema, artifactIdForContent, artifactInspectionResultSchema, artifactInspectionSources, artifactIntegrityPolicySchema, artifactInventoryCoverageSchema, artifactInventoryResultSchema, artifactManifestId, artifactNodeSchema, artifactOccurrenceSchema, artifactTraversalOmissionKindSchema, assignmentValueSources, availableReferenceKindSchema, browserAllowedOriginsSchema, browserCompletenessSchema, browserDeadlineIncrease, browserDeadlineRetry, browserEndpointSchema, browserExclusionSchema, browserObservationEndpointSchema, browserOriginSchema, browserTargetListSchema, browserVersionSchema, buildJavaScriptRouteInventorySteps, calleeName, canonicalBase64Schema, canonicalJson, canonicalJsonDigestSteps, captureSensitiveValues, cdpCleanupGraceExpired, cdpCommandDeadlineRecovery, cdpCommandTimeoutIsSelectable, cdpCommandTimeoutUnrelatedControl, childNodes, classifyBrowserCompleteness, clearSemanticValueCaches, cliMetadataGuidSchema, collectJavaScriptIdentityWritesSteps, collectSemanticCallable, collectSemanticModuleLink, collectSemanticReferences, collectSemanticReferencesSteps, collectSemanticReturns, committedProviderSchema, commonJsExportApplicability, commonJsRuntimeExportValues, compactPresentationForMcpInputSchemaProfile, compareApplicationVersionsInputSchema, compareJavaScriptExportShapesInputSchema, compareJavaScriptSourcePoints, compareOffsetDateTimeInstants, compareSourceToBundleInputSchema, compareUnicodeCodePoints, completeApplicationCoverage, completeSemanticSteps, compositeKey, containingProcedureResolutionSchema, createAmbientPathResolver, createAnalysisProfile, createArtifactInspection, createEvidence, createHistoricalSourceGraph, createHistoricalSourceManifest, createImmutableEvidenceSteps, createImmutableJavaScriptApplicationGraphSteps, createJavaScriptApplicationEdge, createJavaScriptApplicationGraph, createJavaScriptApplicationNode, createJavaScriptSemanticFingerprint, createJavaScriptSemanticGraph, createJavaScriptSemanticGraphNode, createJavaScriptSemanticGraphRelation, createJavaScriptSemanticGraphUnknown, createReferenceSourcePathLookup, createSemanticModuleInterop, createSemanticOpaqueGlobalObserver, createSemanticReturnedReferences, createWebTextArtifact, currentSemanticScope, decodeReferenceSourceModuleUrlPath, decompileDirectoryIndexSchema, decompileDirectoryInputSchema, decompileDirectoryManifestSchema, decompileJournalHeaderSchema, decompileJournalLineSchema, describeElectronFuseFindings, describeValidationFailure, desktopPathConventions, digestCanonicalValue, digestProcessCommitment, digestSchema, dylibResolutionInputSchema, dylibResolutionResultSchema, electronActiveObservationInputSchema, electronActiveObservationResultSchema, electronActiveProcessMetricSchema, electronActiveTimelineEventSchema, electronActiveWindowSchema, electronExportPath, electronFuseName, electronFuseReportSchema, electronFuseState, electronMemberPath, electronPageInspectionSchema, electronTargetListSchema, emptyArraySchema, evaluateSemanticBinding, evaluateSemanticExpression, evaluateSemanticProvenance, evaluateSemanticProvenanceAtRead, evidenceAuthoritySchema, evidenceInputSchema, evidenceLocationSchema, evidenceSchema, evidenceSemanticContent, evidence_exports, featureSeedMatchMode, fixedNativeAllowance, fixedTupleSchema, flattenSemanticReturnValue, functionBodyEntryAgrees, functionBodySchema, functionDossierSchema, functionFacetAvailabilitySchema, functionInstructionWindowSchema, hasCaptureTruncation, hasCompleteInventoryCoverage, hasSemanticCreateRequireFactoryOrigin, hasStableNativeSymbol, hasUncertainTypeOnlyModuleSideEffect, hasZipSignature, historicalSourceGraphSchema, historicalSourceInventoryHasPartialFacts, historicalSourceLanguages, historicalSourceManifests, historicalSourceParseFailureKey, historicalSourceRelationshipKey, immutableEvidence, immutableSemanticBindings, immutableSemanticScopes, indexCommonJsExportReceiversSteps, indexJavaScriptAmbientWritesSteps, indexSemanticOpaqueEffects, inferJsonShape, init_addressCoordinate, init_analysisProfile, init_analysisResourceLimits, init_analysisSettingDefinitions, init_apkV1MetadataName, init_artifactFormatMetadata, init_artifactGraph, init_artifactIdentity, init_artifactInspection, init_artifactIntegrityPolicy, init_artifactInventoryEvidence, init_binaryTargetTypes, init_browserCompleteness, init_browserDeadline, init_browserObservation, init_browserObservationSchemas, init_canonicalDigest, init_canonicalJsonDigestSteps, init_canonicalOrdering, init_cliCommandNames, init_comparisonSemantics, init_decompileDirectory, init_digests, init_dyldPaths, init_dylibResolution, init_electronActiveObservation, init_electronFuses, init_electronObservation, init_emptyArraySchema, init_evidence, init_evidenceReference, init_evidenceValidation, init_fixedTupleSchema, init_hopperValues, init_identity, init_inputIssueProjection, init_javascriptAnalysisResourceControls, init_javascriptApplicationAnalysis, init_javascriptApplicationEvidenceSchemas, init_javascriptApplicationGraph, init_javascriptApplicationGraphSchemas, init_javascriptApplicationVersionComparisonSchemas, init_javascriptArtifactFiles, init_javascriptAstValues, init_javascriptBuiltinResourceMethods, init_javascriptCommonJsExportReceivers, init_javascriptElectronMemberWrites, init_javascriptExportShapeComparisonSchemas, init_javascriptFeatureTraceSchemas, init_javascriptModuleDeclaration, init_javascriptModuleInterop, init_javascriptRouteFacts, init_javascriptRouteInventory, init_javascriptRuntimeObservation, init_javascriptSemanticAliasSelections, init_javascriptSemanticAmbientWrites, init_javascriptSemanticCallableResults, init_javascriptSemanticCoverage, init_javascriptSemanticEvaluationOrder, init_javascriptSemanticGetterResults, init_javascriptSemanticGraph, init_javascriptSemanticGraphSchemas, init_javascriptSemanticIterationSources, init_javascriptSemanticMutationInitializers, init_javascriptSemanticObjectReferences, init_javascriptSemanticOpaqueEffects, init_javascriptSemanticPrimitives, init_javascriptSemanticProjectedSources, init_javascriptSemanticProjection, init_javascriptSemanticPropertyKeys, init_javascriptSemanticPropertyPaths, init_javascriptSemanticProvenance, init_javascriptSemanticQuerySchemas, init_javascriptSemanticReferenceSources, init_javascriptSemanticRequireOrigin, init_javascriptSemanticResourceLimits, init_javascriptSemanticReturnedReferences, init_javascriptSemanticReturns, init_javascriptSemanticSlots, init_javascriptSemanticState, init_javascriptSemanticTraceSchemas, init_javascriptSemanticTraversal, init_javascriptSemanticValueTypes, init_javascriptSemanticValues, init_javascriptSourceCoordinates, init_javascriptSourceMapPaths, init_javascriptSourceParser, init_javascriptSourceSelection, init_javascriptStaticAnalysisHelpers, init_javascriptStaticCoverage, init_jsonShape, init_jsonStringByteLength, init_jsonValueByteLength, init_localPath, init_machoCpuIdentity, init_managedApplicationGraph, init_managedArtifact, init_managedInspectionEvidence, init_mcpInputSchemaProfile, init_mcpOutputSchemaProfile, init_mcpStartupBudgets, init_nativeApiBoundary, init_nativeCallReference, init_nativeConvention, init_nativeDeadlines, init_nativeInstruction, init_nativeSymbol, init_nativeValueFlow, init_nativeValueTrace, init_offsetDateTime, init_peResources, init_procedureInfo, init_processCapture, init_processCaptureCoverage, init_processCaptureParsing, init_processEvidenceProvider, init_processScenario, init_protobufWire, init_providerSelection, init_qlogCapture, init_recordedTransportUrl, init_referenceSourceGraph, init_referenceSourcePathIdentity, init_relationshipCoverage, init_safeJson, init_sourceToBundleComparisonSchemas, init_stringPatterns, init_unicodeCodePointOrder, init_urlComponents, init_validationFailure, init_wasmArtifact, init_wasmInterface, init_webContentArtifact, init_webNetworkCapture, init_webRuntime, init_zipPackageFormat, inspectElectronFusesInputSchema, inspectElectronPageInputSchema, inspectPeResourcesInputSchema, inspectWasmArtifactInputSchema, inspectWebNetworkCaptureInputSchema, inspectWebPageInputSchema, inspectWebPageWithSourceInputSchema, integrityContradictionSchema, invalidateSemanticRequireDelegateWrites, isDecompileFunctionRelativePath, isDigest, isElfMetadataArchitecture, isErasedJavaScriptDeclaration, isErasedJavaScriptValueChild, isImmutableEvidence, isJavaScriptSourcePath, isLiteralLoopbackHostname, isMachOFormat, isNullishJavaScriptSyntax, isPaddedBase64, isPathWithinRoot, isPortableAbsoluteReferenceTarget, isProcessEvidenceProvider, isSwiftRuntimeLibrary, isTypeOnlyExportDeclaration, isTypeOnlyImportDeclaration, isTypeOnlyImportSpecifier, isUnmodeledJavaScriptRuntimeScope, isUnmodifiedGlobalReference, isUnshadowedGlobal, isV1SignatureBlockName, isV1SignatureFileName, isV1SignatureMetadataName, isZipPackageFormat, iterateUrlQueryParameters, javaScriptAnalysisCoverageLimits, javaScriptAnalysisResourceControlsSchema, javaScriptArtifactTextExclusion, javaScriptExportShapeComparisonResultSchema, javaScriptExportShapeIdentitiesSchema, javaScriptFileOccurrenceSchema, javaScriptInventoryRouteSchema, javaScriptProgramStrictness, javaScriptRouteCaptureOmissionSchema, javaScriptRouteGapSchema, javaScriptRouteInventorySchema, javaScriptRouteInventorySourceSchema, javaScriptRouteMechanismSchema, javaScriptRouteOccurrenceSchema, javaScriptRouteSourceFactsSchema, javaScriptRuntimeContext, javaScriptSemanticCeilingCoverage, javaScriptSemanticEvidenceContextSchema, javaScriptSemanticFingerprintSchema, javaScriptSemanticGraphInputSchema, javaScriptSemanticNodeId, javaScriptSemanticNodeSchema, javaScriptSemanticQueryInputSchema, javaScriptSemanticQueryResultSchema, javaScriptSemanticRelationSchema, javaScriptSemanticResourceLimitSchema, javaScriptSemanticSourceExclusion, javaScriptSemanticTraceResultSchema, javaScriptSemanticUnknownOmissionsSchema, javaScriptSemanticUnknownSchema, javaScriptSourcePathsSchema, javaScriptSourceSelectionSchema, javaScriptStaticCoverageSchema, javaScriptWorkerHeapExhaustionRecovery, javaScriptWorkerHeapRemediation, javascriptApplicationAnalysisResultSchema, javascriptApplicationGraphSchema, javascriptDisplayText, javascriptRuntimeKindSchema, javascriptRuntimeObservationSchema, javascriptRuntimeTargetListSchema, javascriptRuntimeUnresolvedLocationSchema, javascriptSourceRangeContains, javascriptSourceRangeKey, javascriptSourceRangeSchema, joinSemanticPropertyPaths, jsonStringByteLength, jsonValueByteLength, jsonValueType, listBrowserTargetsInputSchema, listElectronTargetsInputSchema, listJavaScriptRuntimeTargetsInputSchema, localPathStringSchema, locateTrailingZipArchive, logicalPathEscapesRoot, logicalPathNfc, machoArchitectureFamily, machoArchitectureName, machoCpuSubtypeBase, machoImageSlices, managedApplicationGraphResultSchema, managedArtifactInspectionSchema, managedMemberInspectionSchema, managedMetadataTokenSchema, managedNativeBoundaryInspectionSchema, managedNativeImportSchema, mcpDoctorDeadlineMsSchema, mcpFirstCatalogBudgetMsSchema, mcpInitializeBudgetMsSchema, mcpInputSchemaProfileSchema, mcpOutputSchemaProfileSchema, mcpPhaseBudgetRecovery, mcpToolsListBudgetMsSchema, mergeJavaScriptApplicationNodes, moduleFactory, modulePropertyName, nativeApiBoundarySchema, nativeApiInspectionResultSchema, nativeCallClassificationSchema, nativeCallReferenceSchema, nativeCallTargetsSchema, nativeCommandTimeoutField, nativeDeadlineRecovery, nativeInstructionInputSchema, nativeInstructionSchema, nativeRuntimeConvention, nativeSymbolMetadataSchema, nativeSymbolOrigin, nativeUiDeadlineField, nativeValueFlowSchema, nativeValueTraceInputSchema, nativeValueTraceSchema, noRuntimeOverrideSentence, normalizeJoinedLogicalPath, nulFreeStringSchema, observeJavaScriptRuntimeInputSchema, observePossibleCommonJsDelegateWrite, occurrenceIdForLocation, offsetDateTimeInstantFromEpochMilliseconds, offsetDateTimeSchema, optionalBrowserDeadlineMs, ownedApplicationVersionComparisonResultSchema, parseArtifactInspectionInventoryResult, parseArtifactInventoryEvidence, parseArtifactInventoryResult, parseContainingProcedureResolution, parseDocuments, parseEvidence, parseFunctionDossier, parseJavaScriptSource, parseJsonObject, parseListCount, parseMcpInputSchemaProfile, parseMcpOutputSchemaProfile, parseMcpStartupBudgets, parseOffsetDateTimeInstant, parseOwnedJavaScriptApplicationAnalysisSteps, parseProcessCapture, parseRecordedTransportUrl, parseRecoveredJavaScript, parseRelatedAddresses, parseSegments, parseUrlQueryParameterNames, parserPluginsForPath, partialApplicationCoverage, partialProcessCaptureObservationSchema, peResourcesSchema, prefixedDigestSchema, procedureIdentitySchema, procedureInfoSchema, processCaptureSchema, processComparisonContract, processScenarioCommitment, processScenarioSchema, processSourceTruncated, projectBinaryOverview, projectInputIssues, projectManagedGraph, projectedExportReturnShapesSchema, protobufCaptureCoverageSchema, protobufDecodingObjectSchema, protobufDecodingSchema, protobufFieldSchema, protobufFrameSchema, providerSchema, pwntoolsTimeoutField, pyInstallerEntryDeclaration, qlogCaptureFactsSchema, range, readArtifactInspectionSources, readEvidence, readEvidencePayload, readExactJavaScriptLiteral, readImmutableEvidence, readManagedGraphProjection, readManagedInspectionEvidence, readNativeDeadline, readRecordedDateTime, rebindEvidenceSubjectTargetPath, rebindEvidenceToTargetPath, recordSemanticValueLimit, recordedBrowserObservationEndpointSchema, recordedBrowserOriginSchema, recordedPathSegments, referenceEdgeSchema, referenceKindSchema, relationshipCoverageLimitations, relationshipCoverageSchema, resolveJavaScriptSourceMapReferences, resolveJavaScriptSourceMapUrl, resolveSemanticBindingFromScope, resolveSemanticBindingState, resolveSemanticModuleCallables, resolveTreePath, retainSemanticAmbientEffect, retainedEvidenceReferenceSchema, runtimeFunctionParameters, safeParseEvidence, safeParseImmutableEvidence, safeParseJson, safeParseOwnedWebNetworkCapture, safeParseProcessCapture, sanitizeBrowserUrl, sanitizedBrowserUrlSchema, sealTransferredJavaScriptApplicationGraphSteps, sealTransferredJavaScriptSemanticGraphSteps, selectedBrowserDeadlineMs, selectedCdpCommandTimeoutMs, selectedWebNetworkCaptureTimeoutMs, semanticAliasSelectionChoices, semanticArrayIndex, semanticArrayPropertyReferences, semanticBindingAtRead, semanticBindingCanBeRebound, semanticBindingId, semanticBindingLookupAt, semanticBindingLookupFromScope, semanticBranchMayBeSkipped, semanticBuiltinNamespacePath, semanticCallableIdForNode, semanticCallableResultExpressions, semanticCallableResultKind, semanticCaptureOrderingIdentity, semanticCapturedSelectionsAfterPropertyRead, semanticClassAccessorReferences, semanticClassCandidates, semanticClassPropertyReferences, semanticComputedMethodKey, semanticContainer, semanticCopiedReferencePath, semanticCoverage, semanticCoverageResourceLimits, semanticEffectTiming, semanticEffectTimingWithinActivation, semanticFinalObjectProperty, semanticFinalObjectStringProperty, semanticGetterReceiverReferences, semanticGlobalProcessOrigin, semanticGlobalProcessPathOrigin, semanticIdentifierRole, semanticImportEqualsSpecifier, semanticIterationCardinality, semanticIterationSources, semanticKnownArrayIteration, semanticKnownSymbolKey, semanticMemberChain, semanticMutableBuiltinOrigin, semanticMutationInitializers, semanticNormalizeCapturedSelections, semanticObjectAccessorReferences, semanticObjectPatternKeys, semanticObjectPropertyReferences, semanticOpaqueBindingEffects, semanticOpaqueBindingReadMayHaveChanged, semanticOpaqueGlobalMayHaveChanged, semanticOpaqueNameMayHaveChanged, semanticOriginalGlobalProcessAt, semanticPrimitiveSet, semanticPriorStatementMayExit, semanticProjectedSourceFactsAtRead, semanticPropertyPathKeyMatches, semanticPropertyPointer, semanticPropertyReadSources, semanticReferenceRole, semanticReferenceSourcesInactive, semanticRequireCallAt, semanticRequireExportsIdentity, semanticRequireLoaderAt, semanticRequireOrigin, semanticResolutionBlocked, semanticResourceLimitCoverage, semanticResourceLimitReason, semanticRuntimeExportValueSources, semanticScopeExitEffect, semanticScopeId, semanticSelectedReferenceSlot, semanticShiftCapturedSelections, semanticSlotAtPath, semanticStableInitializer, semanticStaticPropertyKey, semanticStaticPropertyName, semanticTopLevelEffectFollowsCapture, semanticVariableScope, semanticWriteSiteReadsFirst, semanticWriteSiteTarget, semanticWriteTargets, sha256Text, singleQueryValues, sourceRangesEqual, sourceToBundleComparisonResultSchema, startsWithV1MetaInfPrefix, staticJavaScriptTruthiness, staticObjectProperty, stringValue, traceApplicationFeatureInputSchema, traceDylibLoading, traceJavaScriptSemanticsInputSchema, traverseJavaScriptAst, traverseJavaScriptAstSteps, traverseJavaScriptValueAst, traverseJavaScriptValueAstSteps, truncatedApplicationCoverage, unexaminedJavaScriptStaticCoverage, uniqueSorted, uniqueSortedBy, unresolvedCallSchema, unwrapJavaScriptExpression, urlDeclaresQueryOrFragment, v1SignatureFileNameForBlock, validateAnalysisProfileProvider, validateArtifactInventorySubject, wasmArtifactMatchesSubject, wasmArtifactPathsSchema, wasmArtifactSchema, wasmInterfaceEntryRepresentationBytes, wasmInterfaceSchema, webNetworkCaptureArtifactSchema, webNetworkCaptureBinaryDescriptorSchema, webNetworkCaptureDecoderSchema, webNetworkCapturePayloadSchema, webNetworkCaptureRecordSchema, webNetworkCaptureSchema, webNetworkCaptureTimeoutRecovery, webPageInspectionSchema, webRuntimeCommandTimeoutSchema, webRuntimeLocationSchema, webRuntimeScopeSchema, webRuntimeSourceSchema, webRuntimeTargetSchema, webTextArtifactMetadataSchema, webTextArtifactSchema, withEvidenceCallerInputPath, zipPackageFormatForPath, zipRootPackageFormat };