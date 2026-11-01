import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { DEFAULT_NATIVE_COMMAND_TIMEOUT_MS, DEFAULT_NATIVE_UI_DEADLINE_MS, MAX_NATIVE_TIMER_MS, NATIVE_UI_WAIT_STEP_MAX_MS, analysisInputErrorFromIssues, compareUnicodeCodePoints, fixedNativeAllowance, init_binaryTargetTypes, init_inputIssueProjection, init_nativeDeadlines, init_safeJson, init_unicodeCodePointOrder, isMachOFormat, nativeDeadlineRecovery, readNativeDeadline, safeParseJson } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { demangleSwiftSchema, init_nativeInspection, inspectMachoSchema, inspectPlistSchema, inspectSignatureSchema, listArchitecturesSchema } from "./analysisView-DxQriOKj.js";
import { AnalysisAccessDeniedError, AnalysisArtifactChangedError, AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisError, AnalysisInputError, AnalysisOutputError, AnalysisResourceConstraintError, AnalysisTimeoutError, AnalysisUnsupportedTargetError, BinaryTargetError, EvidenceIntegrityError, MAX_JSON_DEPTH, err, fixedAllowanceOptions, init_analysisErrorBase, init_analysisErrorCore, init_configurationErrors, init_evidenceErrors, init_fixedAllowanceRemediation, init_jsonValue, init_result, jsonValueSchema, ok, resolvedAnalysisError } from "./jsonLines-Gf10X4s1.js";
import { ProviderAdapterError, init_analysisErrorProjection, init_providerAdapterError, projectAnalysisError } from "./analysisErrorProjection-DCiob2UF.js";
import { absoluteCallerPath, init_callerPath } from "./callerPath-D1wtkHi_.js";
import { ArtifactReaderFailure, OwnedFileHandle, RegularFileCancelled, RegularFileChangedError, RegularFileCleanupFailure, RegularFileOperationCancelled, assertRegularFileActive, init_ArtifactReader, init_OwnedFileHandle, init_OwnedRegularFile, init_RegularFile, isSelectedRegularFileError, regularFileCancellation, sameRegularFileState } from "./ArtifactReader-PV1DaSaC.js";
import { init_BoundedFileBytes, readBoundedFileBytes } from "./BoundedFileBytes-DNoM_zCF.js";
import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-DZIxbgES.js";
import { ArtifactFileCleanupFailure, artifactFileCancellationCause, artifactFilePrimaryFacts, assertArtifactReadActive, bindArtifactFileCleanup, init_ArtifactFileOperation, withArtifactRegularFile } from "./ArtifactFileOperation-o-ukSUGG.js";
import { DEFAULT_DISPATCH_METADATA_INPUT_BYTES, MAXIMUM_DISPATCH_METADATA_INPUT_BYTES, createPlistNumberProjection, incompletePlistNumberLimitation, init_objcSwiftMetadata, init_plistNumbers, init_swiftSymbolClassification, isAppleDispatchMetadataTarget, isSwiftMangledSymbolName, nativeDispatchMetadataInputSchema, nativeDispatchMetadataResultSchema, objcSwiftMetadataSchema, projectObjcClassMethods } from "./interfaceBuilderGraph-DKoO7eCM.js";
import { ArtifactResourceRetryFailure, ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-BLhM2W5p.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-DBL-xO0h.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-CdFjQgxe.js";
import { PlistNestingLimitError, binaryDatePrecisionOverlapLimitation, init_nativeCallObservation, init_nativeUiObservation, init_plistValue, nativeCallEventSchema, nativeCallObservationInputSchema, nativeCallObservationResultSchema, nativeCallProcessOutcomeSchema, nativeCapturedOutputSchema, nativeCodeLocationSchema, nativeUiObservationInputSchema, nativeUiResultSchema, nativeUiScenarioInputSchema, nativeUiSnapshotSchema, negativeZeroReal, negativeZeroRealLimitation, nonFiniteRealLimitation, projectPlistValue, unknownDateLimitation, unknownScalarLimitation } from "./toolOutputSchemaGroups-D49U2-8O.js";
import { createAnalysisExecution, init_AnalysisProvider } from "./AnalysisProvider-oGoFr5wN.js";
import { DarwinProcessOwnershipInspectionError, SWIFTC_INTERRUPT, init_DarwinProcessRunTokenReader, init_ProcessOwnershipObservation, observeProcessStartIdentity, signalProcessWithStartIdentity } from "./ProcessOwnershipEvidence-DNSlHo8A.js";
import { ExecFileOutputCancelledError, execFileOutput, init_ExecFileOutput } from "./ExecFileOutput-OgYrEogw.js";
import { ProviderProcessSupervisor, init_ProviderProcess, spawnOwnedProviderProcess } from "./ProviderProcess-DdOAhfXm.js";
import { cleanupOwnedProcessGroup, init_ProcessOwnership } from "./ProcessOwnership-BIq-8nU3.js";
import { ProviderStartupDeadline, init_ProviderDeadline, waitForAbortableDelay } from "./ProviderDeadline-8m2pFRDc.js";
import { PrivateRuntimeRoot, init_PrivateRuntimeRoot } from "./PrivateRuntimeRoot-CCl5QOdR.js";
import { init_snapshotEnvironment, snapshotEnvironment } from "./snapshotEnvironment-Dxega7Jt.js";
import { hashStableFile, init_StableFileHash, stableFileHashCause } from "./StableFileHash-DxZbYqOI.js";
import { hasBinaryPlistSignature, init_appleArchiveFormat } from "./appleArchiveFormat-B-JoSBSY.js";
import { init_machoPlatform, legacyMachoPlatform } from "./machoPlatform-BD3SQwix.js";
import { MACHO_ARCHITECTURE_POLICIES, UnsupportedMachoMetadataFormatError, init_AppleDispatchDecodeFacts, init_AppleMachoFixups, init_AppleMachoSelection, init_MachoArchitectureSelection, issue, parseMachoLayout, parsePointerFixups, selectMachoArchitectureName } from "./AppleMachoSelection-DBDxZY5B.js";
import { PropertyListDecodeBudgetFailure, UnsupportedBinaryPlistUidError, XmlPlistTextDecodeError, decodeBinaryPlistScalars, decodeXmlPlistText, estimateBinaryPlistExpansion, init_PlistScalars, init_PropertyListDecodeBudget, init_propertyListKeys, init_propertyListXmlText, omitPrototypeKeys, omittedPrototypeKeysLimitation, parseXmlPropertyList, preflightPropertyListDecode, scanBinaryPlistScalars } from "./propertyListKeys-Dsm_-i54.js";
import { NATIVE_TOOL_CONTRACTS, init_nativeToolContracts } from "./nativeToolContracts-UdqTuMlR.js";
import { NATIVE_COMMAND_OUTPUT_BUDGET_BYTES, NATIVE_FAILURE_DIAGNOSTIC_BYTES, NativeCommandFailure, XcrunCommandRunner, failureCapture, init_CommandRunner, init_lipo, parseLipoCapture, resolveXcrunTool } from "./lipo-DHDi7Wk6.js";
import { APPLE_DISPATCH_METADATA_ANALYSIS_PROFILE, NATIVE_MACOS_PROVIDER_IDENTITY, init_NativeMacOSProviderMetadata, nativeMacOSCapabilities } from "./binary-zMthmhH8.js";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { lstat, mkdir, mkdtemp, open, realpath, rm, stat, symlink, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { parseBinary } from "plist";

//#region dist/native/NativeCommandAnalysisError.js
var translateNativeCommandFailure;
function init_NativeCommandAnalysisError() {
	return (init_NativeCommandAnalysisError = __esmMin((() => {
		init_analysisErrorCore();
		init_providerAdapterError();
		init_NativeMacOSProviderMetadata();
		init_nativeDeadlines();
		init_CommandRunner();
		translateNativeCommandFailure = (operation, failure, timeoutMs = DEFAULT_NATIVE_COMMAND_TIMEOUT_MS, presentation = {}) => {
			const cleanupOwners = [...failure.cleanupFailures, ...failure.cleanupOwner === undefined ? [] : [{
				owner: failure.cleanupOwner,
				marker: failure.cleanupMarker,
				reason: failure.cleanupFailure ?? "native command cleanup remains incomplete",
				resources: failure.cleanupResources
			}]];
			const markers = cleanupOwners.flatMap(({ marker }) => marker === undefined ? [] : [marker]);
			const bindCleanup = (error) => cleanupOwners.length === 0 || cleanupOwners.some(({ marker }) => marker === undefined) ? error : error.bindCleanupDependencies([...new Set(markers)]);
			const preparation = failure.preparationFailure;
			if (preparation !== undefined) {
				const marker = preparation.cleanupFailure;
				const compiler = preparation.compilerOutcome;
				const options = {
					cause: failure,
					...preparation.capturedOutput === undefined ? {} : { capturedOutput: preparation.capturedOutput },
					...marker === undefined ? {} : { cleanup: {
						reason: marker.message,
						resources: marker.cleanupResources
					} },
					diagnostics: {
						phase: "process-preparation",
						tool: failure.tool,
						reason: failure.reason,
						detail: preparation.message,
						...compiler === undefined ? {} : { compiler_outcome: {
							outcome: compiler.outcome,
							code: compiler.code,
							signal: compiler.signal,
							...compiler.timeoutMs === undefined ? {} : { timeout_ms: compiler.timeoutMs }
						} }
					}
				};
				const error = preparation.cancellation === undefined ? new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, options) : failure.reason === "timeout" ? new AnalysisTimeoutError(operation, timeoutMs, {
					...options,
					cause: preparation.cancellation.reason,
					...presentation.timeoutRecovery ?? nativeDeadlineRecovery({
						timeoutMs,
						setting: "native_command_timeout_ms",
						cliFlag: "--native-command-timeout-ms",
						defaultMs: 6e4,
						phase: "macOS native command deadline",
						unchanged: `The ${String(67108864)}-byte command output allowance and the ${String(65536)}-byte failure-diagnostic excerpt have no runtime override.`
					})
				}) : new AnalysisCancelledError(operation, {
					...options,
					cause: preparation.cancellation.reason
				});
				return bindCleanup(marker === undefined ? error : error.bindCleanupDependencies([marker]));
			}
			const capturedOutput = failure.capture === null ? undefined : {
				stdout: failure.capture.stdout,
				stderr: failure.capture.stderr,
				truncated: failure.capture.truncated,
				stdout_bytes: failure.capture.stdoutBytes,
				stderr_bytes: failure.capture.stderrBytes,
				exit_code: failure.capture.exitCode,
				signal: failure.capture.signal
			};
			const cleanup = failure.cleanupFailure === null ? undefined : {
				reason: failure.cleanupFailure,
				resources: [...failure.cleanupResources]
			};
			const errorOptions = {
				cause: failure,
				...capturedOutput === undefined ? {} : { capturedOutput },
				...cleanup === undefined ? {} : { cleanup }
			};
			if (failure.reason === "unavailable") {
				const reason = presentation.unavailableMessage ?? `${failure.tool} is unavailable through xcrun.`;
				return bindCleanup(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, reason, {
					...errorOptions,
					userMessage: reason
				}));
			}
			if (failure.reason === "cancelled") return bindCleanup(new AnalysisCancelledError(operation, {
				...errorOptions,
				...failure.cancellation === undefined ? {} : { cause: failure.cancellation.reason }
			}));
			if (failure.reason === "timeout") return bindCleanup(new AnalysisTimeoutError(operation, timeoutMs, {
				...errorOptions,
				...presentation.timeoutRecovery ?? nativeDeadlineRecovery({
					timeoutMs,
					setting: "native_command_timeout_ms",
					cliFlag: "--native-command-timeout-ms",
					defaultMs: 6e4,
					phase: "macOS native command deadline",
					unchanged: `The ${String(67108864)}-byte command output allowance and the ${String(65536)}-byte failure-diagnostic excerpt have no runtime override.`
				})
			}));
			if (failure.reason === "output-limit") return bindCleanup(new AnalysisResourceConstraintError(operation, "memory", `Native command output exceeded ${String(NATIVE_COMMAND_OUTPUT_BUDGET_BYTES)} bytes. Complete output is required for analysis. This release has no runtime override. native_command_timeout_ms does not raise this allowance.`, { max_output_bytes: NATIVE_COMMAND_OUTPUT_BUDGET_BYTES }, {
				...errorOptions,
				...fixedNativeAllowance("The native command output capture allowance", "capture", `${String(NATIVE_COMMAND_OUTPUT_BUDGET_BYTES)} bytes`)
			}));
			return bindCleanup(new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, {
				...errorOptions,
				diagnostics: {
					tool: failure.tool,
					reason: failure.reason,
					exit_code: failure.capture?.exitCode ?? failure.exitCode,
					signal: failure.capture?.signal ?? null,
					stdout_bytes: failure.capture?.stdoutBytes ?? 0,
					stderr_bytes: failure.capture?.stderrBytes ?? 0,
					...failure.detail === null ? {} : { detail: failure.detail }
				}
			}));
		};
	})))();
}

//#endregion
//#region dist/native/parsers/plist.js
var MAX_NATIVE_PLIST_BYTES, MAX_NATIVE_PLIST_DECODE_BYTES, MAX_NATIVE_PLIST_NESTING_DEPTH, mebibytes, NATIVE_PLIST_INPUT_ALLOWANCE, plistObject, INTEGRAL_LITERAL, PlistJsonIntegerLiteral, plistNestingError, plistOutputError, readPlistJson, readPlistJsonSource, projectPlistJsonAttempt, parsePlistXml, parsePlistXmlSource, projectPlistXml, parsePlistBinary, prototypeKeyLimitations, projectedScalarLimitations, negativeZeroLimitations, numberLimitations, mapJsonNumbers, projectPlistBundle;
function init_plist() {
	return (init_plist = __esmMin((() => {
		init_analysisErrorCore();
		init_fixedAllowanceRemediation();
		init_jsonValue();
		init_plistValue();
		init_propertyListKeys();
		init_result();
		init_plistNumbers();
		init_PlistScalars();
		init_PropertyListDecodeBudget();
		init_appleArchiveFormat();
		init_propertyListXmlText();
		MAX_NATIVE_PLIST_BYTES = 64 * 1024 * 1024;
		MAX_NATIVE_PLIST_DECODE_BYTES = 64 * 1024 * 1024;
		MAX_NATIVE_PLIST_NESTING_DEPTH = MAX_JSON_DEPTH - 2;
		mebibytes = (bytes) => `${String(bytes / (1024 * 1024))} MiB`;
		NATIVE_PLIST_INPUT_ALLOWANCE = `the fixed ${mebibytes(MAX_NATIVE_PLIST_BYTES)} (${String(MAX_NATIVE_PLIST_BYTES)}-byte) native plist input allowance (no runtime override)`;
		plistObject = z.record(z.string(), z.unknown());
		INTEGRAL_LITERAL = /^-?\d+$/u;
		PlistJsonIntegerLiteral = class {
			value;
			digits;
			constructor(value, digits) {
				this.value = value;
				this.digits = digits;
			}
		};
		plistNestingError = (cause) => new AnalysisResourceConstraintError("inspect_plist", "memory", cause instanceof Error ? cause.message : String(cause), { maximum_nesting_depth: MAX_NATIVE_PLIST_NESTING_DEPTH }, {
			cause,
			...fixedAllowanceOptions(`The ${String(MAX_NATIVE_PLIST_NESTING_DEPTH)}-level native plist nesting allowance (no runtime override)`, "parser")
		});
		plistOutputError = (cause, reason) => cause instanceof PlistNestingLimitError ? plistNestingError(cause) : new AnalysisOutputError("inspect_plist", reason ?? (cause instanceof Error ? cause.message : String(cause)), { cause });
		readPlistJson = (output) => {
			let decoded;
			let needsNumberTypes = false;
			let nonFiniteNumberObserved = false;
			try {
				const text = output.replace(/^\uFEFF/u, "");
				decoded = ok(JSON.parse(text, (_key, item, context) => {
					const source = context?.source;
					if (typeof item === "number" && !Number.isFinite(item)) nonFiniteNumberObserved = true;
					if (typeof item !== "number" || Number.isSafeInteger(item) || source === undefined || !INTEGRAL_LITERAL.test(source)) return item;
					needsNumberTypes = true;
					return new PlistJsonIntegerLiteral(item, source);
				}));
			} catch (cause) {
				decoded = err(cause);
			}
			return {
				rootKind: !decoded.ok ? "invalid" : decoded.value !== null && typeof decoded.value === "object" && !(decoded.value instanceof PlistJsonIntegerLiteral) ? "container" : "scalar",
				needsNumberTypes: decoded.ok && needsNumberTypes,
				nonFiniteNumberObserved: decoded.ok && nonFiniteNumberObserved,
				project: (xmlConversion) => projectPlistJsonAttempt(decoded, xmlConversion)
			};
		};
		readPlistJsonSource = (bytes) => {
			try {
				return readPlistJson(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
			} catch {
				return undefined;
			}
		};
		projectPlistJsonAttempt = (attempt, xmlConversion) => {
			let literals;
			let exactIntegerCount = 0;
			let ambiguousNumberCount = 0;
			let negativeZeroRealCount = 0;
			const project = (item, depth) => {
				if (depth > MAX_NATIVE_PLIST_NESTING_DEPTH) throw new PlistNestingLimitError(MAX_NATIVE_PLIST_NESTING_DEPTH);
				if (typeof item === "number" && Object.is(item, -0)) {
					negativeZeroRealCount += 1;
					return negativeZeroReal();
				}
				if (item instanceof PlistJsonIntegerLiteral) {
					const integer = literals?.incomplete === false && literals.integers.get(item.value)?.has(item.digits) === true;
					const real = literals?.incomplete === false && literals.reals.has(item.value);
					if (integer && !real) {
						exactIntegerCount += 1;
						return {
							$plist_type: "integer",
							decimal: item.digits
						};
					}
					if (real && !integer) return item.value;
					ambiguousNumberCount += 1;
					return item.value;
				}
				if (Array.isArray(item)) return item.map((child) => project(child, depth + 1));
				if (item !== null && typeof item === "object") return Object.fromEntries(Object.entries(item).map(([key, value]) => [key, project(value, depth + 1)]));
				return item;
			};
			let decoded;
			try {
				literals = xmlConversion === undefined ? undefined : parseXmlPropertyList(xmlConversion, MAX_NATIVE_PLIST_NESTING_DEPTH).numberLiterals;
				if (!attempt.ok) return err(plistOutputError(attempt.error));
				decoded = omitPrototypeKeys(project(attempt.value, 0));
			} catch (cause) {
				return err(plistOutputError(cause));
			}
			const { value } = decoded;
			return ok({
				value,
				bundle: projectPlistBundle(value),
				limitations: [
					...negativeZeroLimitations(negativeZeroRealCount),
					...literals?.incomplete === true ? [incompletePlistNumberLimitation] : [],
					...numberLimitations(exactIntegerCount, ambiguousNumberCount),
					...prototypeKeyLimitations(decoded.omittedPrototypeKeys)
				]
			});
		};
		parsePlistXml = (output) => {
			const parsed = projectPlistXml(output, "plutil XML conversion was not a readable plist");
			return !parsed.ok ? parsed : ok({
				...parsed.value,
				limitations: ["plutil cannot express this plist as JSON, so it was decoded from plutil's XML conversion; data and date values are typed objects such as { \"$plist_type\": \"data\", \"base64\": ... }.", ...parsed.value.limitations]
			});
		};
		parsePlistXmlSource = (bytes) => {
			try {
				const text = decodeXmlPlistText(bytes);
				preflightPropertyListDecode(bytes, MAX_NATIVE_PLIST_DECODE_BYTES, text, {
					numberProjection: true,
					budget: "the native plist decode budget"
				});
				return projectPlistXml(text);
			} catch (cause) {
				if (cause instanceof XmlPlistTextDecodeError) return err(cause);
				if (cause instanceof PropertyListDecodeBudgetFailure) return err(new AnalysisResourceConstraintError("inspect_plist", "memory", cause.message, { maximum_decoded_bytes: MAX_NATIVE_PLIST_DECODE_BYTES }, {
					cause,
					...fixedAllowanceOptions(`The ${mebibytes(MAX_NATIVE_PLIST_DECODE_BYTES)} (${String(MAX_NATIVE_PLIST_DECODE_BYTES)}-byte) native XML plist decode allowance (no runtime override)`, "parser")
				}));
				return err(plistOutputError(cause));
			}
		};
		projectPlistXml = (output, failureReason) => {
			let projected;
			let omittedPrototypeKeys;
			let literals;
			try {
				const decoded = parseXmlPropertyList(output, MAX_NATIVE_PLIST_NESTING_DEPTH);
				omittedPrototypeKeys = decoded.omittedPrototypeKeys;
				literals = decoded.numberLiterals;
				projected = projectPlistValue(decoded.value, undefined, MAX_NATIVE_PLIST_NESTING_DEPTH);
			} catch (cause) {
				return err(plistOutputError(cause, failureReason));
			}
			let exactIntegerCount = 0;
			let ambiguousNumberCount = 0;
			const value = mapJsonNumbers(projected.value, (item) => {
				const decimals = literals.integers.get(item);
				if (decimals === undefined) return item;
				const [decimal] = decimals;
				if (literals.incomplete || decimals.size !== 1 || decimal === undefined || literals.reals.has(item)) {
					ambiguousNumberCount += 1;
					return item;
				}
				exactIntegerCount += 1;
				return {
					$plist_type: "integer",
					decimal
				};
			});
			return ok({
				value,
				bundle: projectPlistBundle(value),
				limitations: [
					...projectedScalarLimitations(projected),
					...literals.incomplete ? [incompletePlistNumberLimitation] : [],
					...numberLimitations(exactIntegerCount, ambiguousNumberCount),
					...prototypeKeyLimitations(omittedPrototypeKeys)
				]
			});
		};
		parsePlistBinary = (bytes) => {
			try {
				if (!hasBinaryPlistSignature(bytes)) throw new TypeError("selected file does not have a binary plist header");
				const expansion = estimateBinaryPlistExpansion(bytes, MAX_NATIVE_PLIST_DECODE_BYTES, {
					budget: "the native plist decode budget",
					numberProjection: true,
					maximumDepth: MAX_NATIVE_PLIST_NESTING_DEPTH,
					fail: (kind, message) => kind === "cycle" ? new TypeError("binary plist object references form a cycle, which a property list cannot represent") : new PropertyListDecodeBudgetFailure(kind, message)
				});
				const scalarMetadata = scanBinaryPlistScalars(bytes, expansion);
				const decoded = parseBinary(decodeBinaryPlistScalars(bytes, scalarMetadata, expansion));
				const projected = projectPlistValue(decoded, undefined, MAX_NATIVE_PLIST_NESTING_DEPTH);
				const numbers = createPlistNumberProjection(scalarMetadata.literals);
				const value = numbers.project(projected.value);
				return ok({
					value,
					bundle: projectPlistBundle(value),
					limitations: [
						...projectedScalarLimitations(projected),
						...expansion.datePrecisionOverlapCount === 0 ? [] : [binaryDatePrecisionOverlapLimitation(expansion.datePrecisionOverlapCount)],
						...numbers.limitations(),
						...expansion.binaryPrototypeKeyObserved ? [omittedPrototypeKeysLimitation(null)] : []
					]
				});
			} catch (cause) {
				if (cause instanceof UnsupportedBinaryPlistUidError) return err(cause);
				if (cause instanceof PlistNestingLimitError || cause instanceof PropertyListDecodeBudgetFailure && cause.kind === "depth") return err(plistNestingError(cause));
				if (cause instanceof PropertyListDecodeBudgetFailure) return err(new AnalysisResourceConstraintError("inspect_plist", "memory", cause.message, { maximum_decoded_bytes: MAX_NATIVE_PLIST_DECODE_BYTES }, {
					cause,
					...fixedAllowanceOptions(`The ${mebibytes(MAX_NATIVE_PLIST_DECODE_BYTES)} (${String(MAX_NATIVE_PLIST_DECODE_BYTES)}-byte) native binary plist decode allowance (no runtime override)`, "parser")
				}));
				return err(new AnalysisOutputError("inspect_plist", cause instanceof Error ? cause.message : String(cause), { cause }));
			}
		};
		prototypeKeyLimitations = (count) => count === 0 ? [] : [omittedPrototypeKeysLimitation(count)];
		projectedScalarLimitations = (projected) => [
			...projected.nonFiniteRealCount === 0 ? [] : [nonFiniteRealLimitation(projected.nonFiniteRealCount)],
			...negativeZeroLimitations(projected.negativeZeroRealCount),
			...projected.unknownDateCount === 0 ? [] : [unknownDateLimitation(projected.unknownDateCount)],
			...projected.unknownScalarCount === 0 ? [] : [unknownScalarLimitation(projected.unknownScalarCount)]
		];
		negativeZeroLimitations = (count) => count === 0 ? [] : [negativeZeroRealLimitation(count)];
		numberLimitations = (exactIntegerCount, ambiguousNumberCount) => [...exactIntegerCount === 0 ? [] : [`${String(exactIntegerCount)} integer value(s) exceed the exact range of a JSON number and are reported as { "$plist_type": "integer", "decimal": "<exact digits>" }.`], ...ambiguousNumberCount === 0 ? [] : [`${String(ambiguousNumberCount)} number(s) beyond the exact range of a JSON number are reported as decoded because the XML literal they came from, a rounded <integer> or a <real>, cannot be identified.`]];
		mapJsonNumbers = (value, map) => {
			if (typeof value === "number") return map(value);
			if (Array.isArray(value)) return value.map((item) => mapJsonNumbers(item, map));
			if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mapJsonNumbers(item, map)]));
			return value;
		};
		projectPlistBundle = (value) => {
			const object = plistObject.safeParse(value);
			const field = (name) => {
				if (!object.success) return null;
				const candidate = object.data[name];
				return typeof candidate === "string" ? candidate : null;
			};
			return {
				identifier: field("CFBundleIdentifier"),
				executable: field("CFBundleExecutable"),
				name: field("CFBundleName"),
				version: field("CFBundleVersion"),
				short_version: field("CFBundleShortVersionString")
			};
		};
	})))();
}

//#endregion
//#region dist/native/NativePlistSource.js
var resolveNativePlistSelection, resolveBundleResourcePlistSelection, macOSBundleRoot, unreadablePlist, nativePlistFailure, nativePlistPrimaryFailure, readPlistFile, requireRegularPlist, readNativePlistBytes, PLIST_MARKUP_PROBE_BYTES, plistSourceFormat, isBinaryPlistDescription;
function init_NativePlistSource() {
	return (init_NativePlistSource = __esmMin((() => {
		init_callerPath();
		init_analysisErrorCore();
		init_configurationErrors();
		init_providerAdapterError();
		init_providerCleanupError();
		init_analysisErrorProjection();
		init_fixedAllowanceRemediation();
		init_result();
		init_RegularFile();
		init_ArtifactReader();
		init_ArtifactFileOperation();
		init_NativeMacOSProviderMetadata();
		init_plist();
		resolveNativePlistSelection = async (target, requested) => {
			try {
				if (requested !== undefined && isAbsolute(requested)) return ok({
					path: absoluteCallerPath(requested),
					origin: "selected"
				});
				if (requested === undefined && target.kind === "artifact" && target.format === "plist") return ok({
					path: target.path,
					origin: "selected"
				});
				const source = target.sourcePath ?? target.path;
				const sourceMetadata = await stat(source);
				const root = sourceMetadata.isDirectory() ? source : macOSBundleRoot(target.path) ?? dirname(target.path);
				if (requested !== undefined) return ok({
					path: absoluteCallerPath(requested, { cwd: root }),
					origin: "selected"
				});
				return ok({
					path: target.bundleInfoPlist ?? resolve(root, "Contents/Info.plist"),
					origin: "default"
				});
			} catch (cause) {
				return err(new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_plist", { cause }));
			}
		};
		resolveBundleResourcePlistSelection = (root, requested) => {
			if (requested === undefined) return ok({
				path: root.infoPlistPath,
				origin: "default"
			});
			return ok({
				path: absoluteCallerPath(requested, { cwd: root.canonicalPath }),
				origin: "selected"
			});
		};
		macOSBundleRoot = (path) => {
			const programs = dirname(path);
			const contents = dirname(programs);
			return basename(programs) === "MacOS" && basename(contents) === "Contents" ? dirname(contents) : undefined;
		};
		unreadablePlist = (selection, reason, options) => {
			const { path } = selection;
			const sentence = reason.endsWith(".") ? reason : `${reason}.`;
			const missingDefault = `The target has no readable default plist at ${path}: ${sentence} Select another plist in the target with the path input (CLI: --relative-path).`;
			return selection.origin === "default" ? new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_plist", missingDefault, {
				...options,
				userMessage: missingDefault
			}) : new AnalysisInputError("inspect_plist", options, [{
				path: ["path"],
				reason: "invalid_value",
				message: `Cannot inspect ${path}: ${sentence}`
			}]);
		};
		nativePlistFailure = (cause, selection) => {
			if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) {
				const physical = cause instanceof ArtifactFileCleanupFailure ? cause.fileCleanupFailure : undefined;
				const previous = physical?.outcome.kind === "failed" ? nativePlistPrimaryFailure(artifactFilePrimaryFacts(cause), selection) : physical?.completionCancellation === undefined ? undefined : new AnalysisCancelledError("inspect_plist", { cause: physical.completionCancellation.reason });
				const previousProjection = previous === undefined ? null : projectAnalysisError(previous);
				const failure = new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, cause.cleanup.resources, {
					reason: cause.cleanup.reason,
					previous_error: previousProjection
				}, {
					operation: "inspect_plist",
					cause,
					cleanupPrimary: previous
				});
				bindArtifactFileCleanup(cause, failure);
				return failure;
			}
			return nativePlistPrimaryFailure(artifactFilePrimaryFacts(cause), selection);
		};
		nativePlistPrimaryFailure = ({ cause, origin }, selection) => {
			if (origin === "owned-or-classified") {
				if (cause instanceof ArtifactReaderFailure && cause.reason === "cancelled") return new AnalysisCancelledError("inspect_plist", { cause: artifactFileCancellationCause(cause) });
				if (cause instanceof ArtifactReaderFailure && cause.reason === "unavailable") return new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_plist", cause.message, { cause });
				if (selection !== undefined && cause instanceof ArtifactReaderFailure && cause.reason === "integrity") return new AnalysisArtifactChangedError("inspect_plist", selection.path, cause.message, { cause });
				if (cause instanceof ArtifactReaderFailure && cause.reason === "limit") {
					const resource = cause.boundary ?? "memory";
					return resource === "file-size" ? new AnalysisResourceConstraintError("inspect_plist", resource, cause.message, { maximum_input_bytes: MAX_NATIVE_PLIST_BYTES }, {
						cause,
						...fixedAllowanceOptions(NATIVE_PLIST_INPUT_ALLOWANCE, "input")
					}) : new AnalysisResourceConstraintError("inspect_plist", resource, cause.message, null, {
						cause,
						retryable: false
					});
				}
			}
			if (selection === undefined) return new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_plist", {
				cause,
				diagnostics: {
					phase: "plist-scope",
					reason: cause instanceof Error ? cause.message : String(cause)
				}
			});
			const { path } = selection;
			const code = cause instanceof Error && "code" in cause ? cause.code : undefined;
			if (code === "ENOENT" || code === "ENOTDIR") return unreadablePlist(selection, "no file exists there", { cause });
			if (code === "EISDIR" || code === "ENOTFILE") return unreadablePlist(selection, "it is not a regular file", { cause });
			if (code === "ELOOP" || code === "ENAMETOOLONG") return unreadablePlist(selection, code === "ELOOP" ? "symbolic-link traversal looped or exceeded the host limit (ELOOP)" : "the path exceeds the host path or component length limit (ENAMETOOLONG)", { cause });
			if (code === "EACCES" || code === "EPERM") return new BinaryTargetError(path, `permission denied while reading plist (${code})`, { cause });
			return new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_plist", {
				cause,
				diagnostics: {
					path,
					phase: "plist-file",
					reason: cause instanceof Error ? cause.message : String(cause)
				}
			});
		};
		readPlistFile = async (input, read) => {
			try {
				return ok(await withArtifactRegularFile(input.selection.path, input.resources, input.signal, ({ handle }) => read(handle), "follow"));
			} catch (cause) {
				return err(nativePlistFailure(cause, input.selection));
			}
		};
		requireRegularPlist = (input) => readPlistFile(input, async () => null);
		readNativePlistBytes = (input) => readPlistFile(input, async (file) => {
			const before = await file.stat({ bigint: true });
			if (before.size > BigInt(67108864)) throw new ArtifactReaderFailure("limit", `Selected plist exceeds ${String(MAX_NATIVE_PLIST_BYTES)} bytes: ${input.selection.path}. This release has no runtime override for this ${String(MAX_NATIVE_PLIST_BYTES)}-byte allowance.`, { boundary: "file-size" });
			const bytes = Buffer.allocUnsafe(Number(before.size));
			let position = 0;
			while (position < bytes.length) {
				assertArtifactReadActive(input.signal);
				const length = Math.min(64 * 1024, bytes.length - position);
				const { bytesRead } = await file.read(bytes, position, length, position);
				if (bytesRead === 0) break;
				position += bytesRead;
			}
			const after = await file.stat({ bigint: true });
			if (after.size > BigInt(67108864)) throw new ArtifactReaderFailure("limit", `Selected plist grew beyond ${String(MAX_NATIVE_PLIST_BYTES)} bytes: ${input.selection.path}. This release has no runtime override for this ${String(MAX_NATIVE_PLIST_BYTES)}-byte allowance.`, { boundary: "file-size" });
			if (!sameRegularFileState(before, after) || BigInt(position) !== before.size) throw new ArtifactReaderFailure("integrity", `Selected plist changed during read: ${input.selection.path}`);
			assertArtifactReadActive(input.signal);
			return bytes;
		});
		PLIST_MARKUP_PROBE_BYTES = 4096;
		plistSourceFormat = async (description, input) => {
			if (isBinaryPlistDescription(description)) return ok("binary");
			if (/\bXML\b/iu.test(description)) return ok("xml");
			if (/\bJSON\b/iu.test(description)) return ok("json");
			if (!/\btext\b/iu.test(description)) return ok("unknown");
			return readPlistFile(input, async (file) => {
				const head = Buffer.alloc(PLIST_MARKUP_PROBE_BYTES);
				const { bytesRead } = await file.read(head, 0, head.length, 0);
				const encoding = head[0] === 255 && head[1] === 254 ? "utf-16le" : head[0] === 254 && head[1] === 255 ? "utf-16be" : "utf-8";
				const text = new TextDecoder(encoding).decode(head.subarray(0, bytesRead)).trimStart();
				return /^<(?:[!?]|(?:plist|dict|array|string|integer|real|data|date|true|false)[\s/>])/u.test(text) ? "xml" : "unknown";
			});
		};
		isBinaryPlistDescription = (description) => /binary property list/iu.test(description);
	})))();
}

//#endregion
//#region dist/native/AppleDispatchCoverage.js
var describeFixups, pushDispatchCoverage, formatIssue;
function init_AppleDispatchCoverage() {
	return (init_AppleDispatchCoverage = __esmMin((() => {
		describeFixups = (fixups) => {
			const descriptions = [];
			if (fixups.unreadRebaseBytes > 0) descriptions.push(`LC_DYLD_INFO rebase opcodes were not decoded (${fixups.unreadRebaseBytes} bytes)`);
			if (fixups.kind === "chained") descriptions.push(`chained fixups: ${fixups.formats.join(", ") || "no fixup segments"}`);
			if (fixups.legacyRebaseStreams > 0) descriptions.push("LC_DYLD_INFO rebase opcodes");
			if (fixups.legacyBindStreams > 0) descriptions.push("LC_DYLD_INFO bind opcodes");
			return descriptions.length === 0 ? "no fixup load commands" : descriptions.join("; ");
		};
		pushDispatchCoverage = (input) => {
			const { result, failures, categoryIssues, examined, categoriesExamined, truncated, objcListScanTruncated, objcClassListScanTruncated, fixups, declarations, vtables, swift } = input;
			const classOwnedMethods = result.objc_dispatch_implementations.filter(({ category }) => category === undefined);
			const classRecords = [
				...result.objc_classes.flatMap((record) => record.decode?.status === "decoded" ? [] : [`class ${record.name}: ${record.decode?.reason ?? record.decode?.status ?? "decode_status_missing"}`]),
				...result.objc_protocol_records.flatMap((record) => record.decode.status === "decoded" ? [] : [`protocol ${record.name}: ${record.decode.reason ?? record.decode.status}`]),
				...classOwnedMethods.flatMap((record) => record.decode.status === "decoded" ? [] : [`method ${record.class_name} ${record.method_type} ${record.selector}: ${record.decode.reason ?? record.decode.status}`]),
				...result.objc_ivars.flatMap((record) => record.decode.status === "decoded" ? [] : [`ivar ${record.class_name}.${record.name}: ${record.decode.reason ?? record.decode.status}`])
			];
			const classReasons = [
				...failures,
				...classRecords,
				...truncated || objcListScanTruncated ? ["max_records_reached"] : []
			];
			const categoryMethods = result.objc_dispatch_implementations.filter(({ category }) => category !== undefined);
			const categoryMethodReasons = categoryMethods.flatMap((record) => record.decode.status === "decoded" ? [] : [`category method ${record.category} ${record.class_name} ${record.method_type} ${record.selector}: ${record.decode.reason ?? record.decode.status}`]);
			result.coverage.push({
				facet: "objc_class_method_ivar_metadata",
				status: classReasons.length > 0 ? "partial" : "complete",
				reason: classReasons.join("; ") || null,
				examined,
				decoded: result.objc_classes.filter(({ decode }) => decode?.status === "decoded").length
			});
			const relativePointerReasons = [...truncated || objcClassListScanTruncated ? ["max_records_reached"] : [], ...result.relative_pointers.some((item) => item.decode.status !== "decoded") ? ["relative_pointer_targets_unresolved"] : []];
			result.coverage.push({
				facet: "binary_relative_pointers",
				status: relativePointerReasons.length > 0 ? "partial" : "complete",
				reason: relativePointerReasons.join("; ") || null,
				examined: result.relative_pointers.length,
				decoded: result.relative_pointers.filter((item) => item.decode.status === "decoded").length
			});
			const categoryFailures = categoryIssues.map(({ code, location, message }) => `${code}${location === undefined ? "" : ` at ${location}`}: ${message}`);
			result.coverage.push({
				facet: "objc_properties_categories",
				status: truncated || objcClassListScanTruncated || categoryFailures.length > 0 || result.objc_categories.some(({ decode }) => decode.status !== "decoded") || categoryMethodReasons.length > 0 ? "partial" : "complete",
				reason: [
					...categoryFailures,
					...categoryMethodReasons,
					...truncated || objcClassListScanTruncated ? ["max_records_reached"] : []
				].join("; ") || null,
				examined: categoriesExamined,
				decoded: result.objc_categories.filter(({ decode }) => decode.status === "decoded").length
			});
			const fixupReason = [describeFixups(fixups), ...fixups.issues.map(({ code, location, message }) => `${code}${location === undefined ? "" : ` at ${location}`}: ${message}`)].filter((line) => line.length > 0).join("; ");
			result.coverage.push({
				facet: "pointer_fixups",
				status: fixups.issues.length > 0 || fixups.unreadRebaseBytes > 0 ? "partial" : fixups.examined === 0 ? "unsupported" : "complete",
				reason: fixupReason.length > 0 ? fixupReason : null,
				examined: fixups.examined,
				decoded: fixups.decoded
			});
			result.coverage.push({
				facet: "swift_generic_resilient_witnesses_overrides_async_coroutines",
				status: "unsupported",
				reason: "This reader admits Swift nominal type declarations, simple conformance/static witness records and non-generic, non-resilient class vtables; generic/resilient tables and other Swift metadata families are not decoded",
				examined: 0,
				decoded: 0
			});
			result.coverage.push({
				facet: "swift_conformances_static_witness_slots",
				status: swift.exhaustive && !truncated && !result.swift_conformances.some(({ decode }) => decode.status !== "decoded") && !result.swift_dispatch_slots.some(({ table_kind, decode }) => table_kind === "witness_table" && decode.status !== "decoded") ? "complete" : "partial",
				reason: [
					...swift.issues.map(formatIssue),
					...truncated ? ["max_records_reached"] : [],
					...result.swift_conformances.some(({ decode }) => decode.status !== "decoded") || result.swift_dispatch_slots.some(({ table_kind, decode }) => table_kind === "witness_table" && decode.status !== "decoded") ? ["swift_records_unresolved"] : []
				].join("; ") || null,
				examined: swift.examined,
				decoded: swift.decoded
			});
			result.coverage.push({
				facet: "swift_declarations",
				status: declarations.exhaustive && !truncated ? "complete" : "partial",
				reason: [...declarations.issues.map(formatIssue), ...truncated ? ["max_records_reached"] : []].join("; ") || null,
				examined: declarations.examined,
				decoded: declarations.decoded
			});
			result.coverage.push({
				facet: "swift_class_vtable_descriptors",
				status: vtables.exhaustive && !truncated && !result.swift_dispatch_slots.some(({ table_kind, decode }) => table_kind === "class_vtable" && decode.status !== "decoded") ? "complete" : "partial",
				reason: [
					...vtables.issues.map(formatIssue),
					...truncated ? ["max_records_reached"] : [],
					...result.swift_dispatch_slots.some(({ table_kind, decode }) => table_kind === "class_vtable" && decode.status !== "decoded") ? ["vtable_implementations_unresolved"] : []
				].join("; ") || null,
				examined: vtables.examined,
				decoded: vtables.decoded
			});
		};
		formatIssue = ({ code, location, message }) => `${code}${location === undefined ? "" : ` at ${location}`}: ${message}`;
	})))();
}

//#endregion
//#region dist/native/AppleObjcProperties.js
var decodePropertyAttributes, splitAttributes, readObjcPropertyList, readObjcPropertiesOf;
function init_AppleObjcProperties() {
	return (init_AppleObjcProperties = __esmMin((() => {
		init_AppleDispatchDecodeFacts();
		decodePropertyAttributes = (name, attributes) => {
			const { tokens, complete } = attributes.length === 0 ? {
				tokens: [],
				complete: true
			} : splitAttributes(attributes);
			const typeAttributes = tokens.filter((token) => token[0] === "T");
			const typeAttribute = typeAttributes.length === 1 ? typeAttributes[0] : undefined;
			const typeEncoding = typeAttribute !== undefined && typeAttribute.length > 1 ? typeAttribute.slice(1) : null;
			const value = (code) => tokens.find((token) => token[0] === code)?.slice(1) ?? null;
			const defaultsEstablished = typeEncoding !== null && complete;
			const property = {
				name,
				type_encoding: typeEncoding,
				attributes: tokens.map((token) => ({
					name: token.slice(0, 1),
					value: token.slice(1)
				})),
				atomicity: tokens.includes("N") ? "nonatomic" : defaultsEstablished ? "atomic" : null,
				is_readonly: tokens.includes("R") ? true : defaultsEstablished ? false : null,
				getter: value("G"),
				setter: value("S")
			};
			return {
				property,
				complete
			};
		};
		splitAttributes = (attributes) => {
			const tokens = [];
			let current = "";
			let quoted = false;
			let templateDepth = 0;
			for (const character of attributes) {
				if (character === "\"") quoted = !quoted;
				const inTypeAttribute = current.startsWith("T");
				if (!quoted && inTypeAttribute && character === "<") templateDepth += 1;
				else if (!quoted && inTypeAttribute && character === ">" && templateDepth > 0) templateDepth -= 1;
				if (character === "," && !quoted && templateDepth === 0) {
					tokens.push(current);
					current = "";
				} else current += character;
			}
			tokens.push(current);
			return {
				tokens: tokens.filter((token) => token.length > 0),
				complete: !quoted && templateDepth === 0
			};
		};
		readObjcPropertyList = (read, list, admit, onTruncated) => {
			const properties = [];
			const issues = [];
			if (list === 0n) return {
				properties,
				issues
			};
			const entrySize = read.u32(list) & ~3;
			const count = read.u32(list + 4n);
			if (entrySize !== 16) throw new TypeError(`Unsupported Objective-C property entry size ${entrySize}`);
			for (let index = 0; index < count; index++) {
				if (!admit()) {
					onTruncated?.();
					break;
				}
				const entry = list + 8n + BigInt(index * entrySize);
				const location = `0x${entry.toString(16)}`;
				try {
					const name = read.string(read.pointer(entry));
					if (name.length === 0) throw new TypeError("the property name is empty");
					const decoded = decodePropertyAttributes(name, read.string(read.pointer(entry + 8n)));
					properties.push(decoded.property);
					if (!decoded.complete) issues.push({
						code: "property_attributes_incomplete",
						message: `property ${name} has an incomplete quoted name or template argument in its type attribute, so atomicity and unestablished read-only state are unknown`,
						location
					});
				} catch (cause) {
					issues.push({
						code: "property_decode_failed",
						message: `property ${String(index)} could not be decoded: ${cause instanceof Error ? cause.message : String(cause)}`,
						location
					});
				}
			}
			return {
				properties,
				issues
			};
		};
		readObjcPropertiesOf = (read, list, context) => {
			try {
				const { properties, issues } = readObjcPropertyList(read, list, context.admit, context.onTruncated);
				for (const item of issues) context.issues.push(issue("objc_properties_categories", item.code, `${context.owner}: ${item.message}`, item.location));
				return properties;
			} catch (cause) {
				context.issues.push(issue("objc_properties_categories", "property_decode_failed", `${context.owner}: ${cause instanceof Error ? cause.message : String(cause)}`, context.location));
				return [];
			}
		};
	})))();
}

//#endregion
//#region dist/native/AppleObjcCategories.js
var CLASS_SYMBOL, boundClassName, decodeObjcCategories;
function init_AppleObjcCategories() {
	return (init_AppleObjcCategories = __esmMin((() => {
		init_AppleObjcProperties();
		init_AppleDispatchDecodeFacts();
		CLASS_SYMBOL = /^_OBJC_(?:META)?CLASS_\$_(.+)$/u;
		boundClassName = (read, field) => {
			const bound = read.bound(field);
			return bound === undefined ? undefined : CLASS_SYMBOL.exec(bound.symbol)?.[1];
		};
		decodeObjcCategories = (input) => {
			const { read, result } = input;
			let examined = 0;
			for (const section of input.sections.filter(({ name }) => name === "__objc_catlist")) {
				if (section.size % 8 !== 0) throw new RangeError("Misaligned Objective-C category list");
				for (let index = 0; index < section.size / 8; index++) {
					if (!input.admit()) break;
					examined++;
					const field = section.address + BigInt(index * 8);
					try {
						const category = read.pointer(field);
						const name = read.string(read.pointer(category));
						if (name.length === 0) throw new TypeError("Objective-C category has an empty name");
						const external = boundClassName(read, category + 8n);
						const local = read.pointer(category + 8n);
						let className = external ?? null;
						if (external === undefined && local !== 0n) try {
							className = input.localClassName(local);
						} catch (cause) {
							input.issues.push(issue("objc_properties_categories", "category_class_unresolved", `Category ${name} class reference 0x${local.toString(16)}: ${cause instanceof Error ? cause.message : String(cause)}`, `0x${(category + 8n).toString(16)}`));
						}
						const owner = className ?? `(${name})`;
						let budgetTruncated = false;
						const onTruncated = () => {
							budgetTruncated = true;
						};
						const instanceMethods = input.methods(read.pointer(category + 16n), owner, "instance", name, onTruncated);
						const classMethods = input.methods(read.pointer(category + 24n), owner, "class", name, onTruncated);
						const protocols = input.protocols(read.pointer(category + 32n), onTruncated);
						const properties = readObjcPropertiesOf(read, read.pointer(category + 40n), {
							owner: `category ${name}`,
							admit: input.admit,
							issues: input.issues,
							location: `0x${read.pointer(category + 40n).toString(16)}`,
							onTruncated
						});
						const decodeReasons = [...className === null ? ["category_class_unresolved"] : [], ...budgetTruncated ? ["max_records_reached"] : []];
						result.objc_categories.push({
							name,
							class_name: className,
							class_source: external !== undefined ? "external" : className === null ? "unresolved" : "local",
							instance_methods: instanceMethods,
							class_methods: classMethods,
							protocols,
							properties,
							location: read.location(category),
							decode: decodeReasons.length === 0 ? {
								status: "decoded",
								reason: null
							} : {
								status: "partial",
								reason: decodeReasons.join("; ")
							},
							evidence: read.evidence(category, "Objective-C category_t record")
						});
					} catch (cause) {
						const message = cause instanceof Error ? cause.message : String(cause);
						input.issues.push(issue("objc_properties_categories", "category_decode_failed", message, `0x${field.toString(16)}`));
					}
				}
			}
			return examined;
		};
	})))();
}

//#endregion
//#region dist/native/AppleObjcProtocols.js
var createObjcProtocolReader;
function init_AppleObjcProtocols() {
	return (init_AppleObjcProtocols = __esmMin((() => {
		init_AppleObjcProperties();
		createObjcProtocolReader = (input) => {
			const { readers: read, result, failures } = input;
			const visited = new Set();
			const name = (address) => read.string(read.pointer(address + 8n));
			const list = (address, onTruncated) => {
				if (address === 0n) return [];
				const count = read.u64(address);
				if (count > 20000n) throw new RangeError("Protocol list exceeds 20000 entries");
				const names = [];
				for (let index = 0n; index < count; index++) {
					if (!read.admit()) {
						onTruncated?.();
						break;
					}
					const protocol = read.pointer(address + 8n + index * 8n);
					names.push(name(protocol));
					record(protocol);
				}
				return names;
			};
			const methods = (address, required, instance, emptySelectors, onTruncated) => {
				const output = [];
				if (address === 0n) return output;
				const flags = read.u32(address), count = read.u32(address + 4n);
				const relative = (flags & 2147483648) !== 0;
				const stride = flags & 65532;
				if (stride !== (relative ? 12 : 24)) throw new TypeError("Unsupported Objective-C protocol method entry size");
				for (let index = 0; index < count; index++) {
					if (!read.admit()) {
						onTruncated?.();
						break;
					}
					const entry = address + 8n + BigInt(index * stride);
					let selector = relative ? entry + BigInt(read.i32(entry)) : read.pointer(entry);
					if (relative && (flags & 1073741824) === 0) selector = read.pointer(selector);
					const selectorName = read.string(selector);
					if (selectorName.length === 0) {
						emptySelectors.push(`${required ? "required" : "optional"} ${instance ? "instance" : "class"} method ${String(index)} at 0x${entry.toString(16)} has an empty selector`);
						continue;
					}
					output.push({
						selector: selectorName,
						method_type: instance ? "instance" : "class",
						address: null,
						is_required: required,
						is_optional: !required
					});
				}
				return output;
			};
			const record = (address) => {
				if (address === 0n || visited.has(address) || !read.admit()) return;
				visited.add(address);
				try {
					const protocolSize = read.u32(address + 64n);
					if (protocolSize < 72) throw new RangeError("Truncated Objective-C protocol declaration");
					const protocolName = name(address);
					let budgetTruncated = false;
					const onTruncated = () => {
						budgetTruncated = true;
					};
					const adopted = list(read.pointer(address + 16n), onTruncated);
					if (protocolName.length === 0) throw new TypeError("Objective-C protocol has an empty name");
					const skipped = [];
					const required = [...methods(read.pointer(address + 24n), true, true, skipped, onTruncated), ...methods(read.pointer(address + 32n), true, false, skipped, onTruncated)];
					const optional = [...methods(read.pointer(address + 40n), false, true, skipped, onTruncated), ...methods(read.pointer(address + 48n), false, false, skipped, onTruncated)];
					for (const message of skipped) failures.push(`Protocol 0x${address.toString(16)}: Objective-C protocol ${protocolName} ${message}`);
					let properties = [];
					const propertyReasons = [];
					try {
						const decoded = readObjcPropertyList(read, read.pointer(address + 56n), () => read.admit(), onTruncated);
						properties = decoded.properties;
						for (const problem of decoded.issues) propertyReasons.push(problem.message);
						if (protocolSize >= 96 && read.pointer(address + 88n) !== 0n) propertyReasons.push("protocol class properties are not decoded");
					} catch (cause) {
						propertyReasons.push(cause instanceof Error ? cause.message : String(cause));
					}
					for (const message of propertyReasons) failures.push(`Protocol 0x${address.toString(16)}: Objective-C protocol ${protocolName} properties: ${message}`);
					const decodeReasons = [
						...propertyReasons,
						...skipped.length === 0 ? [] : ["protocol_method_selector_empty"],
						...budgetTruncated ? ["max_records_reached"] : []
					];
					result.objc_protocols.push({
						name: protocolName,
						methods: required,
						optional_methods: optional,
						properties
					});
					result.objc_protocol_records.push({
						name: protocolName,
						adopted_protocols: adopted,
						methods: required,
						optional_methods: optional,
						location: read.location(address),
						decode: decodeReasons.length === 0 ? {
							status: "decoded",
							reason: null
						} : {
							status: "partial",
							reason: decodeReasons.join("; ")
						},
						evidence: read.evidence(address, "Objective-C protocol declaration and encoded method lists; IMP fields are not handler targets")
					});
				} catch (cause) {
					failures.push(`Protocol 0x${address.toString(16)}: ${cause instanceof Error ? cause.message : String(cause)}`);
				}
			};
			return {
				list,
				record
			};
		};
	})))();
}

//#endregion
//#region dist/native/AppleObjcDispatchFacets.js
var hex$3, decoded$1, readLocalClass, resolveSuperclass, decodeObjcDispatchFacets;
function init_AppleObjcDispatchFacets() {
	return (init_AppleObjcDispatchFacets = __esmMin((() => {
		init_result();
		init_objcSwiftMetadata();
		init_AppleObjcCategories();
		init_AppleObjcProperties();
		init_AppleObjcProtocols();
		hex$3 = (value) => `0x${value.toString(16)}`;
		decoded$1 = {
			status: "decoded",
			reason: null
		};
		readLocalClass = (read, address) => {
			const ro = read.pointer(address + 32n) & ~7n;
			const name = read.string(read.pointer(ro + 24n));
			if (name.length === 0) throw new TypeError(`Objective-C class at ${hex$3(address)} has an empty name`);
			return {
				ro,
				name
			};
		};
		resolveSuperclass = (read, address, className, failures) => {
			const external = boundClassName(read, address + 8n);
			if (external !== undefined) return {
				name: external,
				address: null
			};
			const superclass = read.pointer(address + 8n);
			if (superclass === 0n) return {
				name: null,
				address: null
			};
			try {
				return {
					name: readLocalClass(read, superclass).name,
					address: hex$3(superclass)
				};
			} catch (cause) {
				failures.push(`Superclass pointer ${hex$3(superclass)} of ${className} could not be decoded: ${cause instanceof Error ? cause.message : String(cause)}`);
				return {
					name: null,
					address: hex$3(superclass)
				};
			}
		};
		decodeObjcDispatchFacets = (input) => {
			const { bytes, sections, segments, readers: read, budget, maxListSlots, result } = input;
			const failures = [];
			const categoryIssues = [];
			let classObjectsExamined = 0;
			const methods = (list, className, methodType, category, onTruncated) => {
				const selectors = [];
				if (list === 0n) return selectors;
				const flags = read.u32(list), count = read.u32(list + 4n), relative = (flags & 2147483648) !== 0;
				const stride = flags & 65532;
				if (stride !== (relative ? 12 : 24)) throw new TypeError(`Unsupported method stride/flags at ${hex$3(list)}`);
				for (let index = 0; index < count; index++) {
					if (!budget.admit()) {
						onTruncated?.();
						break;
					}
					const entry = list + 8n + BigInt(index * stride);
					const rel = (field) => {
						const displacement = bytes.readInt32LE(read.offset(field, 4));
						const target = field + BigInt(displacement);
						let fileOffset = null;
						try {
							fileOffset = read.offset(target);
						} catch (cause) {
							void cause;
						}
						if (budget.admit()) result.relative_pointers.push({
							field: read.location(field),
							target: {
								address: hex$3(target),
								file_offset: fileOffset
							},
							displacement,
							indirectable: false,
							indirect: false,
							decode: fileOffset === null ? {
								status: "partial",
								reason: "relative_target_unmapped"
							} : decoded$1,
							evidence: read.evidence(field, "Signed-relative Objective-C method-list pointer")
						});
						return target;
					};
					let selectorAddress = relative ? rel(entry) : read.pointer(entry);
					if (relative && (flags & 1073741824) === 0) selectorAddress = read.pointer(selectorAddress);
					const implementation = relative ? rel(entry + 8n) : read.pointer(entry + 16n);
					let implementationLocation = null;
					try {
						if (!segments.some((segment) => segment.executable && implementation >= segment.address && implementation < segment.address + segment.size)) throw new RangeError("Method implementation is not in an executable segment");
						implementationLocation = read.location(implementation);
					} catch (cause) {
						void cause;
					}
					const selector = read.string(selectorAddress);
					if (selector.length === 0) throw new TypeError("Objective-C method has an empty selector");
					selectors.push(selector);
					result.objc_dispatch_implementations.push({
						class_name: className,
						selector,
						method_type: methodType,
						...category === undefined ? {} : { category },
						implementation_address: implementationLocation?.address ?? null,
						location: read.location(entry),
						decode: implementationLocation === null ? {
							status: "partial",
							reason: "implementation_pointer_unmapped_or_encoded"
						} : decoded$1,
						evidence: read.evidence(entry, relative ? "Encoded relative Objective-C method entry" : "Encoded absolute Objective-C method entry")
					});
				}
				return selectors;
			};
			const protocolReader = createObjcProtocolReader({
				readers: {
					u32: read.u32,
					pointer: read.pointer,
					string: read.string,
					location: read.location,
					evidence: read.evidence,
					admit: () => budget.admit(),
					i32: read.i32,
					u64: read.u64
				},
				result,
				failures
			});
			let objcListScanTruncated = false;
			let objcClassListScanTruncated = false;
			const createListSlotReader = () => {
				let listSlotsExamined = 0;
				return (field) => {
					if (listSlotsExamined >= maxListSlots) {
						objcListScanTruncated = true;
						return err("exhausted");
					}
					listSlotsExamined++;
					try {
						return ok(read.pointer(field));
					} catch (cause) {
						const admitted = budget.admit();
						failures.push(`${hex$3(field)}: ${cause instanceof Error ? cause.message : String(cause)}`);
						return err(admitted ? "unmapped" : "exhausted");
					}
				};
			};
			const readProtocolListSlot = createListSlotReader();
			const readClassListSlot = createListSlotReader();
			for (const section of sections.filter(({ name }) => name === "__objc_protolist")) {
				if (section.size % 8 !== 0) throw new RangeError("Misaligned Objective-C protocol list");
				for (let index = 0; index < section.size / 8; index++) {
					if (budget.isFull()) {
						budget.markTruncated();
						break;
					}
					const field = section.address + BigInt(index * 8);
					const pointer = readProtocolListSlot(field);
					if (!pointer.ok) {
						if (pointer.error === "exhausted") break;
						continue;
					}
					try {
						protocolReader.record(pointer.value);
					} catch (cause) {
						failures.push(`${hex$3(field)}: ${cause instanceof Error ? cause.message : String(cause)}`);
					}
				}
			}
			const visited = new Set();
			const readClass = (address, meta = false) => {
				if (address === 0n || visited.has(hex$3(address)) || !budget.admit()) return;
				classObjectsExamined++;
				visited.add(hex$3(address));
				const { ro, name } = readLocalClass(read, address);
				const root = (read.u32(ro) & 2) !== 0;
				const superclass = resolveSuperclass(read, address, name, failures);
				if (superclass.name === null && superclass.address === null && !root) failures.push(`Superclass of ${name} requires external binding resolution`);
				const ivarList = read.pointer(ro + 48n);
				let ivarCount = meta ? null : 0;
				let classListTruncated = false;
				const onTruncated = () => {
					classListTruncated = true;
				};
				if (ivarList !== 0n && !meta) {
					const stride = read.u32(ivarList), count = read.u32(ivarList + 4n);
					if (stride !== 32) throw new TypeError("Unsupported Objective-C ivar entry size");
					ivarCount = count;
					for (let index = 0; index < count; index++) {
						if (!budget.admit()) {
							classListTruncated = true;
							break;
						}
						const entry = ivarList + 8n + BigInt(index * stride);
						const encodedOffset = read.pointer(entry);
						let value = null;
						try {
							value = read.u32(encodedOffset);
						} catch (cause) {
							void cause;
							failures.push(`Unresolved ivar offset pointer ${hex$3(encodedOffset)}`);
						}
						const ivarName = read.string(read.pointer(entry + 8n));
						if (ivarName.length === 0) throw new TypeError("Objective-C ivar has an empty name");
						const alignment = read.u32(entry + 24n);
						result.objc_ivars.push({
							class_name: name,
							name: ivarName,
							type_encoding: read.string(read.pointer(entry + 16n)),
							offset: value,
							size: read.u32(entry + 28n),
							alignment: alignment === 4294967295 ? 8 : alignment < 31 ? 2 ** alignment : null,
							location: read.location(entry),
							decode: value === null ? {
								status: "partial",
								reason: "ivar_offset_pointer_unresolved"
							} : decoded$1,
							evidence: read.evidence(entry, "Objective-C ivar entry and encoded offset storage")
						});
					}
				}
				methods(read.pointer(ro + 32n), name, meta ? "class" : "instance", undefined, onTruncated);
				const properties = readObjcPropertiesOf(read, read.pointer(ro + 64n), {
					owner: name,
					admit: () => budget.admit(),
					issues: categoryIssues,
					location: hex$3(read.pointer(ro + 64n)),
					onTruncated
				});
				const protocols = protocolReader.list(read.pointer(ro + 40n), onTruncated);
				const classDecodeReasons = [...superclass.name === null && !root ? ["superclass_binding_unresolved"] : [], ...classListTruncated ? ["max_records_reached"] : []];
				result.objc_classes.push({
					name,
					super_class: superclass.name,
					is_meta_class: meta,
					is_root_class: root,
					methods: projectObjcClassMethods(result.objc_dispatch_implementations.filter((item) => item.class_name === name && item.method_type === (meta ? "class" : "instance"))),
					properties,
					protocols,
					ivar_count: ivarCount,
					instance_size: read.u32(ro + 8n),
					location: read.location(address),
					superclass_address: superclass.address,
					metaclass_address: meta ? null : hex$3(read.pointer(address)),
					decode: classDecodeReasons.length === 0 ? decoded$1 : {
						status: "partial",
						reason: classDecodeReasons.join("; ")
					},
					evidence: read.evidence(address, "Objective-C class and class_ro_t records")
				});
				if (!meta) {
					try {
						readClass(read.pointer(address), true);
					} catch (cause) {
						failures.push(`Metaclass of ${name}: ${cause instanceof Error ? cause.message : String(cause)}`);
					}
				}
			};
			for (const section of sections.filter(({ name }) => name === "__objc_classlist")) {
				if (section.size % 8 !== 0) throw new RangeError("Misaligned Objective-C class-list size");
				for (let index = 0; index < section.size / 8; index++) {
					if (budget.isFull()) {
						budget.markTruncated();
						break;
					}
					const field = section.address + BigInt(index * 8);
					const pointer = readClassListSlot(field);
					if (!pointer.ok) {
						if (pointer.error === "exhausted") {
							objcClassListScanTruncated = true;
							break;
						}
						continue;
					}
					try {
						readClass(pointer.value);
					} catch (cause) {
						failures.push(`${hex$3(field)}: ${cause instanceof Error ? cause.message : String(cause)}`);
					}
				}
			}
			const categoriesExamined = decodeObjcCategories({
				sections,
				read,
				result,
				issues: categoryIssues,
				admit: () => budget.admit(),
				methods,
				protocols: (list, onTruncated) => protocolReader.list(list, onTruncated),
				localClassName: (address) => readLocalClass(read, address).name
			});
			return {
				failures,
				categoryIssues,
				examined: classObjectsExamined,
				categoriesExamined,
				objcListScanTruncated,
				objcClassListScanTruncated
			};
		};
	})))();
}

//#endregion
//#region dist/native/AppleSwiftMetadataReadFailure.js
var expectedSwiftMetadataReadFailure;
function init_AppleSwiftMetadataReadFailure() {
	return (init_AppleSwiftMetadataReadFailure = __esmMin((() => {
		expectedSwiftMetadataReadFailure = (cause) => {
			if (cause instanceof RangeError) return cause.message;
			if (cause instanceof TypeError && "code" in cause && cause.code === "ERR_ENCODING_INVALID_ENCODED_DATA") return cause.message;
			return null;
		};
	})))();
}

//#endregion
//#region dist/native/AppleSwiftNominalTypes.js
var FACET, CLASS, STRUCT, ENUM, MODULE, EXTENSION, ANONYMOUS, PROTOCOL, GENERIC, CLASS_IS_ACTOR, MAXIMUM_CONTEXT_DEPTH, MAXIMUM_QUALIFIED_NAME_LENGTH, hex$2, unresolved, tooDeep, createSwiftContextReader, decodeSwiftNominalTypes;
function init_AppleSwiftNominalTypes() {
	return (init_AppleSwiftNominalTypes = __esmMin((() => {
		init_AppleDispatchDecodeFacts();
		init_AppleSwiftDispatchFacets();
		init_AppleSwiftMetadataReadFailure();
		FACET = "swift_declarations";
		CLASS = 16;
		STRUCT = 17;
		ENUM = 18;
		MODULE = 0;
		EXTENSION = 1;
		ANONYMOUS = 2;
		PROTOCOL = 3;
		GENERIC = 128;
		CLASS_IS_ACTOR = 128;
		MAXIMUM_CONTEXT_DEPTH = 32;
		MAXIMUM_QUALIFIED_NAME_LENGTH = 4096;
		hex$2 = (value) => `0x${value.toString(16)}`;
		unresolved = (reason, walkLimited = false) => ({
			module: null,
			path: null,
			depth: 0,
			anonymous: false,
			reason,
			walkLimited
		});
		tooDeep = () => unresolved(`Swift context parent chain exceeds ${MAXIMUM_CONTEXT_DEPTH} contexts or is cyclic`);
		createSwiftContextReader = (read) => {
			const contexts = new Map();
			const names = new Map();
			const namedContext = (descriptor, field) => {
				const known = names.get(descriptor);
				if (known !== undefined) return known;
				const value = read.relative(descriptor + 8n, field);
				if (value.kind !== "target") throw new RangeError(unresolvedSwiftRelativeReason(value, field));
				const name = read.string(value.target);
				if (name.length === 0) throw new RangeError(`Swift ${field === "protocolName" ? "protocol" : "type"} descriptor name is empty`);
				names.set(descriptor, name);
				return name;
			};
			const parentOf = (context, walk) => {
				const value = read.relative(context + 4n, "contextParent");
				if (value.kind === "target") return contextOf(value.target, walk + 1);
				return unresolved(value.kind === "null" ? "Swift context descriptor has no parent module" : unresolvedSwiftRelativeReason(value, "contextParent"));
			};
			/** One level below `parent`, bounded in depth and qualified-name length. */
			const child = (parent, facts) => {
				if (parent.depth + 1 > MAXIMUM_CONTEXT_DEPTH) return {
					...tooDeep(),
					walkLimited: parent.walkLimited
				};
				const next = {
					...parent,
					depth: parent.reason === null ? parent.depth + 1 : 0,
					...facts
				};
				return next.path !== null && next.path.length > MAXIMUM_QUALIFIED_NAME_LENGTH ? {
					...next,
					path: null,
					reason: next.reason ?? `Swift qualified type name exceeds ${MAXIMUM_QUALIFIED_NAME_LENGTH} characters`
				} : next;
			};
			const readContext = (context, walk) => {
				const kind = read.u32(context) & 31;
				switch (kind) {
					case MODULE: {
						const value = read.relative(context + 8n, "moduleName");
						if (value.kind !== "target") return unresolved(unresolvedSwiftRelativeReason(value, "moduleName"));
						const module = read.string(value.target);
						return module.length === 0 ? unresolved("Swift module context name is empty") : {
							module,
							path: "",
							depth: 1,
							anonymous: false,
							reason: null,
							walkLimited: false
						};
					}
					case PROTOCOL:
					case CLASS:
					case STRUCT:
					case ENUM: {
						const name = namedContext(context, kind === PROTOCOL ? "protocolName" : "typeName");
						const parent = parentOf(context, walk);
						return child(parent, { path: parent.path === null ? null : parent.path === "" ? name : `${parent.path}.${name}` });
					}
					case ANONYMOUS: return child(parentOf(context, walk), { anonymous: true });
					case EXTENSION: {
						const parent = parentOf(context, walk);
						return child(parent, {
							path: null,
							reason: parent.reason ?? "Swift type is declared in an extension whose extended type is not demangled"
						});
					}
					default: return unresolved(`Unsupported Swift context descriptor kind ${kind}`);
				}
			};
			const contextOf = (context, walk) => {
				const known = contexts.get(context);
				if (known !== undefined) return known;
				if (walk > MAXIMUM_CONTEXT_DEPTH) return {
					...tooDeep(),
					walkLimited: true
				};
				let facts;
				try {
					facts = readContext(context, walk);
				} catch (cause) {
					const reason = expectedSwiftMetadataReadFailure(cause);
					if (reason === null) throw cause;
					facts = unresolved(reason);
				}
				if (!facts.walkLimited) contexts.set(context, facts);
				return facts;
			};
			return {
				typeName: (descriptor) => namedContext(descriptor, "typeName"),
				protocolName: (descriptor) => namedContext(descriptor, "protocolName"),
				contextOf: (descriptor) => contextOf(descriptor, 0)
			};
		};
		decodeSwiftNominalTypes = (input) => {
			const { readers: read, result, visitor } = input;
			const issues = [];
			const { typeName, contextOf } = input.contextReader;
			let examined = 0;
			let decoded = 0;
			const accessorOf = (descriptor) => {
				try {
					const value = read.relative(descriptor + 12n, "typeAccessFunction");
					if (value.kind === "null") return {
						address: null,
						reason: null
					};
					if (value.kind !== "target") return {
						address: null,
						reason: unresolvedSwiftRelativeReason(value, "typeAccessFunction")
					};
					return read.executable(value.target) ? {
						address: hex$2(value.target),
						reason: null
					} : {
						address: null,
						reason: `Swift metadata accessor ${hex$2(value.target)} is not in executable mapped code`
					};
				} catch (cause) {
					const reason = expectedSwiftMetadataReadFailure(cause);
					if (reason === null) throw cause;
					return {
						address: null,
						reason
					};
				}
			};
			for (const record of input.entries) {
				if (!read.admit()) {
					issues.push(issue(FACET, "record_budget_exhausted", "max_records_reached", hex$2(record)));
					break;
				}
				examined++;
				let descriptor;
				let kind = null;
				let flags;
				let name;
				try {
					const value = read.relative(record, "typeMetadataRecord");
					if (value.kind !== "target") throw new RangeError(unresolvedSwiftRelativeReason(value, "typeMetadataRecord"));
					descriptor = value.target;
					flags = read.u32(descriptor);
					kind = flags & 31;
					if (kind !== CLASS && kind !== STRUCT && kind !== ENUM) {
						issues.push(issue(FACET, "unsupported_type_descriptor_kind", `Unsupported Swift type descriptor kind ${kind}`, hex$2(record)));
						continue;
					}
					name = typeName(descriptor);
				} catch (cause) {
					const message = expectedSwiftMetadataReadFailure(cause);
					if (message === null) throw cause;
					if (kind === null || kind === CLASS) visitor.failure({
						record,
						message
					});
					issues.push(issue(FACET, "type_decode_failed", message, hex$2(record)));
					continue;
				}
				const context = contextOf(descriptor);
				visitor.descriptor({
					record,
					descriptor,
					flags,
					name,
					context
				});
				const accessor = accessorOf(descriptor);
				const reason = context.reason ?? accessor.reason;
				result.swift_decls.push({
					kind: kind === STRUCT ? "struct" : kind === ENUM ? "enum" : (flags >>> 16 & CLASS_IS_ACTOR) !== 0 ? "actor" : "class",
					name,
					qualified_name: context.path === null || context.path === "" ? null : context.path,
					module: context.module,
					generic: (flags & GENERIC) !== 0,
					anonymous_context: context.anonymous,
					accessor_address: accessor.address,
					location: read.location(descriptor),
					decode: reason === null ? {
						status: "decoded",
						reason: null
					} : {
						status: "partial",
						reason
					},
					evidence: read.evidence(record, "Swift __swift5_types record of the nominal type descriptor at location")
				});
				if (reason === null) decoded++;
				else issues.push(issue(FACET, "type_context_unresolved", reason, hex$2(descriptor)));
			}
			return {
				facet: FACET,
				examined,
				decoded,
				exhaustive: issues.length === 0,
				issues
			};
		};
	})))();
}

//#endregion
//#region dist/native/AppleSwiftConformanceTypeReference.js
var hex$1, swiftImportBinding, typeReferenceResult, requiredSwiftRelativeTarget, decodeNominalTypeReference, decodeDirectObjcClassName, decodeIndirectObjcClass, decodeSwiftConformanceTypeReference;
function init_AppleSwiftConformanceTypeReference() {
	return (init_AppleSwiftConformanceTypeReference = __esmMin((() => {
		init_AppleSwiftNominalTypes();
		init_AppleSwiftMetadataReadFailure();
		hex$1 = (value) => `0x${value.toString(16)}`;
		swiftImportBinding = (requestedAddress, binding) => ({
			requested_address: hex$1(requestedAddress),
			symbol: binding.symbol,
			binding_source: binding.binding_source,
			library_ordinal: binding.library_ordinal,
			library: binding.library,
			weak: binding.weak,
			addend: binding.addend.toString()
		});
		typeReferenceResult = (input) => ({
			kind: input.kind,
			target: input.target,
			name: input.name ?? null,
			module: input.module ?? null,
			binding: input.binding ?? null,
			reason: input.reason ?? null,
			staticWitnessIdentity: input.name !== null && input.name !== undefined && input.kind <= 2,
			generic: input.generic ?? null
		});
		requiredSwiftRelativeTarget = (relative, field, kind, unresolvedReason) => {
			const value = relative(field, kind);
			if (value.kind !== "target") throw new RangeError(unresolvedReason(value, kind));
			return value.target;
		};
		decodeNominalTypeReference = (kind, input, value) => {
			const { read, relative } = input;
			let target = value.kind === "target" ? value.target : null;
			let binding = value.kind === "binding" ? swiftImportBinding(value.requestedAddress, value.binding) : null;
			let reason = value.kind === "unknown" ? value.reason : value.kind === "null" ? "Null Swift conformance type reference" : null;
			try {
				if (kind === 1 && target !== null) {
					const pointer = read.resolvePointer(target);
					if (pointer.kind === "bind") {
						binding = swiftImportBinding(target, pointer);
						target = null;
					} else if (pointer.kind === "raw" && pointer.target === 0n) {
						target = null;
						reason = "Null indirect Swift conformance type reference";
					} else if (pointer.kind === "raw" || pointer.kind === "rebase") {
						target = pointer.target;
					} else {
						target = null;
						reason = pointer.reason;
					}
				}
				if (target === null) return typeReferenceResult({
					kind,
					target,
					binding,
					reason
				});
				const descriptorFlags = read.u32(target);
				if (![
					16,
					17,
					18
				].includes(descriptorFlags & 31)) return typeReferenceResult({
					kind,
					target,
					binding,
					reason: "Unsupported Swift type descriptor kind"
				});
				const contextReader = input.contextReader ?? createSwiftContextReader({
					...read,
					relative
				});
				const name = contextReader.typeName(target);
				const context = contextReader.contextOf(target);
				return typeReferenceResult({
					kind,
					target,
					name: context.path ?? name,
					module: context.module,
					binding,
					reason: context.reason,
					generic: (descriptorFlags & 128) !== 0
				});
			} catch (cause) {
				const reason = expectedSwiftMetadataReadFailure(cause);
				if (reason === null) throw cause;
				return typeReferenceResult({
					kind,
					target,
					binding,
					reason
				});
			}
		};
		decodeDirectObjcClassName = (kind, read, value) => {
			if (value.kind !== "target") return typeReferenceResult({
				kind,
				target: null,
				reason: value.kind === "unknown" ? value.reason : "Null Swift conformance type reference"
			});
			try {
				const name = read.string(value.target);
				return typeReferenceResult({
					kind,
					target: value.target,
					name: name.length === 0 ? null : name,
					reason: name.length === 0 ? "Empty inline Objective-C class name" : null
				});
			} catch (cause) {
				const reason = expectedSwiftMetadataReadFailure(cause);
				if (reason === null) throw cause;
				return typeReferenceResult({
					kind,
					target: value.target,
					reason
				});
			}
		};
		decodeIndirectObjcClass = (kind, read, value) => {
			if (value.kind !== "target") return typeReferenceResult({
				kind,
				target: null,
				reason: value.kind === "unknown" ? value.reason : "Null Swift conformance type reference"
			});
			let pointer;
			try {
				pointer = read.resolvePointer(value.target);
			} catch (cause) {
				const reason = expectedSwiftMetadataReadFailure(cause);
				if (reason === null) throw cause;
				return typeReferenceResult({
					kind,
					target: value.target,
					reason
				});
			}
			if (pointer.kind === "bind") return typeReferenceResult({
				kind,
				target: null,
				binding: swiftImportBinding(value.target, pointer),
				reason: "Indirect Objective-C class metadata requires runtime lookup"
			});
			if (pointer.kind === "raw" || pointer.kind === "rebase") return typeReferenceResult({
				kind,
				target: pointer.kind === "raw" && pointer.target === 0n ? null : pointer.target,
				reason: "Indirect Objective-C class metadata requires runtime lookup"
			});
			return typeReferenceResult({
				kind,
				target: null,
				reason: pointer.reason
			});
		};
		decodeSwiftConformanceTypeReference = (input) => {
			const kind = input.flags >>> 3 & 7;
			try {
				const value = input.relative(input.descriptor + 4n, "conformanceType");
				switch (kind) {
					case 0:
					case 1: return decodeNominalTypeReference(kind, input, value);
					case 2: return decodeDirectObjcClassName(kind, input.read, value);
					case 3: return decodeIndirectObjcClass(kind, input.read, value);
					default: return typeReferenceResult({
						kind,
						target: value.kind === "target" ? value.target : null,
						reason: value.kind === "unknown" ? value.reason : `Unsupported Swift conformance type-reference kind ${kind}`
					});
				}
			} catch (cause) {
				const reason = expectedSwiftMetadataReadFailure(cause);
				if (reason === null) throw cause;
				return typeReferenceResult({
					kind,
					target: null,
					reason
				});
			}
		};
	})))();
}

//#endregion
//#region dist/native/AppleSwiftDispatchFacets.js
var relativeFieldContracts, unresolvedSwiftRelativeReason, readSwiftProtocolFacts, readWitnessConformanceHeader, hex, decoded, createSwiftRelativeReader, decodeSwiftDispatchFacets;
function init_AppleSwiftDispatchFacets() {
	return (init_AppleSwiftDispatchFacets = __esmMin((() => {
		init_AppleSwiftNominalTypes();
		init_AppleDispatchDecodeFacts();
		init_AppleSwiftConformanceTypeReference();
		init_AppleSwiftMetadataReadFailure();
		relativeFieldContracts = {
			conformanceRecord: {
				encoding: "direct",
				nullability: "nonnull"
			},
			conformanceProtocol: {
				encoding: "indirectable",
				nullability: "nullable"
			},
			protocolName: {
				encoding: "direct",
				nullability: "nonnull"
			},
			conformanceType: {
				encoding: "direct",
				nullability: "nullable"
			},
			typeName: {
				encoding: "direct",
				nullability: "nonnull"
			},
			witnessTablePattern: {
				encoding: "direct",
				nullability: "nullable"
			},
			typeMetadataRecord: {
				encoding: "taggedDirect",
				nullability: "nonnull"
			},
			contextParent: {
				encoding: "indirectable",
				nullability: "nullable"
			},
			moduleName: {
				encoding: "direct",
				nullability: "nonnull"
			},
			typeAccessFunction: {
				encoding: "direct",
				nullability: "nullable"
			},
			methodImplementation: {
				encoding: "compactFunction",
				nullability: "nullable"
			}
		};
		unresolvedSwiftRelativeReason = (value, field) => {
			if (value.kind === "null") return `Null Swift relative pointer for ${field}`;
			if (value.kind === "unknown") return value.reason;
			return `Swift relative pointer for ${field} has an unresolved external binding at ${hex(value.requestedAddress)}`;
		};
		readSwiftProtocolFacts = (input) => {
			const { target, read } = input;
			if (target === null) return {
				name: null,
				readable: false,
				reason: "Protocol descriptor target is unresolved"
			};
			let descriptorKind;
			try {
				descriptorKind = read.u32(target) & 31;
			} catch (cause) {
				const reason = expectedSwiftMetadataReadFailure(cause);
				if (reason === null) throw cause;
				return {
					name: null,
					readable: false,
					reason
				};
			}
			if (descriptorKind !== 3) return {
				name: null,
				readable: false,
				reason: "Unsupported Swift protocol descriptor kind"
			};
			try {
				const name = input.contextReader.protocolName(target);
				const context = input.contextReader.contextOf(target);
				return {
					name: context.path ?? name,
					readable: true,
					reason: context.reason
				};
			} catch (cause) {
				const reason = expectedSwiftMetadataReadFailure(cause);
				if (reason === null) throw cause;
				return {
					name: null,
					readable: false,
					reason
				};
			}
		};
		readWitnessConformanceHeader = (read, witness, descriptor) => {
			try {
				const header = read.resolvePointer(witness);
				if (header.kind !== "raw" && header.kind !== "rebase") return header.kind === "unknown" || header.kind === "unsupported" ? header.reason : "Witness-table conformance header is an external binding";
				return header.target === descriptor ? null : "Witness-table conformance header is unresolved or encoded";
			} catch (cause) {
				const reason = expectedSwiftMetadataReadFailure(cause);
				if (reason === null) throw cause;
				return reason;
			}
		};
		hex = (value) => `0x${value.toString(16)}`;
		decoded = {
			status: "decoded",
			reason: null
		};
		createSwiftRelativeReader = (input) => {
			const { bytes, readers: read, budget, result } = input;
			return (field, kind) => {
				const contract = relativeFieldContracts[kind];
				const indirectable = contract.encoding === "indirectable";
				const taggedDirect = contract.encoding === "taggedDirect";
				const nullable = contract.nullability === "nullable";
				const displacement = bytes.readInt32LE(read.offset(field, 4));
				const encodingTag = taggedDirect ? displacement & 3 : undefined;
				if (encodingTag !== undefined && encodingTag !== 0) {
					const reason = `Unsupported Swift type metadata record tag ${encodingTag}`;
					if (budget.admit()) result.relative_pointers.push({
						field: read.location(field),
						target: {
							address: null,
							file_offset: null
						},
						displacement,
						indirectable,
						indirect: false,
						encoding_tag: encodingTag,
						decode: {
							status: "unsupported",
							reason
						},
						evidence: read.evidence(field, "Swift ABI tagged type metadata record")
					});
					return {
						kind: "unknown",
						reason
					};
				}
				const indirect = indirectable && (displacement & 1) !== 0;
				let target = nullable && displacement === 0 ? null : field + BigInt(taggedDirect ? displacement & ~3 : indirectable ? displacement & ~1 : displacement);
				let fileOffset = null;
				let reason = null;
				try {
					if (indirect && target !== null) {
						const pointer = read.resolvePointer(target);
						if (pointer.kind === "bind") {
							if (budget.admit()) result.relative_pointers.push({
								field: read.location(field),
								target: {
									address: null,
									file_offset: null
								},
								displacement,
								indirectable,
								indirect,
								binding: swiftImportBinding(target, pointer),
								decode: {
									status: "partial",
									reason: "External pointer binding"
								},
								evidence: read.evidence(field, "Swift ABI indirect relative pointer and Mach-O import binding")
							});
							return {
								kind: "binding",
								binding: pointer,
								requestedAddress: target
							};
						}
						if (pointer.kind === "unknown" || pointer.kind === "unsupported") {
							const unresolved = pointer.reason;
							if (budget.admit()) result.relative_pointers.push({
								field: read.location(field),
								target: {
									address: null,
									file_offset: null
								},
								displacement,
								indirectable,
								indirect,
								decode: {
									status: "partial",
									reason: unresolved
								},
								evidence: read.evidence(field, "Swift ABI indirect relative pointer")
							});
							return {
								kind: "unknown",
								reason: unresolved
							};
						}
						const indirectTarget = pointer.target;
						target = pointer.kind === "raw" && indirectTarget === 0n ? null : indirectTarget;
					}
					if (target !== null) fileOffset = read.offset(target);
				} catch (cause) {
					reason = cause instanceof Error ? cause.message : String(cause);
				}
				if (budget.admit()) result.relative_pointers.push({
					field: read.location(field),
					target: {
						address: target === null ? null : hex(target),
						file_offset: fileOffset
					},
					displacement,
					indirectable,
					indirect,
					...encodingTag === undefined ? {} : { encoding_tag: encodingTag },
					decode: reason === null ? decoded : {
						status: "partial",
						reason
					},
					evidence: read.evidence(field, "Swift ABI signed-relative metadata pointer")
				});
				return target === null ? { kind: "null" } : {
					kind: "target",
					target
				};
			};
		};
		decodeSwiftDispatchFacets = (input) => {
			const { sections, segments, readers: read, relative, budget, result } = input;
			const contextReader = input.contextReader ?? createSwiftContextReader({
				...read,
				relative
			});
			const issues = [];
			let swiftExamined = 0;
			let decodedRecords = 0;
			for (const section of sections.filter(({ name }) => name === "__swift5_proto")) {
				if (section.size % 4 !== 0) throw new RangeError("Misaligned Swift conformance section");
				for (let index = 0; index < section.size / 4; index++) {
					if (!budget.admit()) break;
					swiftExamined++;
					const field = section.address + BigInt(index * 4);
					try {
						const descriptor = requiredSwiftRelativeTarget(relative, field, "conformanceRecord", unresolvedSwiftRelativeReason);
						const flags = read.u32(descriptor + 12n);
						const protocolValue = relative(descriptor, "conformanceProtocol");
						const protocol = protocolValue.kind === "target" ? protocolValue.target : null;
						const unresolvedProtocolReason = protocolValue.kind === "unknown" || protocolValue.kind === "binding" ? unresolvedSwiftRelativeReason(protocolValue, "conformanceProtocol") : null;
						const protocolFacts = readSwiftProtocolFacts({
							target: protocol,
							contextReader,
							read
						});
						const protocolName = protocolFacts.name;
						const protocolBinding = protocolValue.kind === "binding" ? swiftImportBinding(protocolValue.requestedAddress, protocolValue.binding) : null;
						const typeReference = decodeSwiftConformanceTypeReference({
							descriptor,
							flags,
							read,
							contextReader,
							relative,
							unresolvedReason: unresolvedSwiftRelativeReason
						});
						const witnessValue = relative(descriptor + 8n, "witnessTablePattern");
						const witness = witnessValue.kind === "target" ? witnessValue.target : null;
						const unresolvedWitnessReason = witnessValue.kind === "unknown" || witnessValue.kind === "binding" ? unresolvedSwiftRelativeReason(witnessValue, "witnessTablePattern") : null;
						let staticWitness = witness !== null && protocol !== null && protocolFacts.readable && typeReference.staticWitnessIdentity && (flags & ~56) === 0;
						staticWitness &&= typeReference.kind === 2 || typeReference.generic === false;
						let witnessReason = staticWitness ? null : unresolvedProtocolReason ?? protocolFacts.reason ?? typeReference.reason ?? unresolvedWitnessReason ?? (protocolBinding !== null || typeReference.binding !== null ? "Conformance references an external Mach-O binding" : "Conditional, generic, resilient or missing static witness table is not decoded");
						if (staticWitness && witness !== null) {
							witnessReason = readWitnessConformanceHeader(read, witness, descriptor);
						}
						const conformanceReason = witnessReason ?? typeReference.reason ?? protocolFacts.reason;
						const conformanceDecode = conformanceReason === null ? {
							status: "decoded",
							reason: null
						} : {
							status: "partial",
							reason: conformanceReason
						};
						if (witnessReason === null && conformanceReason !== null) issues.push(issue("swift_conformances_static_witness_slots", "conformance_identity_partial", conformanceReason, hex(descriptor)));
						result.swift_conformances.push({
							type_name: typeReference.name,
							type_reference_kind: typeReference.kind,
							type_reference_target: typeReference.target === null ? {
								address: null,
								file_offset: null
							} : read.targetLocation(typeReference.target),
							type_binding: typeReference.binding,
							protocol_name: protocolName,
							...protocol === null ? {} : { protocol_target: read.targetLocation(protocol) },
							protocol_binding: protocolBinding,
							module: typeReference.module,
							witness_table: witness === null ? {
								address: null,
								file_offset: null
							} : read.targetLocation(witness),
							location: read.location(descriptor),
							decode: conformanceDecode,
							evidence: read.evidence(descriptor, "Swift protocol conformance descriptor, type reference and protocol name")
						});
						if (conformanceDecode.status === "decoded") decodedRecords++;
						if (witnessReason !== null || witness === null || typeReference.name === null || protocolName === null || !protocolFacts.readable) {
							const reason = witnessReason ?? typeReference.reason ?? "Missing static witness table is not decoded";
							issues.push(issue("swift_conformances_static_witness_slots", "conformance_decode_partial", reason, hex(descriptor)));
							continue;
						}
						const count = read.u32(protocol + 16n);
						const signatureCount = read.u32(protocol + 12n);
						if (count > 2e4 || signatureCount > 2e4) throw new RangeError("Swift witness requirement count exceeds 20000");
						for (let slot = 0; slot < count; slot++) {
							if (!budget.admit()) break;
							const entry = witness + BigInt((slot + 1) * 8);
							try {
								const implementationResolution = read.resolvePointer(entry);
								const implementation = implementationResolution.kind === "raw" || implementationResolution.kind === "rebase" ? implementationResolution.target : null;
								const requirementFlags = read.u32(protocol + 24n + BigInt(signatureCount * 12 + slot * 8));
								const kind = requirementFlags & 15;
								const synchronousFunction = kind >= 1 && kind <= 4 && (requirementFlags & 32) === 0;
								const executable = implementation !== null && synchronousFunction && segments.some((segment) => segment.executable && implementation >= segment.address && implementation < segment.address + segment.size);
								const slotDecode = executable ? {
									status: "decoded",
									reason: null
								} : {
									status: "partial",
									reason: implementationResolution.kind === "bind" ? "Witness implementation is an external Mach-O binding" : implementationResolution.kind === "unknown" || implementationResolution.kind === "unsupported" ? implementationResolution.reason : "Witness slot is non-function, async, nil, external, authenticated or encoded; implementation target is unresolved"
								};
								result.swift_dispatch_slots.push({
									owner: `${typeReference.name}: ${protocolName}`,
									table_kind: "witness_table",
									slot_index: slot + 1,
									requirement: null,
									implementation: null,
									implementation_address: executable ? hex(implementation) : null,
									...implementationResolution.kind === "bind" ? { implementation_binding: swiftImportBinding(entry, implementationResolution) } : {},
									thunk_address: null,
									location: read.location(entry),
									decode: slotDecode,
									evidence: read.evidence(entry, "Static Swift witness slot, indexed after the conformance-descriptor header")
								});
								if (slotDecode.status !== "decoded") issues.push(issue("swift_conformances_static_witness_slots", "witness_slot_unresolved", slotDecode.reason, hex(entry)));
							} catch (cause) {
								if (!(cause instanceof RangeError)) throw cause;
								issues.push(issue("swift_conformances_static_witness_slots", "witness_slot_unresolved", cause.message, hex(entry)));
								break;
							}
						}
					} catch (cause) {
						const message = cause instanceof Error ? cause.message : String(cause);
						issues.push(issue("swift_conformances_static_witness_slots", "conformance_decode_failed", message, hex(field)));
					}
				}
			}
			return {
				facet: "swift_conformances_static_witness_slots",
				examined: swiftExamined,
				decoded: decodedRecords,
				exhaustive: !budget.truncated && issues.length === 0,
				issues
			};
		};
	})))();
}

//#endregion
//#region dist/native/AppleSwiftVtables.js
var createSwiftClassVtableDecoder;
function init_AppleSwiftVtables() {
	return (init_AppleSwiftVtables = __esmMin((() => {
		init_AppleSwiftDispatchFacets();
		init_AppleDispatchDecodeFacts();
		createSwiftClassVtableDecoder = (input) => {
			const { readers: read, result } = input;
			const issues = [];
			let examined = 0;
			let decoded = 0;
			const failure = ({ record, message }) => {
				issues.push(issue("swift_class_vtable_descriptors", "vtable_decode_failed", message, `0x${record.toString(16)}`));
			};
			const descriptor = ({ record, descriptor, flags, name, context }) => {
				if ((flags & 31) !== 16) return;
				const owner = context.path ?? name;
				if (context.reason !== null) failure({
					record,
					message: context.reason
				});
				try {
					const specific = flags >>> 16;
					if ((flags & 128) !== 0 || (specific & 8192) !== 0) throw new TypeError("Generic class or resilient superclass metadata is unsupported");
					if ((specific & 32768) === 0) return;
					const initialization = specific & 3;
					if (initialization === 3) throw new TypeError("Unknown metadata initialization kind");
					const header = descriptor + 44n + BigInt(initialization === 1 ? 12 : initialization === 2 ? 4 : 0);
					const tableOffset = read.u32(header);
					const count = read.u32(header + 4n);
					const positiveWords = read.u32(descriptor + 28n);
					if (count > 2e4 || tableOffset + count > positiveWords) throw new RangeError("Swift vtable count or offset exceeds declared metadata bounds");
					for (let index = 0; index < count; index++) {
						const entry = header + 8n + BigInt(index * 8);
						if (!read.admit()) {
							issues.push(issue("swift_class_vtable_descriptors", "record_budget_exhausted", "max_records_reached", `0x${entry.toString(16)}`));
							break;
						}
						examined++;
						const methodFlags = read.u32(entry);
						const synchronous = (methodFlags & 64) === 0 && (methodFlags & 15) <= 3;
						const implementationValue = read.relative(entry + 4n, "methodImplementation");
						const implementation = implementationValue.kind === "target" ? implementationValue.target : null;
						const implementationReason = implementationValue.kind === "target" ? null : unresolvedSwiftRelativeReason(implementationValue, "methodImplementation");
						const resolved = implementation !== null && synchronous && read.executable(implementation);
						result.swift_dispatch_slots.push({
							owner,
							table_kind: "class_vtable",
							slot_index: tableOffset + index,
							requirement: null,
							implementation: null,
							implementation_address: resolved ? `0x${implementation.toString(16)}` : null,
							thunk_address: null,
							location: read.location(entry),
							decode: resolved ? {
								status: "decoded",
								reason: null
							} : {
								status: "partial",
								reason: implementation === null ? implementationReason : "Async, coroutine, external or unmapped vtable implementation is unresolved"
							},
							evidence: read.evidence(entry, "Swift class vtable method descriptor; slot index is a metadata word offset, not a source method ordinal")
						});
						if (resolved) decoded++;
						else issues.push(issue("swift_class_vtable_descriptors", "vtable_implementation_unresolved", implementation === null ? implementationReason : "Async, coroutine, external or unmapped vtable implementation is unresolved", `0x${entry.toString(16)}`));
					}
					if ((specific & 16384) !== 0) {
						issues.push(issue("swift_class_vtable_descriptors", "inherited_override_descriptors_unsupported", "Inherited override descriptors are unsupported", `0x${descriptor.toString(16)}`));
					}
				} catch (cause) {
					const message = cause instanceof Error ? cause.message : String(cause);
					issues.push(issue("swift_class_vtable_descriptors", "vtable_decode_failed", message, `0x${record.toString(16)}`));
				}
			};
			return {
				visitor: {
					descriptor,
					failure
				},
				facts: () => ({
					facet: "swift_class_vtable_descriptors",
					examined,
					decoded,
					exhaustive: issues.length === 0,
					issues
				})
			};
		};
	})))();
}

//#endregion
//#region dist/native/AppleObjcClassImportBindings.js
var inspectObjcClassImportBindings, parseAddress, isObjcClassImport;
function init_AppleObjcClassImportBindings() {
	return (init_AppleObjcClassImportBindings = __esmMin((() => {
		inspectObjcClassImportBindings = (input) => {
			const { bytes, layout, fixups, addresses, addressesComplete, maxRecords } = input;
			if (addresses === undefined || addresses.length === 0 && addressesComplete) return {
				bindings: [],
				coverage: {
					status: "not_requested",
					reason: null,
					examined: 0,
					decoded: 0
				}
			};
			if (fixups.kind === "none") return {
				bindings: [],
				coverage: {
					status: "unsupported",
					reason: "Selected Mach-O contains no supported pointer fixup commands",
					examined: 0,
					decoded: 0
				}
			};
			const reasons = new Set();
			if (!addressesComplete) reasons.add("Candidate address scan reached the existing max_records limit");
			for (const failure of fixups.failures) reasons.add(failure);
			const bindings = [];
			const examinedAddresses = new Set();
			const candidates = addresses.slice(0, maxRecords);
			if (candidates.length < addresses.length) reasons.add("Candidate address scan reached the existing max_records limit");
			for (const requestedAddress of candidates) {
				if (examinedAddresses.has(requestedAddress)) continue;
				examinedAddresses.add(requestedAddress);
				const parsedAddress = parseAddress(requestedAddress);
				if (parsedAddress === undefined) {
					reasons.add("A provider address is not a 64-bit hexadecimal address");
					continue;
				}
				try {
					const offset = layout.offset(parsedAddress, 8);
					const raw = bytes.readBigUInt64LE(offset);
					const decoded = fixups.decode(parsedAddress, raw);
					if (decoded.kind === "unsupported") {
						reasons.add(`${requestedAddress}: ${decoded.reason}`);
						continue;
					}
					if (decoded.kind === "unknown") {
						reasons.add(`${requestedAddress}: ${decoded.reason}`);
						continue;
					}
					if (decoded.kind !== "bind" || !isObjcClassImport(decoded.symbol)) continue;
					bindings.push({
						requested_address: requestedAddress,
						symbol: decoded.symbol,
						binding_source: decoded.binding_source,
						library_ordinal: decoded.library_ordinal,
						library: decoded.library,
						weak: decoded.weak,
						addend: decoded.addend.toString(10)
					});
				} catch (cause) {
					reasons.add(`${requestedAddress}: ${cause instanceof Error ? cause.message : String(cause)}`);
				}
			}
			const reason = [...reasons].join("; ") || null;
			return {
				bindings,
				coverage: {
					status: reason === null ? "complete" : "partial",
					reason,
					examined: examinedAddresses.size,
					decoded: bindings.length
				}
			};
		};
		parseAddress = (address) => {
			if (!/^0x[0-9a-f]{1,16}$/iu.test(address)) return undefined;
			try {
				return BigInt(address);
			} catch {
				return undefined;
			}
		};
		isObjcClassImport = (symbol) => /^_?OBJC_CLASS_\$_.+$/u.test(symbol);
	})))();
}

//#endregion
//#region dist/native/AppleDispatchMetadata.js
var decodeAppleDispatchMetadata, OPERATION$3, MEBIBYTE, bytesWithUnits, inputBudgetExceeded, inspectAppleDispatchMetadata, appleDispatchMetadataFailure, appleDispatchMetadataPrimaryFailure;
function init_AppleDispatchMetadata() {
	return (init_AppleDispatchMetadata = __esmMin((() => {
		init_RegularFile();
		init_objcSwiftMetadata();
		init_binaryTargetTypes();
		init_analysisErrorCore();
		init_ArtifactFileOperation();
		init_ArtifactReader();
		init_analysisErrorBase();
		init_analysisErrorProjection();
		init_providerAdapterError();
		init_providerCleanupError();
		init_NativeMacOSProviderMetadata();
		init_BoundedFileBytes();
		init_evidenceErrors();
		init_AppleDispatchCoverage();
		init_AppleMachoFixups();
		init_AppleMachoSelection();
		init_AppleObjcDispatchFacets();
		init_AppleSwiftDispatchFacets();
		init_AppleSwiftVtables();
		init_AppleSwiftNominalTypes();
		init_AppleObjcClassImportBindings();
		decodeAppleDispatchMetadata = (bytes, maxRecords, provenance, architecture = "arm64", objcClassImportAddresses, objcClassImportAddressesComplete = true) => {
			const layout = parseMachoLayout(bytes, architecture);
			const { segments, sections, offset } = layout;
			const fixups = parsePointerFixups(bytes, layout.fixups, segments, layout.baseAddress);
			const objcClassImports = inspectObjcClassImportBindings({
				bytes,
				layout,
				fixups,
				addresses: objcClassImportAddresses,
				addressesComplete: objcClassImportAddressesComplete,
				maxRecords
			});
			const u32 = (address) => bytes.readUInt32LE(offset(address, 4));
			const decodePointer = (address) => fixups.decode(address, bytes.readBigUInt64LE(offset(address, 8)));
			/** In-image target of a raw or rebased pointer; a bind is not an address. */
			const pointer = (address) => {
				const decodedPointer = decodePointer(address);
				if (decodedPointer.kind === "rebase" || decodedPointer.kind === "raw") return decodedPointer.target;
				if (decodedPointer.kind === "bind") return 0n;
				if (decodedPointer.kind === "unknown") return decodedPointer.raw;
				throw new RangeError(decodedPointer.reason);
			};
			const bound = (address) => {
				const decodedPointer = decodePointer(address);
				return decodedPointer.kind === "bind" ? decodedPointer : undefined;
			};
			const location = (address) => ({
				address: `0x${address.toString(16)}`,
				file_offset: offset(address)
			});
			const targetLocation = (address) => {
				let fileOffset;
				try {
					fileOffset = offset(address);
				} catch (cause) {
					if (!(cause instanceof RangeError)) throw cause;
					fileOffset = null;
				}
				return {
					address: `0x${address.toString(16)}`,
					file_offset: fileOffset
				};
			};
			const evidence = (address, description) => [{
				kind: "binary_metadata",
				description,
				location: location(address),
				artifact_path: provenance.path,
				artifact_sha256: provenance.sha256
			}];
			const string = (address) => {
				const start = offset(address);
				let end = start;
				while (end < bytes.length && end - start < 4096 && bytes[end] !== 0) end++;
				if (end === bytes.length || end - start >= 4096) throw new RangeError("Unterminated or oversized metadata string");
				offset(address, end - start + 1);
				return new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				}).decode(bytes.subarray(start, end));
			};
			const result = objcSwiftMetadataSchema.parse({
				db_save_result: null,
				target_selection: {
					kind: "macho-selected-image-v1",
					container: layout.selectedImage.container,
					offset: layout.selectedImage.offset,
					byte_length: layout.selectedImage.byteLength,
					cpu_type: layout.selectedImage.cpuType,
					cpu_subtype: layout.selectedImage.cpuSubtype,
					container_table_sha256: layout.selectedImage.containerTableSha256
				},
				...objcClassImportAddresses === undefined ? {} : {
					objc_class_import_bindings: objcClassImports.bindings,
					objc_class_import_binding_coverage: {
						facet: "objc_class_import_bindings",
						...objcClassImports.coverage
					}
				}
			});
			let records = 0;
			const budget = {
				truncated: false,
				isFull: () => records >= maxRecords,
				markTruncated: () => {
					budget.truncated = true;
				},
				admit: () => {
					if (records >= maxRecords) {
						budget.truncated = true;
						return false;
					}
					records++;
					return true;
				}
			};
			const readers = {
				u32,
				i32: (address) => bytes.readInt32LE(offset(address, 4)),
				u64: (address) => bytes.readBigUInt64LE(offset(address, 8)),
				pointer,
				resolvePointer: decodePointer,
				bound,
				string,
				location,
				targetLocation,
				evidence,
				offset
			};
			const { failures, categoryIssues, examined, categoriesExamined, objcListScanTruncated, objcClassListScanTruncated } = decodeObjcDispatchFacets({
				bytes,
				sections,
				segments,
				readers,
				budget,
				maxListSlots: maxRecords,
				result
			});
			const swiftRelative = createSwiftRelativeReader({
				bytes,
				readers,
				budget,
				result
			});
			const contextReader = createSwiftContextReader({
				u32,
				string,
				relative: swiftRelative
			});
			const swift = decodeSwiftDispatchFacets({
				contextReader,
				sections,
				segments,
				readers,
				relative: swiftRelative,
				budget,
				result
			});
			const typeEntries = [];
			for (const section of sections.filter(({ name }) => name === "__swift5_types")) {
				if (section.size % 4 !== 0) throw new RangeError("Misaligned Swift type section");
				for (let index = 0; index < section.size / 4 && index < maxRecords; index++) typeEntries.push(section.address + BigInt(index * 4));
				if (section.size / 4 > maxRecords) budget.truncated = true;
			}
			const admit = () => budget.admit();
			const executable = (address) => segments.some((segment) => segment.executable && address >= segment.address && address < segment.address + segment.size);
			const vtables = createSwiftClassVtableDecoder({
				result,
				readers: {
					u32,
					relative: swiftRelative,
					location,
					evidence,
					admit,
					executable
				}
			});
			const declarations = decodeSwiftNominalTypes({
				contextReader,
				entries: typeEntries,
				result,
				visitor: vtables.visitor,
				readers: {
					u32,
					relative: swiftRelative,
					string,
					location,
					evidence,
					executable,
					admit
				}
			});
			pushDispatchCoverage({
				result,
				failures,
				categoryIssues,
				examined,
				categoriesExamined,
				objcListScanTruncated,
				objcClassListScanTruncated,
				truncated: budget.truncated,
				fixups,
				declarations,
				vtables: vtables.facts(),
				swift
			});
			return objcSwiftMetadataSchema.parse(result);
		};
		OPERATION$3 = "inspect_native_dispatch_metadata";
		MEBIBYTE = 1024 * 1024;
		bytesWithUnits = (bytes) => Number.isInteger(bytes / (MEBIBYTE * 1024)) ? `${String(bytes)} bytes (${String(bytes / (MEBIBYTE * 1024))} GiB)` : Number.isInteger(bytes / MEBIBYTE) ? `${String(bytes)} bytes (${String(bytes / MEBIBYTE)} MiB)` : `${String(bytes)} bytes`;
		inputBudgetExceeded = (admission, observedBytes) => {
			const budget = `${admission.source === "caller" ? "the selected max_input_bytes" : "the default input budget"} of ${bytesWithUnits(admission.maximum_bytes)}`;
			const observed = observedBytes === null ? "" : ` (${String(observedBytes)} bytes)`;
			const remediationAction = observedBytes === null ? "The file grew while it was read. Retry once the file is stable." : observedBytes <= 1073741824 ? `Retry with max_input_bytes (CLI --max-input-bytes) of at least ${String(observedBytes)}, at most ${bytesWithUnits(MAXIMUM_DISPATCH_METADATA_INPUT_BYTES)}; REA holds that many bytes in memory for the read.` : `The file exceeds the largest selectable budget of ${bytesWithUnits(MAXIMUM_DISPATCH_METADATA_INPUT_BYTES)}; use a deep analysis provider for its Objective-C and Swift metadata.`;
			return new AnalysisResourceConstraintError(OPERATION$3, "memory", `Apple static metadata input${observed} exceeds ${budget}.`, {
				input_bytes: admission.maximum_bytes,
				input_bytes_source: admission.source,
				maximum_selectable_input_bytes: MAXIMUM_DISPATCH_METADATA_INPUT_BYTES,
				...observedBytes === null ? {} : { observed_input_bytes: observedBytes }
			}, {
				retryable: false,
				remediationAction
			});
		};
		inspectAppleDispatchMetadata = async (target, maxRecords, resources, options = {}) => {
			const { signal } = options;
			if (target.kind !== "executable" || !isMachOFormat(target.format)) throw new TypeError("Apple dispatch metadata requires a Mach-O target");
			const admission = options.maxInputBytes === undefined ? {
				maximum_bytes: DEFAULT_DISPATCH_METADATA_INPUT_BYTES,
				source: "default"
			} : {
				maximum_bytes: options.maxInputBytes,
				source: "caller"
			};
			const maximumBytes = admission.maximum_bytes;
			const cancelled = () => new AnalysisCancelledError(OPERATION$3, { cause: signal?.reason });
			const { bytes, digest } = await withArtifactRegularFile(target.path, resources, signal, async ({ handle, initial: before }) => {
				if (before.size > maximumBytes) throw inputBudgetExceeded(admission, before.size);
				if (signal?.aborted) throw cancelled();
				const read = await readBoundedFileBytes(handle, maximumBytes, {
					signal,
					cancellationFailure: () => cancelled()
				});
				if (read === undefined) throw inputBudgetExceeded(admission, null);
				const sha256 = createHash("sha256").update(read).digest("hex");
				if (sha256 !== target.sha256) throw new EvidenceIntegrityError("Apple metadata target digest changed after session binding");
				return {
					bytes: read,
					digest: sha256
				};
			}, "reject");
			return nativeDispatchMetadataResultSchema.parse({
				target_sha256: target.sha256,
				target_architecture: target.architecture,
				provider: APPLE_DISPATCH_METADATA_ANALYSIS_PROFILE.provider,
				analysis_profile_digest: APPLE_DISPATCH_METADATA_ANALYSIS_PROFILE.digest,
				input_admission: {
					...admission,
					retained_bytes: bytes.length
				},
				result: decodeAppleDispatchMetadata(bytes, maxRecords, {
					path: target.path,
					sha256: digest
				}, target.architecture, options.objcClassImportAddresses, options.objcClassImportAddressesComplete ?? true)
			});
		};
		appleDispatchMetadataFailure = (cause, path) => {
			if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) {
				const physical = cause instanceof ArtifactFileCleanupFailure ? cause.fileCleanupFailure : undefined;
				const previous = physical?.outcome.kind === "failed" ? appleDispatchMetadataPrimaryFailure(artifactFilePrimaryFacts(cause), path) : physical?.completionCancellation === undefined ? undefined : new AnalysisCancelledError(OPERATION$3, { cause: physical.completionCancellation.reason });
				const failure = new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, cause.cleanup.resources, {
					reason: cause.cleanup.reason,
					previous_error: previous === undefined ? null : projectAnalysisError(previous)
				}, {
					operation: OPERATION$3,
					cause,
					cleanupPrimary: previous
				});
				bindArtifactFileCleanup(cause, failure);
				return failure;
			}
			return appleDispatchMetadataPrimaryFailure(artifactFilePrimaryFacts(cause), path);
		};
		appleDispatchMetadataPrimaryFailure = ({ cause, origin }, path) => {
			if (origin === "owned-or-classified") {
				if (cause instanceof AnalysisError) return cause;
				if (cause instanceof UnsupportedMachoMetadataFormatError) return new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, OPERATION$3, cause.message, { cause });
				if (cause instanceof ArtifactReaderFailure && cause.reason === "cancelled") return new AnalysisCancelledError(OPERATION$3, { cause: artifactFileCancellationCause(cause) });
				if (cause instanceof ArtifactReaderFailure && cause.reason === "unavailable") return new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, OPERATION$3, cause.message, { cause });
				if (cause instanceof ArtifactReaderFailure && cause.reason === "integrity") return new AnalysisArtifactChangedError(OPERATION$3, path, cause.message, { cause });
				if (cause instanceof ArtifactReaderFailure && cause.reason === "path") return new AnalysisArtifactChangedError(OPERATION$3, path, cause.message, { cause });
			}
			const readCause = origin === "owned-or-classified" && cause instanceof ArtifactReaderFailure && cause.reason === "io" ? cause.cause : cause;
			if (readCause instanceof Error && "code" in readCause && (readCause.code === "EACCES" || readCause.code === "EPERM")) return new AnalysisAccessDeniedError(OPERATION$3, path, readCause.code, { cause });
			if (isSelectedRegularFileError(readCause)) return new AnalysisArtifactChangedError(OPERATION$3, path, `Bound metadata target could not be read (${readCause.code}): ${path}`, { cause });
			return new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, OPERATION$3, {
				cause,
				diagnostics: {
					target_path: path,
					reason: cause instanceof Error ? cause.message : String(cause)
				}
			});
		};
	})))();
}

//#endregion
//#region dist/native/NativeUiCleanupError.js
var NativeUiCleanupError;
function init_NativeUiCleanupError() {
	return (init_NativeUiCleanupError = __esmMin((() => {
		init_AnalysisCleanupLease();
		init_providerCleanupError();
		NativeUiCleanupError = class extends ProviderCleanupError {
			runtimes;
			constructor(failures, operation, partialObservation) {
				const runtimes = failures.map(({ runtime }) => runtime);
				const resources = () => runtimes.filter((runtime) => !runtime.cleanupLease.released).flatMap((runtime) => runtime.resources());
				super("native-macos", resources(), {
					reason: "Native UI runtime cleanup remains incomplete",
					failures: failures.map(({ runtime, cause }) => ({
						resources: [...runtime.resources()],
						reason: cause instanceof Error ? cause.message : String(cause)
					}))
				}, {
					operation,
					cause: new AggregateError(failures.map(({ cause }) => cause), "Native UI runtime cleanup failed"),
					partialObservation
				});
				this.runtimes = runtimes;
				new AnalysisCleanupLeaseGroup(this, runtimes.map((runtime) => runtime.cleanupLease));
				this.bindCleanupResourceOwner({ get cleanupResources() {
					return resources();
				} });
			}
		};
	})))();
}

//#endregion
//#region dist/native/NativeUiOutputBudget.js
var HELPER_SUCCESS_WRAPPER, NATIVE_UI_OUTPUT_BUDGET_BYTES, NATIVE_UI_OUTPUT_WEIGHT, NATIVE_UI_HELPER_ENVELOPE_BYTES, NATIVE_UI_HELPER_MAX_BUFFER;
function init_NativeUiOutputBudget() {
	return (init_NativeUiOutputBudget = __esmMin((() => {
		HELPER_SUCCESS_WRAPPER = Buffer.from(JSON.stringify({
			ok: true,
			result: {}
		}));
		NATIVE_UI_OUTPUT_BUDGET_BYTES = 64 * 1024 * 1024;
		NATIVE_UI_OUTPUT_WEIGHT = 2;
		NATIVE_UI_HELPER_ENVELOPE_BYTES = HELPER_SUCCESS_WRAPPER.byteLength - Buffer.byteLength("{}");
		NATIVE_UI_HELPER_MAX_BUFFER = NATIVE_UI_OUTPUT_BUDGET_BYTES + NATIVE_UI_HELPER_ENVELOPE_BYTES;
	})))();
}

//#endregion
//#region dist/native/NativeUiHelperRuntime.js
var createNativeUiHelperRuntime;
function init_NativeUiHelperRuntime() {
	return (init_NativeUiHelperRuntime = __esmMin((() => {
		init_ArtifactResourceScope();
		init_AnalysisCleanupLease();
		init_snapshotEnvironment();
		init_DarwinProcessRunTokenReader();
		init_ExecFileOutput();
		init_safeJson();
		init_nativeDeadlines();
		init_NativeUiOutputBudget();
		createNativeUiHelperRuntime = (environment, deadlineMs = DEFAULT_NATIVE_UI_DEADLINE_MS) => {
			const selectedEnvironment = snapshotEnvironment(environment);
			const deadlineSignal = AbortSignal.timeout(deadlineMs);
			const operations = new ArtifactResourceScope();
			let root;
			let preparation;
			const cleanupLease = new AnalysisCleanupLease(async () => {
				await operations.close();
				if (root !== undefined) {
					await rm(root, {
						recursive: true,
						force: true
					});
					root = undefined;
					preparation = undefined;
				}
			});
			const prepare = async (signal) => {
				root = await mkdtemp(join(tmpdir(), "rea-native-ui-"));
				const output = join(root, "observer");
				const main = join(root, "main.swift");
				await symlink(fileURLToPath(new URL("../../bridge/native/ReaNativeUI.swift", new URL("../native/NativeUiHelperRuntime.js", import.meta.url).href)), main);
				const compilerTemporary = join(root, "tmp");
				await mkdir(compilerTemporary);
				await execFileOutput("/usr/bin/xcrun", [
					"swiftc",
					"-module-cache-path",
					join(root, "modules"),
					fileURLToPath(new URL("../../bridge/native/NativeUIChildren.swift", new URL("../native/NativeUiHelperRuntime.js", import.meta.url).href)),
					fileURLToPath(new URL("../../bridge/native/NativeUIValues.swift", new URL("../native/NativeUiHelperRuntime.js", import.meta.url).href)),
					main,
					"-o",
					output
				], {
					timeout: deadlineMs,
					maxBuffer: 1024 * 1024,
					stopSignal: SWIFTC_INTERRUPT,
					env: {
						...selectedEnvironment,
						TMPDIR: compilerTemporary
					},
					signal
				});
				return output;
			};
			const invoke = (parameters, callerSignal) => operations.run(async () => {
				const signal = callerSignal === undefined ? deadlineSignal : AbortSignal.any([callerSignal, deadlineSignal]);
				preparation ??= prepare(signal);
				const executable = await preparation;
				const output = await execFileOutput(executable, [JSON.stringify(parameters)], {
					timeout: deadlineMs,
					maxBuffer: NATIVE_UI_HELPER_MAX_BUFFER,
					stopSignal: "SIGTERM",
					env: selectedEnvironment,
					signal
				});
				const parsed = safeParseJson(output.stdout);
				if (!parsed.ok) throw new Error(`Native helper returned invalid JSON: ${parsed.error}`, { cause: parsed.cause });
				return parsed.value;
			});
			return {
				invoke,
				cleanupLease,
				signal: deadlineSignal,
				deadlineMs,
				close: () => cleanupLease.release(),
				resources: () => root === undefined ? [] : [root]
			};
		};
	})))();
}

//#endregion
//#region dist/native/NativeUiInterruptionControl.js
var NativeUiInterruptionControl;
function init_NativeUiInterruptionControl() {
	return (init_NativeUiInterruptionControl = __esmMin((() => {
		init_analysisErrorCore();
		init_nativeDeadlines();
		NativeUiInterruptionControl = class {
			signal;
			#controller = new AbortController();
			#interruption;
			#caller;
			#deadline;
			#deadlineMs;
			#onCallerAbort = () => {
				this.#interrupt("caller", this.#caller?.reason);
			};
			#onDeadlineAbort = () => {
				this.#interrupt("deadline", this.#deadline.reason);
			};
			/** Selected `native_ui_deadline_ms`, including the omitted default. */
			get deadlineMs() {
				return this.#deadlineMs;
			}
			constructor(caller, deadline, deadlineMs = DEFAULT_NATIVE_UI_DEADLINE_MS) {
				this.#caller = caller;
				this.#deadline = deadline;
				this.#deadlineMs = deadlineMs;
				this.signal = this.#controller.signal;
				if (caller?.aborted) this.#interrupt("caller", caller.reason);
				else if (deadline.aborted) this.#interrupt("deadline", deadline.reason);
				else {
					caller?.addEventListener("abort", this.#onCallerAbort, { once: true });
					deadline.addEventListener("abort", this.#onDeadlineAbort, { once: true });
				}
			}
			/**
			* A helper subprocess reached the selected deadline before the abort signal
			* settled. Caller cancellation already recorded on this control stays primary.
			*/
			deadlineFailure(operation, partialObservation) {
				if (this.#interruption === undefined) this.#interrupt("deadline", this.#deadline.reason);
				const error = this.error(operation, partialObservation);
				if (error === undefined) throw new Error("UI deadline failure requires an interruption.");
				return error;
			}
			error(operation, partialObservation) {
				const interruption = this.#interruption;
				if (interruption === undefined) return undefined;
				return interruption.kind === "deadline" ? new AnalysisTimeoutError(operation, this.#deadlineMs, {
					cause: interruption.reason,
					partialObservation,
					...nativeDeadlineRecovery({
						timeoutMs: this.#deadlineMs,
						setting: "native_ui_deadline_ms",
						cliFlag: "--native-ui-deadline-ms",
						defaultMs: DEFAULT_NATIVE_UI_DEADLINE_MS,
						phase: "native UI observation deadline",
						detail: " A partial observation may already be retained.",
						unchanged: "The 67108864-byte scenario output allowance and the 180000 ms cap on one wait step have no runtime override."
					})
				}) : new AnalysisCancelledError(operation, {
					cause: interruption.reason,
					partialObservation
				});
			}
			dispose() {
				this.#caller?.removeEventListener("abort", this.#onCallerAbort);
				this.#deadline.removeEventListener("abort", this.#onDeadlineAbort);
			}
			#interrupt(kind, reason) {
				if (this.#interruption !== undefined) return;
				this.#interruption = {
					kind,
					reason
				};
				this.#controller.abort(reason);
			}
		};
	})))();
}

//#endregion
//#region dist/native/NativeUiObservation.js
var helper, passiveInputSchema, responseSchema, initialSelectionFields, observeNativeUi, observeWithHelper, finishNativeUiObservation;
function init_NativeUiObservation() {
	return (init_NativeUiObservation = __esmMin((() => {
		init_ProviderDeadline();
		init_binaryTargetTypes();
		init_nativeDeadlines();
		init_nativeUiObservation();
		init_analysisErrorCore();
		init_providerAdapterError();
		init_analysisErrorBase();
		init_analysisErrorCleanup();
		init_ExecFileOutput();
		init_NativeUiCleanupError();
		init_result();
		init_NativeUiHelperRuntime();
		init_NativeUiOutputBudget();
		init_NativeUiInterruptionControl();
		helper = fileURLToPath(new URL("../../bridge/native/ReaNativeUI.swift", new URL("../native/NativeUiObservation.js", import.meta.url).href));
		passiveInputSchema = nativeUiObservationInputSchema.transform((input) => ({
			...input,
			steps: []
		}));
		responseSchema = z.discriminatedUnion("ok", [z.strictObject({
			ok: z.literal(true),
			result: nativeUiSnapshotSchema
		}), z.strictObject({
			ok: z.literal(false),
			code: z.string(),
			message: z.string()
		})]);
		initialSelectionFields = new Map([
			["pid-not-application", "pid"],
			["target-mismatch", "pid"],
			["window-mismatch", "window_id"],
			["ambiguous-window", "window_id"]
		]);
		observeNativeUi = async (target, operation, parameters, options) => {
			const runtime = options.runtime ?? createNativeUiHelperRuntime(options.environment);
			const interruption = options.interruption ?? new NativeUiInterruptionControl(options.signal, runtime.signal, runtime.deadlineMs ?? 18e4);
			const ownsInterruption = options.interruption === undefined;
			let result;
			try {
				try {
					result = await observeWithHelper(target, operation, parameters, {
						interruption,
						invoke: options.invoke ?? runtime.invoke
					});
				} catch (cause) {
					result = err(cause instanceof AnalysisError ? cause : new ProviderAdapterError("native-macos", operation, { cause }));
				}
				if (options.runtime === undefined) {
					try {
						await runtime.close();
					} catch (cause) {
						result = finishNativeUiObservation(result, operation, interruption);
						const cleanup = new NativeUiCleanupError([{
							runtime,
							cause
						}], operation, result.ok ? result.value : undefined);
						return result.ok ? err(cleanup) : err(analysisErrorWithCleanupFailure(result.error, cleanup, operation).bindCleanupDependencies([result.error, cleanup]));
					}
				}
				return finishNativeUiObservation(result, operation, interruption);
			} finally {
				if (ownsInterruption) interruption.dispose();
			}
		};
		observeWithHelper = async (target, operation, parameters, options) => {
			const parsed = (operation === "observe_native_ui" ? passiveInputSchema : nativeUiScenarioInputSchema).safeParse(parameters);
			if (!parsed.success) return err(new AnalysisInputError(operation, { cause: parsed.error }));
			if (target.kind !== "executable" || !isMachOFormat(target.format)) return err(new AnalysisCapabilityUnavailableError("native-macos", operation, "Native UI observation requires an active Mach-O executable or app target"));
			const input = parsed.data;
			if (!input.screenshot && !input.accessibility) return err(new AnalysisInputError(operation, { cause: new Error("Enable screenshot or accessibility capture") }));
			const steps = input.steps;
			const interruption = options.interruption;
			const signal = interruption.signal;
			const invoke = options.invoke;
			let launchTime;
			let outputBytes = 0;
			const take = async (action) => {
				const interrupted = interruption.error(operation);
				if (interrupted !== undefined) return err(interrupted);
				try {
					const response = responseSchema.parse(await invoke({
						pid: input.pid,
						window_id: input.window_id,
						executable: target.path,
						sha256: target.sha256,
						...launchTime === undefined ? {} : { launch_time: launchTime },
						screenshot: input.screenshot,
						accessibility: input.accessibility,
						max_nodes: input.max_nodes,
						...action === undefined ? {} : { action }
					}, signal));
					if (!response.ok) {
						const field = initialSelectionFields.get(response.code);
						if (launchTime === undefined && field !== undefined) return err(new AnalysisInputError(operation, { userMessage: response.message }, [{
							path: [field],
							reason: "invalid_value",
							message: `${response.code}: ${response.message}`
						}]));
						return err(new AnalysisCapabilityUnavailableError("native-macos", operation, `${response.code}: ${response.message}`, { userMessage: response.message }));
					}
					if (response.result.window.pid !== input.pid || response.result.window.window_id !== input.window_id || response.result.window.executable !== target.path || launchTime !== undefined && response.result.window.launch_time !== launchTime) return err(new AnalysisCapabilityUnavailableError("native-macos", operation, "Native helper returned a different target process or window"));
					launchTime = response.result.window.launch_time;
					outputBytes += 2 * Buffer.byteLength(JSON.stringify(response.result));
					if (outputBytes > 67108864) return err(new AnalysisCapabilityUnavailableError("native-macos", operation, `Scenario captures exceeded the fixed 64 MiB output budget (${String(NATIVE_UI_OUTPUT_BUDGET_BYTES)} bytes). This release has no runtime override. native_ui_deadline_ms does not raise it.`, {
						userMessage: `Scenario captures exceeded the fixed 64 MiB output budget (${String(NATIVE_UI_OUTPUT_BUDGET_BYTES)} bytes). This release has no runtime override.`,
						remediationAction: `The scenario output allowance is ${String(NATIVE_UI_OUTPUT_BUDGET_BYTES)} bytes. This release has no runtime override. Waiting, additional host memory, and native_ui_deadline_ms do not raise it. Repeating the unchanged request fails the same way.`
					}));
					return ok(response.result);
				} catch (cause) {
					if (cause instanceof AnalysisError) return err(cause);
					if (cause instanceof Error && "code" in cause && cause.code === "ETIMEDOUT") return err(interruption.deadlineFailure(operation));
					return err(cause instanceof ExecFileOutputCancelledError ? (signal.aborted && cause.cause === signal.reason ? interruption.error(operation) : undefined) ?? new AnalysisCancelledError(operation, { cause: cause.cause }) : new ProviderAdapterError("native-macos", operation, {
						cause,
						diagnostics: {
							helper_path: helper,
							reason: cause instanceof Error ? cause.message : String(cause),
							remediation: "Native helper failed, timed out, or returned malformed capture data; install compatible Xcode command-line tools and inspect local OS permissions"
						}
					}));
				}
			};
			const initial = await take();
			if (!initial.ok) return initial;
			const results = [];
			let before = initial.value;
			let terminalFailure;
			for (const [index, step] of steps.entries()) {
				if (step.kind === "wait") await waitForAbortableDelay(step.milliseconds, signal);
				const after = await take(step.kind === "wait" ? undefined : step);
				if (!after.ok) {
					terminalFailure = after.error;
					results.push({
						index,
						kind: step.kind,
						before,
						after: null,
						outcome: after.error._tag === "AnalysisCancelledError" ? "cancelled" : "failed",
						reason: after.error.message
					});
					break;
				}
				results.push({
					index,
					kind: step.kind,
					before,
					after: after.value,
					outcome: "completed",
					reason: null
				});
				before = after.value;
			}
			const report = nativeUiResultSchema.parse({
				target_sha256: target.sha256,
				initial: initial.value,
				steps: results,
				restore: "leave-as-is",
				limitations: [
					"Only the explicitly selected already-running process/window is admitted. REA starts no target process and does not change permissions, foreground applications, or restore application data.",
					"Click uses AXPress; scroll uses AXIncrement/AXDecrement; key-entry sets the selected element's AXValue. Unsupported elements fail without global event fallback.",
					"Each completed action is followed immediately by capture; delayed UI changes require explicit wait steps. A failed after-capture can follow a completed action, so failure does not prove absence of application effects.",
					"Scenarios can change app data, cause app network activity and persist changes. The caller explicitly chooses leave-as-is; automatic restoration is unsupported.",
					`Window matching uses exact PID and window ID for screenshots and unique accessibility geometry. Accessibility paths can change as the UI changes; stale or ambiguous paths fail. Screenshots are scaled to at most 2048 pixels; scenario output is budgeted at 64 MiB. Execution uses the selected native_ui_deadline_ms of ${String(interruption.deadlineMs)} ms (omitted means ${String(DEFAULT_NATIVE_UI_DEADLINE_MS)}). One wait step stays capped at ${String(NATIVE_UI_WAIT_STEP_MAX_MS)} ms and that cap has no runtime override.`
				]
			});
			return terminalFailure === undefined ? finishNativeUiObservation(ok(report), operation, interruption) : err(terminalFailure.retainPartialObservation(report));
		};
		finishNativeUiObservation = (result, operation, interruption) => {
			if (!result.ok) return result;
			const error = interruption.error(operation, result.value);
			return error === undefined ? result : err(error);
		};
	})))();
}

//#endregion
//#region dist/native/NativeCallTarget.js
var OPERATION$2, nativeCallTargetFailure, verifyNativeCallTarget;
function init_NativeCallTarget() {
	return (init_NativeCallTarget = __esmMin((() => {
		init_NativeMacOSProviderMetadata();
		init_analysisErrorCore();
		init_evidenceErrors();
		init_providerAdapterError();
		init_providerCleanupError();
		init_jsonValue();
		init_result();
		init_StableFileHash();
		init_RegularFile();
		init_OwnedRegularFile();
		init_AnalysisCleanupLease();
		init_ArtifactResourceScope();
		init_ArtifactFileOperation();
		OPERATION$2 = "observe_native_calls";
		nativeCallTargetFailure = (cause, path) => {
			if (cause instanceof ArtifactResourceRetryFailure && cause.cleanup !== undefined) {
				const failure = new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, cause.cleanup.resources, {
					reason: cause.cleanup.reason,
					phase: "target-digest-retry"
				}, {
					operation: OPERATION$2,
					cause
				});
				bindArtifactFileCleanup(cause, failure);
				return failure;
			}
			if (cause instanceof RegularFileOperationCancelled || cause instanceof RegularFileCancelled) return new AnalysisCancelledError(OPERATION$2, {
				cause: cause.reason,
				...cause instanceof RegularFileCancelled ? { diagnostics: { completed_hash: jsonValueSchema.parse(cause.outcome.value) } } : {}
			});
			const physical = stableFileHashCause(cause);
			if (physical instanceof RegularFileChangedError) return new EvidenceIntegrityError("Native call observation target changed during digest verification", { cause: physical });
			return new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, OPERATION$2, {
				cause: physical,
				diagnostics: {
					path,
					phase: "target-digest",
					reason: "Unable to verify the selected target digest",
					detail: physical instanceof Error ? physical.message : String(physical)
				}
			});
		};
		verifyNativeCallTarget = async (target, resources, signal) => {
			let cleanupLease;
			try {
				const digest = await hashStableFile(target.path, {
					...signal === undefined ? {} : { signal },
					retainFailedClose: (owner) => {
						cleanupLease = new AnalysisCleanupLease(() => owner.close(), [target.path]);
						resources.retain({
							kind: "lease",
							resource: target.path,
							lease: cleanupLease
						});
					}
				});
				return digest.sha256 === target.sha256 ? ok(undefined) : err(new EvidenceIntegrityError("Native call observation target digest changed after session binding"));
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure && cleanupLease !== undefined) {
					const cancellation = regularFileCancellation(cause);
					const completed = cause.outcome.kind === "completed" ? { completed_hash: jsonValueSchema.parse(cause.outcome.value) } : undefined;
					const primary = cause.outcome.kind === "failed" ? nativeCallTargetFailure(cause.outcome.cause, target.path) : cancellation === undefined ? undefined : new AnalysisCancelledError(OPERATION$2, {
						cause: cancellation.reason,
						diagnostics: completed
					});
					const framed = new ArtifactFileCleanupFailure(cause, cleanupLease);
					const failure = new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, [target.path], {
						phase: "target-digest-close",
						reason: cause.cleanupCause instanceof Error ? cause.cleanupCause.message : String(cause.cleanupCause),
						...completed
					}, {
						operation: OPERATION$2,
						cause: framed,
						cleanupPrimary: primary
					});
					bindArtifactFileCleanup(framed, failure);
					return err(failure);
				}
				return err(nativeCallTargetFailure(cause, target.path));
			}
		};
	})))();
}

//#endregion
//#region dist/domain/native/nativeCallPartialObservation.js
var completed, nativeCallPartialObservationSchema;
function init_nativeCallPartialObservation() {
	return (init_nativeCallPartialObservation = __esmMin((() => {
		init_nativeCallObservation();
		completed = nativeCallObservationResultSchema.shape;
		nativeCallPartialObservationSchema = z.strictObject({
			kind: z.literal("native-call-observation"),
			target: completed.target.omit({ launch_identity: true }).extend({ launch_identity: completed.target.shape.launch_identity.optional() }),
			process: completed.process.partial().extend({
				pid: z.int().positive().nullable(),
				stdout: nativeCapturedOutputSchema.nullable(),
				stderr: nativeCapturedOutputSchema.nullable(),
				other_stops: z.array(z.string())
			}),
			debugger: completed.debugger.partial().extend({ version: z.string().nullable() }),
			breakpoints: completed.breakpoints.optional(),
			events: z.array(nativeCallEventSchema),
			coverage: completed.coverage.omit({ status: true }).partial().extend({
				status: z.literal("partial"),
				reason: z.enum([
					"cancelled",
					"timeout",
					"tracer-failure",
					"capture-failure",
					"cleanup-failure"
				])
			}),
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/native/NativeCallObservation.js
var OPERATION$1, NATIVE_CALL_OBSERVATION_LIMITATIONS, observeNativeCalls, nativeCallFacts, projectNativeCalls, projectPartialNativeCalls;
function init_NativeCallObservation() {
	return (init_NativeCallObservation = __esmMin((() => {
		init_analysisErrorCore();
		init_binaryTargetTypes();
		init_providerAdapterError();
		init_nativeCallObservation();
		init_NativeCallTarget();
		init_result();
		init_nativeCallPartialObservation();
		OPERATION$1 = "observe_native_calls";
		NATIVE_CALL_OBSERVATION_LIMITATIONS = [
			"Only entries are observed; return values, floating-point and stack-passed arguments are not captured.",
			"Registers are the raw integer argument registers at entry. For Objective-C methods the first two hold the receiver and the selector.",
			"Receiver classes come from LLDB's Objective-C runtime reader without running target code; they are null for class methods and for receivers LLDB cannot classify.",
			"Calls that never reach a symbol's entry, such as inlined code or objc_direct methods called directly, are not observed.",
			"The target is launched directly under LLDB, not through LaunchServices; LLDB disables ASLR for it, so load addresses can equal file addresses.",
			"The observation window is checked about once a second, and recording pauses the process at every entry, which slows it."
		];
		observeNativeCalls = async (target, parameters, tracer, resources, signal) => {
			if (target.kind !== "executable" || !isMachOFormat(target.format)) return err(new AnalysisCapabilityUnavailableError("native-macos", OPERATION$1, "Native call observation launches a Mach-O executable; the active target is not one"));
			const parsed = nativeCallObservationInputSchema.safeParse(parameters);
			if (!parsed.success) return err(new AnalysisInputError(OPERATION$1, { cause: parsed.error }));
			try {
				return await resources.run(async () => {
					const selected = await verifyNativeCallTarget(target, resources, signal);
					if (!selected.ok) return selected;
					if (signal?.aborted) return err(new AnalysisCancelledError(OPERATION$1, { cause: signal.reason }));
					try {
						const traced = await tracer.trace({
							executable: target.path,
							architecture: target.architecture,
							expectedSha256: target.sha256,
							input: parsed.data
						}, signal);
						if (!traced.ok) return traced;
						return signal?.aborted ? err(new AnalysisCancelledError(OPERATION$1, {
							cause: signal.reason,
							partialObservation: projectPartialNativeCalls(target, parsed.data, traced.value, "cancelled")
						})) : ok(projectNativeCalls(target, parsed.data, traced.value));
					} catch (cause) {
						return err(new ProviderAdapterError("native-macos", OPERATION$1, {
							cause,
							diagnostics: { phase: "trace-result" }
						}));
					}
				});
			} catch (cause) {
				return err(nativeCallTargetFailure(cause, target.path));
			}
		};
		nativeCallFacts = (target, input, trace) => {
			const { run } = trace;
			const terminated = run.terminated && trace.terminated;
			const terminationSummary = terminated ? "the process was killed" : "termination was requested but could not be confirmed";
			const unresolved = run.breakpoints.filter(({ location_count: count }) => count === 0).map(({ index }) => index);
			const eventLimit = run.outcome === "event-limit";
			const resourceLimit = run.outcome === "resource-limit";
			const breakpointLocationLimit = run.breakpoint_locations_truncated === true;
			const partial = eventLimit || resourceLimit || breakpointLocationLimit || run.outcome === "duration-elapsed" || run.outcome === "stop-limit" || unresolved.length > 0;
			return {
				target: {
					path: target.path,
					sha256: target.sha256,
					architecture: target.architecture,
					arguments: input.arguments,
					environment: input.environment,
					working_directory: input.working_directory ?? null,
					launch_identity: {
						loaded_image_sha256: run.target_identity.loaded_image_sha256,
						file_device: run.target_identity.file_device,
						file_inode: run.target_identity.file_inode,
						selected_file_sha256: run.target_identity.selected_file_sha256,
						module_path: run.target_identity.module_path,
						module_uuid: run.target_identity.module_uuid,
						stable: run.target_identity.stable
					}
				},
				debugger: trace.debugger,
				process: {
					pid: run.pid,
					outcome: run.outcome,
					exit_status: run.exit_status,
					exit_description: run.exit_description,
					terminated,
					elapsed_ms: run.elapsed_ms,
					stdout: trace.stdout,
					stderr: trace.stderr,
					other_stops: run.other_stops
				},
				breakpoints: input.breakpoints.map((request, index) => ({
					index,
					request: request.kind === "function" ? {
						...request,
						module: request.module ?? null
					} : {
						...request,
						class_name: request.class_name ?? null
					},
					location_count: run.breakpoints[index]?.location_count ?? 0,
					locations: run.breakpoints[index]?.locations ?? []
				})),
				events: run.events,
				coverage: {
					status: partial ? "partial" : "complete",
					event_limit_reached: eventLimit,
					resource_limit_reached: resourceLimit,
					...breakpointLocationLimit ? { breakpoint_locations_truncated: true } : {},
					unresolved_breakpoints: unresolved
				},
				limitations: [
					...NATIVE_CALL_OBSERVATION_LIMITATIONS,
					"The selected pathname digest and LLDB module identity are checked around launch. No immutable executable snapshot is used; concurrent in-place mutation or replacement and restoration cannot be ruled out, so the loaded-image digest remains unknown.",
					...eventLimit ? [`Observation stopped at max_events (${input.max_events}); later calls were not recorded and ${terminationSummary}.`] : [],
					...resourceLimit ? [`Observation stopped before retaining the next complete event because the estimated 8388608-byte (8 MiB) trace-payload or 65536-frame aggregate budget was reached; ${terminationSummary}. This release has no runtime override for those budgets.`] : [],
					...run.outcome === "duration-elapsed" ? [`The process was still running after duration_ms (${input.duration_ms}); ${terminationSummary}.`] : [],
					...run.target_identity.stable ? [] : ["LLDB did not provide enough module identity evidence to confirm pathname and module continuity around launch."],
					...run.outcome === "stop-limit" ? [`Observation stopped after repeated signal or exception stops; ${terminationSummary}.`] : [],
					...unresolved.length === 0 ? [] : [`Breakpoints ${unresolved.join(", ")} matched no code in any image loaded while observing; their calls could not be observed.`],
					...run.breakpoints.some(({ location_count: count, locations }) => locations.length < count) ? ["Breakpoints with many matching locations list only the first 64; location_count gives the total."] : [],
					...breakpointLocationLimit ? ["Resolved breakpoint locations exceeded the aggregate 8388608-byte (8 MiB) metadata budget; omitted locations are counted in location_count. This metadata limit does not change the process outcome. This release has no runtime override."] : [],
					...trace.stdout === null || trace.stderr === null ? ["One or more target output captures were unavailable."] : [],
					...trace.stdout?.truncated === true || trace.stderr?.truncated === true ? ["Target output beyond 1048576 bytes (1 MiB) per stream is counted but not kept. This release has no runtime override."] : [],
					...trace.stdout?.complete === false || trace.stderr?.complete === false ? ["Target output draining did not complete; reported byte counts are observed lower bounds, not stream totals."] : [],
					...run.terminated && trace.terminated ? [] : [`REA could not confirm that process ${run.pid} exited; check for it before relying on host state.`]
				]
			};
		};
		projectNativeCalls = (target, input, trace) => nativeCallObservationResultSchema.parse(nativeCallFacts(target, input, trace));
		projectPartialNativeCalls = (target, input, trace, reason) => {
			const facts = nativeCallFacts(target, input, trace);
			return nativeCallPartialObservationSchema.parse({
				...facts,
				kind: "native-call-observation",
				coverage: {
					...facts.coverage,
					status: "partial",
					reason
				}
			});
		};
	})))();
}

//#endregion
//#region dist/native/LldbReadbackFiles.js
var TARGET_PID_FILE_MAX_BYTES, LldbReadbackFiles;
function init_LldbReadbackFiles() {
	return (init_LldbReadbackFiles = __esmMin((() => {
		init_result();
		init_ArtifactResourceScope();
		init_ArtifactFileOperation();
		TARGET_PID_FILE_MAX_BYTES = String(Number.MAX_SAFE_INTEGER).length + 2;
		LldbReadbackFiles = class {
			#resources = new ArtifactResourceScope();
			#targetPids = new Map();
			#failed = new Map();
			get hasPending() {
				return this.#resources.hasPending;
			}
			get cleanupResources() {
				return [...new Set([...this.#failed].filter(([lease]) => !lease.released).map(([, failure]) => failure.path))];
			}
			get cleanupCause() {
				const failures = [...this.#failed].filter(([lease]) => !lease.released).map(([, failure]) => failure.cause);
				return failures.length === 0 ? undefined : new AggregateError(failures, "LLDB readback descriptors remain open or unconfirmed");
			}
			/** Preserve a completed value even if final close transfers its owner here. */
			async read(path, read) {
				const blocked = [...this.#failed].find(([lease, failure]) => !lease.released && failure.path === path);
				if (blocked !== undefined) return err(blocked[1].cause);
				let completed;
				try {
					return ok(await withArtifactRegularFile(path, this.#resources, undefined, async ({ handle }) => {
						const value = await read(handle);
						completed = { value };
						return value;
					}));
				} catch (cause) {
					if (cause instanceof ArtifactFileCleanupFailure) this.#failed.set(cause.cleanupLease, {
						path,
						cause
					});
					return completed === undefined ? err(cause) : ok(completed.value);
				}
			}
			/** The producer publishes one target PID per runtime; retain its parsed fact. */
			async readTargetPid(path) {
				const known = this.#targetPids.get(path);
				if (known !== undefined) return known;
				const contents = await this.read(path, async (file) => {
					const bytes = Buffer.alloc(TARGET_PID_FILE_MAX_BYTES + 1);
					let length = 0;
					while (length < bytes.length) {
						const { bytesRead } = await file.read(bytes, length, bytes.length - length, length);
						if (bytesRead === 0) break;
						length += bytesRead;
					}
					if (length > TARGET_PID_FILE_MAX_BYTES) return undefined;
					return bytes.subarray(0, length).toString("utf8").trim();
				});
				if (!contents.ok || contents.value === undefined || !/^[1-9]\d*$/u.test(contents.value)) return undefined;
				const pid = Number(contents.value);
				if (!Number.isSafeInteger(pid)) return undefined;
				this.#targetPids.set(path, pid);
				return pid;
			}
			async retryCleanup() {
				try {
					await this.#resources.retryCleanup();
				} finally {
					for (const lease of this.#failed.keys()) if (lease.released) this.#failed.delete(lease);
				}
			}
		};
	})))();
}

//#endregion
//#region dist/native/LldbRetainedObservations.js
var LLDB_OBSERVATION_JOURNAL_MAX_BYTES, MAX_CAPTURE_BYTES, projectLldbPartialObservation, parseLldbObservationJournal, readBoundedPrefix, readPrefix, readLldbObservationJournal, readPartialCapture, errorReason$1;
function init_LldbRetainedObservations() {
	return (init_LldbRetainedObservations = __esmMin((() => {
		init_nativeCallObservation();
		LLDB_OBSERVATION_JOURNAL_MAX_BYTES = 8 * 1024 * 1024;
		MAX_CAPTURE_BYTES = 1024 * 1024;
		projectLldbPartialObservation = (input) => ({
			kind: "native-call-observation",
			target: input.target,
			process: {
				pid: input.pid ?? null,
				stdout: input.stdout,
				stderr: input.stderr,
				other_stops: input.journal.otherStops
			},
			debugger: { version: input.version },
			events: input.journal.events,
			coverage: {
				status: "partial",
				reason: input.reason
			},
			limitations: [
				"The LLDB run did not produce a complete native call observation result.",
				"The target SHA-256 identifies the selected artifact; LLDB did not verify the bytes loaded into the process.",
				"Captured output byte counts are observed lower bounds because LLDB did not report final stream counters.",
				...input.journal.limitations,
				...input.journalLimitations ?? [],
				...input.limitations ?? [],
				...input.pid === undefined ? ["The target PID was unavailable."] : [],
				...input.stdout === null ? ["The target stdout capture was unavailable."] : [],
				...input.stderr === null ? ["The target stderr capture was unavailable."] : []
			]
		});
		parseLldbObservationJournal = (bytes) => {
			const hasTornTail = bytes.length > 0 && bytes[bytes.length - 1] !== 10;
			const events = [];
			const otherStops = [];
			const limitations = [];
			const decoder = new TextDecoder("utf-8", {
				fatal: true,
				ignoreBOM: true
			});
			let malformedCount = 0;
			let firstMalformedRow;
			let start = 0;
			let rowNumber = 0;
			while (start < bytes.length) {
				const end = bytes.indexOf(10, start);
				if (end < 0) break;
				const line = bytes.subarray(start, end);
				start = end + 1;
				if (line.length === 0) continue;
				rowNumber += 1;
				const markMalformed = () => {
					malformedCount += 1;
					firstMalformedRow ??= rowNumber;
				};
				let row;
				try {
					row = JSON.parse(decoder.decode(line));
				} catch {
					markMalformed();
					continue;
				}
				if (typeof row !== "object" || row === null || !("kind" in row) || typeof row.kind !== "string") {
					markMalformed();
					continue;
				}
				if (row.kind === "event" && "event" in row) {
					const event = nativeCallEventSchema.safeParse(row.event);
					if (event.success) events.push(event.data);
					else markMalformed();
				} else if (row.kind === "other-stop" && "reason" in row && typeof row.reason === "string") {
					otherStops.push(row.reason);
				} else {
					markMalformed();
				}
			}
			if (malformedCount > 0) limitations.push(`${malformedCount} observation journal row(s) were malformed or invalid and ignored (first at row ${String(firstMalformedRow)}).`);
			if (hasTornTail) limitations.push("The final observation journal record was incomplete and was ignored.");
			return {
				events,
				otherStops,
				limitations
			};
		};
		readBoundedPrefix = async (requestedBytes, readChunk) => {
			const buffer = Buffer.alloc(requestedBytes);
			let bytesRead = 0;
			while (bytesRead < requestedBytes) {
				let count;
				try {
					count = await readChunk(buffer, bytesRead, requestedBytes - bytesRead, bytesRead);
				} catch (cause) {
					return {
						status: "read-failure",
						buffer,
						bytesRead,
						cause
					};
				}
				if (count === 0) break;
				if (count > requestedBytes - bytesRead) throw new Error("The bounded read returned more bytes than requested");
				bytesRead += count;
			}
			return {
				status: bytesRead < requestedBytes ? "eof" : "complete",
				buffer,
				bytesRead
			};
		};
		readPrefix = (handle, requestedBytes) => readBoundedPrefix(requestedBytes, async (buffer, offset, length, position) => (await handle.read(buffer, offset, length, position)).bytesRead);
		readLldbObservationJournal = (path, files) => files.read(path, async (handle) => {
			const { size } = await handle.stat();
			const length = Math.min(size, LLDB_OBSERVATION_JOURNAL_MAX_BYTES);
			const read = await readPrefix(handle, length);
			const { buffer, bytesRead } = read;
			if (read.status === "read-failure" && bytesRead === 0) throw read.cause;
			const value = {
				parsed: parseLldbObservationJournal(buffer.subarray(0, bytesRead)),
				limitations: [
					...size > 8388608 ? ["The observation journal exceeded 8388608 bytes (8 MiB); only its bounded prefix was read. This release has no runtime override."] : [],
					...read.status === "eof" ? ["The observation journal became shorter while being read; the available prefix was parsed."] : [],
					...read.status === "read-failure" ? [`The observation journal read failed after ${String(bytesRead)} bytes: ${errorReason$1(read.cause)}`] : []
				]
			};
			return read.status === "read-failure" ? {
				...value,
				status: read.status,
				readFailure: read.cause
			} : {
				...value,
				status: read.status
			};
		});
		readPartialCapture = (path, files) => files.read(path, async (handle) => {
			const { size } = await handle.stat();
			const length = Math.min(size, MAX_CAPTURE_BYTES);
			const read = await readPrefix(handle, length);
			const { buffer, bytesRead } = read;
			if (read.status === "read-failure" && bytesRead === 0) throw read.cause;
			const value = {
				capture: {
					text: buffer.subarray(0, bytesRead).toString("utf8"),
					bytes: Math.max(size, bytesRead),
					truncated: true,
					complete: false
				},
				limitations: [...read.status === "eof" ? ["A target output capture became shorter while being read; its retained prefix may be incomplete."] : [], ...read.status === "read-failure" ? [`A target output capture read failed after ${String(bytesRead)} bytes: ${errorReason$1(read.cause)}`] : []]
			};
			return read.status === "read-failure" ? {
				...value,
				status: read.status,
				readFailure: read.cause
			} : {
				...value,
				status: read.status
			};
		});
		errorReason$1 = (cause) => cause instanceof Error ? cause.message : String(cause);
	})))();
}

//#endregion
//#region dist/native/LldbCallTracer.js
var OPERATION, PROVIDER, LLDB_REQUIREMENT, MAX_OUTPUT_BYTES, DEADLINE_GRACE_MS, DIAGNOSTIC_BYTES, lldbGraceRecovery, BRIDGE, tracedSchema, tracerOutputSchema, ATTACH_REMEDIATION, LldbCallTracer, quote, tracerFailure, retainPartialReadFailures, partialNativeObservation, partialObservationFromTrace, lldbRuntimePaths, readTracerOutput, capturedOutput, errorReason, lldbPreparationFailure, releaseLldbRuntime, bindLldbCleanup, lldbCleanupFailure, lldbCleanupResources, runLldb, ensureTerminated, targetTerminationReason, alive;
function init_LldbCallTracer() {
	return (init_LldbCallTracer = __esmMin((() => {
		init_NativeCommandAnalysisError();
		init_nativeDeadlines();
		init_snapshotEnvironment();
		init_analysisErrorCore();
		init_evidenceErrors();
		init_analysisErrorProjection();
		init_nativeCallObservation();
		init_providerAdapterError();
		init_providerCleanupError();
		init_result();
		init_safeJson();
		init_ProviderProcess();
		init_ProcessOwnership();
		init_ProcessOwnershipObservation();
		init_ProviderDeadline();
		init_DarwinProcessRunTokenReader();
		init_PrivateRuntimeRoot();
		init_CommandRunner();
		init_NativeCallObservation();
		init_LldbReadbackFiles();
		init_AnalysisCleanupLease();
		init_analysisErrorCleanup();
		init_analysisErrorBase();
		init_LldbRetainedObservations();
		OPERATION = "observe_native_calls";
		PROVIDER = "native-macos";
		LLDB_REQUIREMENT = "LLDB from Xcode or the Command Line Tools is not available";
		MAX_OUTPUT_BYTES = 1024 * 1024;
		DEADLINE_GRACE_MS = 6e4;
		DIAGNOSTIC_BYTES = 16 * 1024;
		lldbGraceRecovery = (durationMs) => {
			const total = durationMs + DEADLINE_GRACE_MS;
			return {
				userMessage: `observe_native_calls reached its ${String(total)} ms server/provider deadline: duration_ms ${String(durationMs)} plus a fixed ${String(DEADLINE_GRACE_MS)} ms LLDB startup, symbol loading, and teardown grace. This is not the MCP client deadline.`,
				remediationAction: `This release has no runtime override for the ${String(DEADLINE_GRACE_MS)} ms grace. Increase duration_ms on the next call when the observation window was too short; the grace stays added to that window. Captured output beyond ${String(MAX_OUTPUT_BYTES)} bytes per stream is counted and not kept, and that byte allowance has no runtime override. Failure diagnostics keep at most ${String(DIAGNOSTIC_BYTES)} bytes and that excerpt has no runtime override. Allow execution, cleanup, and delivery headroom in the outer MCP client deadline. Confirm the owned process was killed and cleanup finished before retrying.`
			};
		};
		BRIDGE = fileURLToPath(new URL("../../bridge/native/rea_lldb_tracer.py", new URL("../native/LldbCallTracer.js", import.meta.url).href));
		tracedSchema = z.strictObject({
			status: z.literal("traced"),
			version: z.string(),
			pid: z.int().positive(),
			outcome: nativeCallProcessOutcomeSchema,
			exit_status: z.int().nullable(),
			exit_description: z.string().nullable(),
			killed: z.boolean(),
			terminated: z.boolean(),
			target_identity: z.strictObject({
				loaded_image_sha256: z.null(),
				selected_file_sha256: z.string().regex(/^[0-9a-f]{64}$/u).nullable(),
				file_device: z.string().nullable(),
				file_inode: z.string().nullable(),
				module_path: z.string().nullable(),
				module_uuid: z.string().nullable(),
				stable: z.boolean()
			}),
			resource_limit_reached: z.boolean(),
			breakpoint_locations_truncated: z.boolean().optional(),
			target_output: z.strictObject({
				stdout_bytes: z.int().nonnegative(),
				stderr_bytes: z.int().nonnegative(),
				stdout_truncated: z.boolean(),
				stderr_truncated: z.boolean(),
				stdout_complete: z.boolean(),
				stderr_complete: z.boolean()
			}),
			elapsed_ms: z.number().nonnegative(),
			breakpoints: z.array(z.strictObject({
				index: z.int().nonnegative(),
				location_count: z.int().nonnegative(),
				locations: z.array(nativeCodeLocationSchema)
			})),
			events: z.array(nativeCallEventSchema),
			other_stops: z.array(z.string())
		});
		tracerOutputSchema = z.discriminatedUnion("status", [tracedSchema, z.strictObject({
			status: z.enum([
				"target-error",
				"target-integrity-error",
				"target-identity-unavailable",
				"launch-error",
				"tracer-error"
			]),
			error: z.string().nullable(),
			target_process_created: z.boolean().optional(),
			target_process_exit_observed: z.boolean().optional()
		})]);
		ATTACH_REMEDIATION = "Allow debugging for this user (Developer Tools access: `DevToolsSecurity -enable`, or membership in the _developer group). A hardened-runtime target is debuggable only with the com.apple.security.get-task-allow entitlement; inspect_signature reports hardened_runtime and entitlements.";
		LldbCallTracer = class {
			launch;
			resolveTool;
			environment;
			#tail = Promise.resolve();
			#pendingCleanup;
			/** Resolver supervisors owned by this tracer, distinct from the shared Darwin reader. */
			#resolverCleanup = new Map();
			constructor(environment, launch = runLldb, resolveTool = (tool, signal) => resolveXcrunTool(tool, this.environment, signal)) {
				this.launch = launch;
				this.resolveTool = resolveTool;
				this.environment = snapshotEnvironment(environment);
			}
			async trace(request, signal) {
				return this.#serialize(() => this.#trace(request, signal));
			}
			async #trace(request, signal) {
				const resolverCleanup = await this.#retryResolverCleanup();
				if (resolverCleanup !== undefined) return err(resolverCleanup);
				const pendingCleanup = await this.#retryPendingCleanup();
				if (pendingCleanup !== undefined) return err(pendingCleanup);
				const lldb = await this.resolveTool("lldb", signal);
				if (!lldb.ok) return err(this.#discoveryFailure(lldb.error));
				const root = await PrivateRuntimeRoot.create({ prefix: "rea-lldb-" });
				const paths = lldbRuntimePaths(root.path);
				const owner = {
					root,
					rootLease: new AnalysisCleanupLease(() => root.close(), [root.path]),
					files: new LldbReadbackFiles(),
					supervisor: undefined,
					pidPath: paths.pid,
					targetIdentity: undefined,
					targetPid: undefined,
					processStopped: true,
					targetStopped: true
				};
				let result;
				try {
					result = await this.#run(lldb.value, owner, request, signal);
				} catch (cause) {
					const partial = await partialNativeObservation({
						request,
						files: owner.files,
						pidPath: paths.pid,
						stdoutPath: paths.stdoutCapture,
						stderrPath: paths.stderrCapture,
						observationPath: paths.observations,
						version: null,
						reason: "tracer-failure"
					});
					if (!owner.processStopped || !owner.targetStopped || owner.files.hasPending) this.#pendingCleanup = owner;
					const failure = new ProviderAdapterError(PROVIDER, OPERATION, {
						cause,
						diagnostics: { reason: errorReason(cause) },
						partialObservation: partial.observation,
						...this.#pendingCleanup === owner ? { cleanup: {
							reason: "LLDB trace failed while owned resources remain",
							resources: lldbCleanupResources(owner)
						} } : {}
					});
					result = err(retainPartialReadFailures(failure, partial.readFailures));
				}
				if (result.ok && signal?.aborted) result = err(new AnalysisCancelledError(OPERATION, {
					cause: signal.reason,
					partialObservation: partialObservationFromTrace(request, result.value, "cancelled")
				}));
				if (owner.files.hasPending) this.#pendingCleanup = owner;
				if (this.#pendingCleanup === owner) {
					if (!result.ok && result.error.cleanupIncomplete) {
						if (owner.files.hasPending) {
							const files = lldbCleanupFailure(owner, "LLDB readback descriptor cleanup remains incomplete", owner.files.cleanupCause);
							result.error.retainSecondaryFailure(files, { readback_cleanup: projectAnalysisError(files) });
						}
						return err(bindLldbCleanup(result.error, owner));
					}
					const cleanup = lldbCleanupFailure(owner, "LLDB readback descriptor cleanup remains incomplete", owner.files.cleanupCause, result.ok ? partialObservationFromTrace(request, result.value) : undefined);
					return result.ok ? err(cleanup) : err(analysisErrorWithCleanupFailure(result.error, cleanup, OPERATION).bindCleanupDependencies([result.error, cleanup]));
				}
				let rootCleanup;
				try {
					await releaseLldbRuntime(owner);
					rootCleanup = ok(undefined);
				} catch (cause) {
					rootCleanup = err(cause);
					this.#pendingCleanup = owner;
				}
				if (result.ok && signal?.aborted) result = err(new AnalysisCancelledError(OPERATION, {
					cause: signal.reason,
					partialObservation: partialObservationFromTrace(request, result.value, "cancelled")
				}));
				if (!rootCleanup.ok) {
					const cleanup = lldbCleanupFailure(owner, errorReason(rootCleanup.error), rootCleanup.error, result.ok ? partialObservationFromTrace(request, result.value) : undefined);
					if (!result.ok && result.error.cleanupIncomplete) bindLldbCleanup(result.error, owner);
					return result.ok ? err(cleanup) : err(analysisErrorWithCleanupFailure(result.error, cleanup, OPERATION).bindCleanupDependencies([result.error, cleanup]));
				}
				return result.ok ? result : err(resolvedAnalysisError(bindLldbCleanup(result.error, owner)));
			}
			/** Retry retained LLDB cleanup without abandoning its process or runtime owner. */
			async close() {
				return this.#serialize(() => this.#close());
			}
			async #close() {
				const resolverCleanup = await this.#retryResolverCleanup();
				const failure = await this.#retryPendingCleanup();
				if (resolverCleanup !== undefined && failure !== undefined) return err(analysisErrorWithCleanupFailure(resolverCleanup, failure, OPERATION).bindCleanupDependencies([resolverCleanup, failure]));
				if (resolverCleanup !== undefined) return err(resolverCleanup);
				return failure === undefined ? ok(null) : err(failure);
			}
			#serialize(operation) {
				const call = this.#tail.then(operation, operation);
				this.#tail = call.then(() => undefined, () => undefined);
				return call;
			}
			async #retryPendingCleanup() {
				const owner = this.#pendingCleanup;
				if (owner === undefined) return undefined;
				const failures = [];
				try {
					await owner.files.retryCleanup();
				} catch (cause) {
					failures.push(cause);
				}
				if (!owner.processStopped) {
					if (owner.supervisor === undefined) failures.push(new Error("LLDB process cleanup ownership was unavailable"));
					else {
						try {
							const stopped = await owner.supervisor.stop();
							if (stopped.status === "incomplete") failures.push(new Error(stopped.reason));
							else {
								owner.supervisor.dispose();
								owner.processStopped = true;
							}
						} catch (cause) {
							failures.push(cause);
						}
					}
				}
				if (owner.processStopped && !owner.targetStopped) {
					owner.targetPid = await owner.files.readTargetPid(owner.pidPath);
					try {
						const targetTermination = await ensureTerminated(owner.targetPid, owner.targetIdentity);
						if (targetTermination !== "terminated") failures.push(new Error(targetTerminationReason(targetTermination)));
						else owner.targetStopped = true;
					} catch (cause) {
						failures.push(cause);
					}
				}
				if (failures.length === 0) {
					try {
						await releaseLldbRuntime(owner);
						this.#pendingCleanup = undefined;
						return undefined;
					} catch (cause) {
						failures.push(cause);
					}
				}
				return lldbCleanupFailure(owner, failures.map(errorReason).join("; "), new AggregateError(failures, "LLDB cleanup remains incomplete"));
			}
			/**
			* Keep a tracer-owned resolver process for retry. A foreign helper marker
			* stays on the preparation error and is not adopted here.
			*/
			#retainResolverCleanup(failure) {
				const owned = [...failure.cleanupFailures.map((entry) => ({
					owner: entry.owner,
					marker: entry.marker,
					reason: entry.reason,
					resources: entry.resources
				})), ...failure.cleanupOwner === undefined ? [] : [{
					owner: failure.cleanupOwner,
					marker: failure.cleanupMarker,
					reason: failure.cleanupFailure ?? "LLDB resolver cleanup remains incomplete",
					resources: [...failure.cleanupResources]
				}]];
				for (const entry of owned) {
					if (this.#resolverCleanup.has(entry.owner)) continue;
					const marker = entry.marker ?? new ProviderCleanupError(PROVIDER, entry.resources.length > 0 ? entry.resources : ["lldb-resolver-process"], { reason: entry.reason }, {
						operation: OPERATION,
						cause: failure
					});
					this.#resolverCleanup.set(entry.owner, marker);
				}
			}
			#discoveryFailure(failure) {
				this.#retainResolverCleanup(failure);
				const markers = [...new Set([failure.cleanupOwner, ...failure.cleanupFailures.map((entry) => entry.owner)].flatMap((owner) => {
					if (owner === undefined) return [];
					const marker = this.#resolverCleanup.get(owner);
					return marker === undefined ? [] : [marker];
				}))];
				const error = translateNativeCommandFailure(OPERATION, failure, DEFAULT_NATIVE_COMMAND_TIMEOUT_MS, {
					unavailableMessage: LLDB_REQUIREMENT,
					timeoutRecovery: {
						userMessage: `LLDB discovery reached REA's ${String(DEFAULT_NATIVE_COMMAND_TIMEOUT_MS)}ms xcrun deadline. This is not the client deadline.`,
						remediationAction: "Inspect the retained discovery output and cleanup state, then resolve the xcrun/toolchain condition before retrying. This LLDB discovery deadline has no runtime override; duration_ms controls the later target observation window."
					}
				});
				return markers.length === 0 ? error : error.bindCleanupDependencies(markers);
			}
			/** Retry only resolver processes this tracer spawned. */
			async #retryResolverCleanup() {
				const retained = [...this.#resolverCleanup];
				if (retained.length === 0) return undefined;
				const unresolved = [];
				for (const [owner, marker] of retained) {
					let released = false;
					try {
						const stopped = await owner.stop();
						released = stopped.status !== "incomplete" && stopped.status !== "not-owned";
					} catch {
						released = false;
					}
					if (!released) {
						unresolved.push(marker);
						continue;
					}
					marker.resolveCleanup();
					this.#resolverCleanup.delete(owner);
				}
				if (unresolved.length === 0) return undefined;
				if (unresolved.length === 1) return unresolved[0];
				return new ProviderCleanupError(PROVIDER, [...new Set(unresolved.flatMap((marker) => marker.cleanupResources))], { reason: "LLDB resolver cleanup remains incomplete" }, {
					operation: OPERATION,
					cause: new AggregateError(unresolved, "LLDB resolver cleanup remains incomplete")
				}).bindCleanupDependencies(unresolved);
			}
			async #run(lldb, retained, request, signal) {
				const directory = retained.root.path;
				const paths = lldbRuntimePaths(directory);
				const { input } = request;
				await writeFile(paths.config, JSON.stringify({
					executable: request.executable,
					architecture: request.architecture,
					expected_sha256: request.expectedSha256,
					arguments: input.arguments,
					environment: input.environment,
					working_directory: input.working_directory ?? null,
					breakpoints: input.breakpoints.map((breakpoint) => breakpoint.kind === "function" ? {
						...breakpoint,
						module: breakpoint.module ?? null
					} : {
						...breakpoint,
						class_name: breakpoint.class_name ?? null
					}),
					duration_ms: input.duration_ms,
					max_events: input.max_events,
					argument_registers: input.argument_registers,
					backtrace_frames: input.backtrace_frames,
					max_output_bytes: MAX_OUTPUT_BYTES,
					stdout_path: paths.stdout,
					stderr_path: paths.stderr,
					stdout_capture_path: paths.stdoutCapture,
					stderr_capture_path: paths.stderrCapture,
					result_path: paths.result,
					pid_path: paths.pid,
					identity_ack_path: paths.identityAck,
					observation_path: paths.observations
				}), { mode: 384 });
				retained.processStopped = false;
				retained.targetStopped = false;
				this.#pendingCleanup = retained;
				const exited = await this.launch(lldb.path, [
					"--batch",
					"--no-lldbinit",
					"--no-use-colors",
					"-o",
					`command script import ${quote(BRIDGE)}`,
					"-o",
					`rea_trace ${paths.config}`
				], {
					deadlineMs: input.duration_ms + DEADLINE_GRACE_MS,
					pidPath: paths.pid,
					identityAckPath: paths.identityAck,
					environment: this.environment,
					files: retained.files,
					...signal === undefined ? {} : { signal }
				});
				if (exited.kind === "preparation-failed") {
					retained.processStopped = true;
					retained.targetStopped = true;
					if (this.#pendingCleanup === retained) this.#pendingCleanup = undefined;
					return err(lldbPreparationFailure(exited.cause));
				}
				retained.supervisor = exited.cleanupOwner;
				retained.targetIdentity = exited.targetIdentity;
				retained.processStopped = exited.cleanupOwner === undefined && exited.cleanupFailure === undefined;
				retained.targetStopped = !exited.targetLaunched;
				const readback = exited.kind === "exited" ? await readTracerOutput(paths.result, retained.files) : undefined;
				const output = readback?.ok ? readback.value : undefined;
				const bridgeObservedExit = output !== undefined && output.status !== "traced" && output.target_process_exit_observed === true;
				retained.targetPid = await retained.files.readTargetPid(paths.pid);
				let targetTermination = exited.targetLaunched && !bridgeObservedExit ? await ensureTerminated(retained.targetPid, exited.targetIdentity) : "terminated";
				if (output !== undefined && output.status !== "traced" && output.target_process_created === false && retained.targetPid === undefined) targetTermination = "terminated";
				retained.targetStopped = targetTermination === "terminated";
				if (retained.processStopped && retained.targetStopped && !retained.files.hasPending) this.#pendingCleanup = undefined;
				const terminated = targetTermination === "terminated";
				const cleanupDetails = [exited.cleanupFailure, ...terminated ? [] : [targetTerminationReason(targetTermination)]].filter((detail) => detail !== undefined);
				const lifecycleCleanup = cleanupDetails.length === 0 ? undefined : {
					reason: cleanupDetails.join("; "),
					resources: lldbCleanupResources(retained)
				};
				const partialReason = exited.kind === "cancelled" ? "cancelled" : exited.kind === "timeout" ? "timeout" : lifecycleCleanup !== undefined ? "cleanup-failure" : "tracer-failure";
				const readCompletedCaptures = async (run) => ({
					stdout: await capturedOutput(paths.stdoutCapture, run.target_output.stdout_bytes, run.target_output.stdout_truncated, run.target_output.stdout_complete, retained.files),
					stderr: await capturedOutput(paths.stderrCapture, run.target_output.stderr_bytes, run.target_output.stderr_truncated, run.target_output.stderr_complete, retained.files)
				});
				const getPartialObservation = async (reason = partialReason) => {
					if (output?.status === "traced") {
						const { stdout, stderr } = await readCompletedCaptures(output);
						return {
							observation: projectPartialNativeCalls({
								path: request.executable,
								sha256: request.expectedSha256,
								architecture: request.architecture
							}, request.input, {
								debugger: {
									...lldb,
									version: output.version
								},
								run: output,
								stdout: stdout.ok ? stdout.value : stdout.partial ?? null,
								stderr: stderr.ok ? stderr.value : stderr.partial ?? null,
								terminated
							}, reason),
							readFailures: [...stdout.ok ? [] : [stdout.error], ...stderr.ok ? [] : [stderr.error]]
						};
					}
					return partialNativeObservation({
						request,
						files: retained.files,
						pidPath: paths.pid,
						stdoutPath: paths.stdoutCapture,
						stderrPath: paths.stderrCapture,
						observationPath: paths.observations,
						version: null,
						reason
					});
				};
				const failureWithPartial = async (createFailure, reason) => {
					const partial = await getPartialObservation(reason);
					return err(retainPartialReadFailures(createFailure(partial.observation), partial.readFailures));
				};
				if (exited.kind === "cancelled") return failureWithPartial((partialObservation) => new AnalysisCancelledError(OPERATION, {
					cause: signal?.reason,
					...lifecycleCleanup === undefined ? {} : { cleanup: lifecycleCleanup },
					partialObservation
				}));
				if (exited.kind === "timeout") return failureWithPartial((partialObservation) => new AnalysisTimeoutError(OPERATION, input.duration_ms + DEADLINE_GRACE_MS, {
					...lifecycleCleanup === undefined ? {} : { cleanup: lifecycleCleanup },
					partialObservation,
					...lldbGraceRecovery(input.duration_ms)
				}));
				if (output !== undefined && output.status !== "traced") return failureWithPartial((partialObservation) => tracerFailure(output, lifecycleCleanup, partialObservation));
				const processCleanupFailure = exited.cleanupFailure;
				if (processCleanupFailure !== undefined) return failureWithPartial((partialObservation) => new ProviderCleanupError(PROVIDER, lldbCleanupResources(retained), {
					reason: "LLDB process-group cleanup could not be verified",
					cleanup_failure: processCleanupFailure,
					...lifecycleCleanup === undefined ? {} : { target_cleanup: lifecycleCleanup }
				}, {
					operation: OPERATION,
					partialObservation
				}));
				if (!terminated) return failureWithPartial((partialObservation) => new ProviderCleanupError(PROVIDER, lldbCleanupResources(retained), {
					reason: "LLDB target process termination could not be verified",
					...lifecycleCleanup === undefined ? {} : { target_cleanup: lifecycleCleanup }
				}, {
					operation: OPERATION,
					partialObservation
				}));
				if (output === undefined) return failureWithPartial((partialObservation) => new ProviderAdapterError(PROVIDER, OPERATION, {
					...readback !== undefined && !readback.ok ? { cause: readback.error } : {},
					diagnostics: {
						reason: "LLDB exited without a usable tracer result",
						...readback !== undefined && !readback.ok ? { result_failure: readback.error instanceof z.ZodError ? `Tracer result failed schema validation (${readback.error.issues.length} issues)` : readback.error instanceof Error ? readback.error.message : String(readback.error) } : {},
						exit_code: exited.exitCode,
						lldb_output: exited.output,
						...lifecycleCleanup === undefined ? {} : { target_cleanup: lifecycleCleanup }
					},
					partialObservation,
					...lifecycleCleanup === undefined ? {} : { cleanup: lifecycleCleanup }
				}));
				const { stdout, stderr } = await readCompletedCaptures(output);
				if (!stdout.ok || !stderr.ok) {
					return err(new ProviderAdapterError(PROVIDER, OPERATION, {
						cause: new AggregateError([...stdout.ok ? [] : [stdout.error], ...stderr.ok ? [] : [stderr.error]], "LLDB capture readback failed"),
						partialObservation: projectPartialNativeCalls({
							path: request.executable,
							sha256: request.expectedSha256,
							architecture: request.architecture
						}, request.input, {
							debugger: {
								...lldb,
								version: output.version
							},
							run: output,
							stdout: stdout.ok ? stdout.value : stdout.partial ?? null,
							stderr: stderr.ok ? stderr.value : stderr.partial ?? null,
							terminated
						}, "capture-failure"),
						diagnostics: {
							reason: "LLDB target output capture could not be read",
							...stdout.ok ? {} : { stdout_capture_error: errorReason(stdout.error) },
							...stderr.ok ? {} : { stderr_capture_error: errorReason(stderr.error) },
							...lifecycleCleanup === undefined ? {} : { target_cleanup: lifecycleCleanup }
						},
						...lifecycleCleanup === undefined ? {} : { cleanup: lifecycleCleanup }
					}));
				}
				const trace = {
					debugger: {
						...lldb,
						version: output.version
					},
					run: output,
					stdout: stdout.value,
					stderr: stderr.value,
					terminated
				};
				if (exited.lateTimeout === true) return err(new AnalysisTimeoutError(OPERATION, input.duration_ms + DEADLINE_GRACE_MS, {
					partialObservation: partialObservationFromTrace(request, trace, "timeout"),
					...lldbGraceRecovery(input.duration_ms)
				}));
				return ok(trace);
			}
		};
		quote = (value) => `"${value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`;
		tracerFailure = (output, cleanup, partialObservation) => {
			const options = {
				...cleanup === undefined ? {} : { cleanup },
				...partialObservation === undefined ? {} : { partialObservation }
			};
			const message = output.error ?? "no LLDB error text";
			if (output.status === "target-integrity-error") return new EvidenceIntegrityError(message || "The launched native target did not match its session digest", options);
			if (output.status === "target-identity-unavailable") return new ProviderAdapterError(PROVIDER, OPERATION, {
				...options,
				diagnostics: {
					reason: message,
					constraint: "target process start identity could not be verified"
				}
			});
			if (output.status === "tracer-error") return new ProviderAdapterError(PROVIDER, OPERATION, {
				...options,
				diagnostics: { reason: `LLDB bridge failed: ${message}` }
			});
			if (output.status === "target-error") return new AnalysisCapabilityUnavailableError(PROVIDER, OPERATION, `lldb-target-unloadable: ${message}`, options);
			return /attach|not allowed|permission|denied|debugserver/iu.test(message) ? new AnalysisCapabilityUnavailableError(PROVIDER, OPERATION, `debugger-attach-denied: ${message}`, {
				userMessage: ATTACH_REMEDIATION,
				...options
			}) : new AnalysisCapabilityUnavailableError(PROVIDER, OPERATION, `launch-failed: ${message}`, options);
		};
		retainPartialReadFailures = (failure, readFailures) => {
			if (readFailures.length === 0) return failure;
			const readbackFailure = new ProviderAdapterError(PROVIDER, OPERATION, {
				cause: readFailures.length === 1 ? readFailures[0] : new AggregateError(readFailures, "LLDB partial readback failed"),
				diagnostics: {
					reason: "LLDB could not read all available partial observation data",
					read_failures: readFailures.map(errorReason)
				}
			});
			return failure.retainSecondaryFailure(readbackFailure, { partial_readback_failure: projectAnalysisError(readbackFailure) });
		};
		partialNativeObservation = async (options) => {
			const [journal, pid, stdout, stderr] = await Promise.all([
				readLldbObservationJournal(options.observationPath, options.files),
				options.files.readTargetPid(options.pidPath),
				readPartialCapture(options.stdoutPath, options.files),
				readPartialCapture(options.stderrPath, options.files)
			]);
			const observation = projectLldbPartialObservation({
				target: {
					path: options.request.executable,
					sha256: options.request.expectedSha256,
					architecture: options.request.architecture,
					arguments: options.request.input.arguments,
					environment: options.request.input.environment,
					working_directory: options.request.input.working_directory ?? null
				},
				pid,
				stdout: stdout.ok ? stdout.value.capture : null,
				stderr: stderr.ok ? stderr.value.capture : null,
				version: options.version,
				journal: journal.ok ? journal.value.parsed : {
					events: [],
					otherStops: [],
					limitations: []
				},
				journalLimitations: journal.ok ? journal.value.limitations : [`The observation journal could not be read: ${errorReason(journal.error)}`],
				limitations: [...stdout.ok ? stdout.value.limitations : [`The target stdout capture could not be read: ${errorReason(stdout.error)}`], ...stderr.ok ? stderr.value.limitations : [`The target stderr capture could not be read: ${errorReason(stderr.error)}`]],
				reason: options.reason
			});
			const readFailures = [
				journal,
				stdout,
				stderr
			].flatMap((read) => !read.ok ? [read.error] : read.value.status === "read-failure" ? [read.value.readFailure] : []);
			return {
				observation,
				readFailures
			};
		};
		partialObservationFromTrace = (request, trace, reason = "cleanup-failure") => {
			return projectPartialNativeCalls({
				path: request.executable,
				sha256: request.expectedSha256,
				architecture: request.architecture
			}, request.input, trace, reason);
		};
		lldbRuntimePaths = (directory) => ({
			config: join(directory, "config.json"),
			result: join(directory, "result.json"),
			pid: join(directory, "pid"),
			identityAck: join(directory, "identity.ack"),
			stdout: join(directory, "stdout"),
			stderr: join(directory, "stderr"),
			stdoutCapture: join(directory, "stdout.capture"),
			stderrCapture: join(directory, "stderr.capture"),
			observations: join(directory, "observations.jsonl")
		});
		readTracerOutput = async (path, files) => {
			const bytes = await files.read(path, (file) => file.readFile());
			if (!bytes.ok) return bytes;
			let text;
			try {
				text = new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				}).decode(bytes.value);
			} catch (cause) {
				return err(cause);
			}
			const parsed = safeParseJson(text);
			if (!parsed.ok) return err(parsed.cause);
			const output = tracerOutputSchema.safeParse(parsed.value);
			return output.success ? ok(output.data) : err(output.error);
		};
		capturedOutput = async (path, observedBytes, truncated, complete, files) => {
			const readback = await files.read(path, async (handle) => {
				const { size } = await handle.stat();
				const read = await readBoundedPrefix(Math.min(size, MAX_OUTPUT_BYTES), async (target, offset, length, position) => (await handle.read(target, offset, length, position)).bytesRead);
				const { buffer, bytesRead } = read;
				if (read.status === "read-failure" && bytesRead === 0) throw read.cause;
				return {
					status: read.status,
					capture: {
						text: buffer.subarray(0, bytesRead).toString("utf8"),
						bytes: observedBytes,
						truncated: truncated || size > MAX_OUTPUT_BYTES || read.status === "read-failure",
						complete: read.status !== "read-failure" && complete && bytesRead >= Math.min(observedBytes, MAX_OUTPUT_BYTES)
					},
					...read.status === "read-failure" ? { readFailure: read.cause } : {}
				};
			});
			if (!readback.ok) return readback;
			if (readback.value.status === "read-failure") return {
				ok: false,
				error: readback.value.readFailure,
				partial: readback.value.capture
			};
			return ok(readback.value.capture);
		};
		errorReason = (cause) => cause instanceof Error ? cause.message : String(cause);
		lldbPreparationFailure = (cause) => {
			const marker = cause.cleanupFailure;
			const compiler = cause.compilerOutcome;
			const options = {
				cause,
				...cause.capturedOutput === undefined ? {} : { capturedOutput: cause.capturedOutput },
				...marker === undefined ? {} : { cleanup: {
					reason: marker.message,
					resources: [...marker.cleanupResources]
				} },
				diagnostics: {
					phase: "process-preparation",
					tool: "lldb",
					reason: cause.message,
					...compiler === undefined ? {} : { compiler_outcome: {
						outcome: compiler.outcome,
						code: compiler.code,
						signal: compiler.signal,
						...compiler.timeoutMs === undefined ? {} : { timeout_ms: compiler.timeoutMs }
					} }
				}
			};
			const error = cause.cancellation === undefined ? new ProviderAdapterError(PROVIDER, OPERATION, options) : new AnalysisCancelledError(OPERATION, {
				...options,
				cause: cause.cancellation.reason
			});
			return marker === undefined ? error : error.bindCleanupDependencies([marker]);
		};
		releaseLldbRuntime = async (owner) => {
			if (!owner.processStopped || !owner.targetStopped || owner.files.hasPending) throw new Error("LLDB runtime still owns unresolved child resources");
			await owner.rootLease.release();
		};
		bindLldbCleanup = (failure, owner) => {
			if (failure.cleanupIncomplete) {
				owner.rootLease.bindCleanupError(failure);
				failure.bindCleanupResourceOwner({ get cleanupResources() {
					return lldbCleanupResources(owner);
				} });
			}
			return failure;
		};
		lldbCleanupFailure = (owner, reason, cause, partialObservation) => bindLldbCleanup(new ProviderCleanupError(PROVIDER, lldbCleanupResources(owner), { reason }, {
			operation: OPERATION,
			cause,
			partialObservation
		}), owner);
		lldbCleanupResources = (owner) => [
			...owner.processStopped ? [] : ["lldb-process-group"],
			...owner.targetStopped ? [] : [`native-target:${String(owner.targetPid ?? "unknown")}`],
			...owner.files.cleanupResources,
			...owner.rootLease.released ? [] : [owner.root.path]
		];
		runLldb = async (executable, arguments_, options) => {
			if (options.signal?.aborted === true) return {
				kind: "cancelled",
				targetLaunched: false,
				targetIdentity: undefined,
				cleanupFailure: undefined
			};
			const deadline = new ProviderStartupDeadline(options.deadlineMs, options.signal);
			let targetIdentity;
			let supervisor;
			let retained = false;
			let processFailureBeforeInterruption;
			const finish = async (outcome) => {
				const selectedOutcome = outcome.kind !== "exited" && processFailureBeforeInterruption !== undefined ? {
					kind: "exited",
					...processFailureBeforeInterruption
				} : outcome;
				const stopped = await supervisor?.stop();
				retained = stopped?.status === "incomplete";
				const lateTimeout = selectedOutcome.kind === "exited" && deadline.interruption === "timeout" ? true : undefined;
				return {
					...selectedOutcome,
					targetLaunched: supervisor !== undefined,
					targetIdentity,
					cleanupFailure: stopped?.status === "incomplete" ? stopped.reason : undefined,
					...lateTimeout === undefined ? {} : { lateTimeout },
					...retained && supervisor !== undefined ? { cleanupOwner: supervisor } : {}
				};
			};
			try {
				const launched = await spawnOwnedProviderProcess({
					command: executable,
					arguments: arguments_,
					runId: randomUUID(),
					expectedCommand: executable,
					signal: deadline.signal,
					hostEnvironment: options.environment
				});
				supervisor = new ProviderProcessSupervisor({
					...launched,
					ownsProcessLifetime: true,
					cleanup: () => cleanupOwnedProcessGroup(launched.ownership)
				}, {
					maxDiagnosticBytes: DIAGNOSTIC_BYTES,
					onDiagnostic: (event) => {
						if (event.type === "exit" && deadline.interruption === undefined && (event.signal !== null || event.code !== null && event.code !== 0)) processFailureBeforeInterruption ??= {
							exitCode: event.code,
							output: `${event.snapshot.stdout.text}${event.snapshot.stderr.text}`.slice(-DIAGNOSTIC_BYTES)
						};
					}
				});
				let identityAckWritten = false;
				while (!await supervisor.waitForOutputClose(20)) {
					const pid = await options.files.readTargetPid(options.pidPath);
					if (pid !== undefined && !identityAckWritten) {
						let observation;
						try {
							observation = await observeProcessStartIdentity(pid);
						} catch {
							observation = undefined;
						}
						if (observation?.state === "readable") targetIdentity = observation.identity;
						await writeFile(options.identityAckPath, observation?.state === "readable" ? "readable" : "unavailable", { mode: 384 });
						identityAckWritten = true;
					}
					const interruption = deadline.interruption;
					if (interruption !== undefined) {
						return await finish({ kind: interruption });
					}
					await waitForAbortableDelay(20, deadline.signal);
				}
				const snapshot = supervisor.snapshot();
				const interruption = deadline.interruption;
				return await finish(interruption === undefined || supervisor.observedExit() !== undefined ? {
					kind: "exited",
					exitCode: snapshot.exitCode ?? null,
					output: `${snapshot.stdout.text}${snapshot.stderr.text}`.slice(-DIAGNOSTIC_BYTES)
				} : { kind: interruption });
			} catch (cause) {
				if (supervisor === undefined && cause instanceof DarwinProcessOwnershipInspectionError) {
					return {
						kind: "preparation-failed",
						cause,
						targetLaunched: false,
						targetIdentity: undefined,
						cleanupFailure: undefined
					};
				}
				const interruption = deadline.interruption;
				return await finish(interruption === undefined ? {
					kind: "exited",
					exitCode: null,
					output: cause instanceof Error ? cause.message : String(cause)
				} : { kind: interruption });
			} finally {
				if (!retained) supervisor?.dispose();
				deadline.dispose();
			}
		};
		ensureTerminated = async (pid, identity) => {
			if (pid === undefined) return "identity-unavailable";
			let signalDisposition;
			for (let attempt = 0; attempt < 20; attempt++) {
				if (!alive(pid)) return "terminated";
				if (attempt === 10) {
					if (identity === undefined) signalDisposition = "identity-unavailable";
					else {
						const result = await signalProcessWithStartIdentity(pid, identity, "SIGKILL");
						if (result === "gone") return "terminated";
						if (result === "identity-changed") signalDisposition = "identity-changed";
						else if (result === "unverified") signalDisposition = "identity-unavailable";
						else if (result === "signaled") signalDisposition = "signal-did-not-stop";
					}
				}
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
			return !alive(pid) ? "terminated" : signalDisposition ?? "identity-unavailable";
		};
		targetTerminationReason = (termination) => {
			switch (termination) {
				case "terminated": return "target process terminated";
				case "identity-unavailable": return "target process start identity was unavailable; survivor was left untouched";
				case "identity-changed": return "target PID start identity changed; replacement process was left untouched";
				case "signal-did-not-stop": return "verified target did not exit after SIGKILL";
			}
		};
		alive = (pid) => {
			try {
				process.kill(pid, 0);
				return true;
			} catch (cause) {
				return !(cause instanceof Error && "code" in cause && cause.code === "ESRCH");
			}
		};
	})))();
}

//#endregion
//#region dist/native/SignatureTargetBinding.js
var identity, changedTarget, signatureReadFailure, withSignatureTarget, combineCleanupFailure, signatureCleanupFailure, snapshotFailure, snapshotIO, copySignatureBytes, bindSignatureTarget, verifySignatureTarget;
function init_SignatureTargetBinding() {
	return (init_SignatureTargetBinding = __esmMin((() => {
		init_RegularFile();
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_providerAdapterError();
		init_providerCleanupError();
		init_analysisErrorCleanup();
		init_result();
		init_OwnedFileHandle();
		init_ArtifactResourceScope();
		init_PrivateRuntimeRoot();
		init_ArtifactReader();
		init_AnalysisCleanupLease();
		init_ArtifactFileOperation();
		init_NativeMacOSProviderMetadata();
		identity = (stat) => [
			stat.dev,
			stat.ino,
			stat.size,
			stat.mtimeNs,
			stat.ctimeNs
		].join(":");
		changedTarget = (target, reason) => err(new AnalysisArtifactChangedError("inspect_signature", target.path, reason));
		signatureReadFailure = (target, cause) => {
			if (cause instanceof RegularFileOperationCancelled) return new AnalysisCancelledError("inspect_signature", { cause: cause.reason });
			if (cause instanceof AnalysisError) return cause;
			const code = cause instanceof Error && "code" in cause ? cause.code : undefined;
			if (code === "EACCES" || code === "EPERM") return new AnalysisAccessDeniedError("inspect_signature", target.path, code, { cause });
			if (code === "ENOENT" || code === "ENOTDIR" || code === "ELOOP") return new AnalysisArtifactChangedError("inspect_signature", target.path, `Registered signature target is no longer readable (${code}): ${target.path}`, { cause });
			return new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_signature", {
				cause,
				diagnostics: {
					path: target.path,
					phase: "target-version-binding",
					system_code: typeof code === "string" ? code : null,
					reason: cause instanceof Error ? cause.message : String(cause)
				}
			});
		};
		withSignatureTarget = async (target, resources, inspect, signal, createRoot = () => PrivateRuntimeRoot.create({ prefix: "rea-signature-" })) => {
			try {
				return await resources.run(async () => {
					let root;
					try {
						assertRegularFileActive(signal);
						root = await createRoot();
					} catch (cause) {
						return err(cause instanceof RegularFileOperationCancelled ? signatureReadFailure(target, cause) : snapshotFailure(target, "create", cause));
					}
					const children = new ArtifactResourceScope();
					const owner = {
						kind: "lease",
						lease: new AnalysisCleanupLease(async () => {
							await children.close();
							await root.close();
						}, { get cleanupResources() {
							return [...children.cleanupResources, root.path];
						} }),
						resource: root.path
					};
					let result;
					try {
						const binding = await bindSignatureTarget(target, join(root.path, basename(target.path)), children, signal);
						if (!binding.ok) result = binding;
						else {
							try {
								result = await inspect(binding.value);
							} catch (cause) {
								result = err(new AnalysisOutputError("inspect_signature", "Native output parsing failed", { cause }));
							}
						}
					} catch (cause) {
						result = err(signatureReadFailure(target, cause));
					}
					const cleanup = await resources.release(owner);
					if (result.ok && signal?.aborted) result = err(new AnalysisCancelledError("inspect_signature", {
						cause: signal.reason,
						partialObservation: result.value
					}));
					if (cleanup.kind === "failed") {
						const failure = signatureCleanupFailure(target, [root.path], cleanup.cause, "cleanup");
						new AnalysisCleanupLeaseGroup(failure, [owner.lease]);
						return combineCleanupFailure(result, failure);
					}
					return result;
				});
			} catch (cause) {
				const retained = cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined ? cause.cleanup : undefined;
				if (retained !== undefined) {
					const failure = signatureCleanupFailure(target, retained.resources, cause, "retry");
					bindArtifactFileCleanup(cause, failure);
					return combineCleanupFailure(err(signatureReadFailure(target, cause)), failure);
				}
				return err(signatureReadFailure(target, cause));
			}
		};
		combineCleanupFailure = (primary, cleanup) => primary.ok ? err(cleanup) : err(analysisErrorWithCleanupFailure(primary.error, cleanup, "inspect_signature").bindCleanupDependencies([primary.error, cleanup]));
		signatureCleanupFailure = (target, resources, cause, phase) => new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, resources, {
			reason: cause instanceof Error ? cause.message : String(cause),
			phase: `signature-snapshot-${phase}`,
			path: target.path
		}, {
			operation: "inspect_signature",
			cause
		});
		snapshotFailure = (target, phase, cause) => new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_signature", {
			cause,
			diagnostics: {
				path: target.path,
				phase: `signature-snapshot-${phase}`,
				reason: cause instanceof Error ? cause.message : String(cause)
			}
		});
		snapshotIO = async (target, phase, operation) => {
			try {
				return await operation();
			} catch (cause) {
				throw snapshotFailure(target, phase, cause);
			}
		};
		copySignatureBytes = async (target, source, snapshot, signal) => {
			const size = Number(source.stat.size);
			if (!Number.isSafeInteger(size)) throw new AnalysisResourceConstraintError("inspect_signature", "file-size", `Signature target size is not exactly representable: ${target.path}`, null);
			const hash = createHash("sha256");
			const chunk = Buffer.alloc(64 * 1024);
			let position = 0;
			while (position < size) {
				assertRegularFileActive(signal);
				const { bytesRead } = await source.file.read(chunk, 0, Math.min(chunk.length, size - position), position);
				assertRegularFileActive(signal);
				if (bytesRead === 0) throw new AnalysisArtifactChangedError("inspect_signature", target.path, `Signature target was truncated while hashing: ${target.path}`);
				const bytes = chunk.subarray(0, bytesRead);
				hash.update(bytes);
				await snapshotIO(target, "write", () => snapshot.writeFile(bytes));
				position += bytesRead;
			}
			return hash.digest("hex");
		};
		bindSignatureTarget = async (target, snapshotPath, resources, signal) => {
			let sourceOwner;
			let snapshotOwner;
			const perform = async () => {
				try {
					assertRegularFileActive(signal);
					const before = await lstat(target.path, { bigint: true });
					assertRegularFileActive(signal);
					if (!before.isFile() || before.isSymbolicLink()) return changedTarget(target, `Signature target is no longer a regular file: ${target.path}`);
					const file = await open(target.path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
					const sourceHandle = new OwnedFileHandle(file);
					sourceOwner = {
						kind: "lease",
						resource: target.path,
						lease: new AnalysisCleanupLease(() => sourceHandle.close(), [target.path])
					};
					const opened = await file.stat({ bigint: true });
					assertRegularFileActive(signal);
					if (identity(opened) !== identity(before)) return changedTarget(target, `Signature target changed before open: ${target.path}`);
					const snapshot = await snapshotIO(target, "create-file", () => open(snapshotPath, "wx", 384));
					const snapshotHandle = new OwnedFileHandle(snapshot);
					snapshotOwner = {
						kind: "lease",
						resource: snapshotPath,
						lease: new AnalysisCleanupLease(() => snapshotHandle.close(), [snapshotPath])
					};
					const observed = await copySignatureBytes(target, {
						file,
						stat: opened
					}, snapshot, signal);
					if (observed !== target.sha256) return changedTarget(target, `Signature target digest changed: ${target.path}; expected ${target.sha256}, observed ${observed}`);
					const after = await file.stat({ bigint: true });
					const current = await lstat(target.path, { bigint: true });
					assertRegularFileActive(signal);
					if (identity(after) !== identity(opened) || identity(current) !== identity(opened)) return changedTarget(target, `Signature target changed while establishing its version: ${target.path}`);
					await snapshotIO(target, "seal", () => snapshot.chmod(256));
					const snapshotOpened = await snapshot.stat({ bigint: true });
					const snapshotAtPath = await lstat(snapshotPath, { bigint: true });
					if (!snapshotOpened.isFile() || !snapshotAtPath.isFile() || snapshotAtPath.isSymbolicLink() || identity(snapshotOpened) !== identity(snapshotAtPath)) return changedTarget(target, `Digest-verified signature snapshot changed while binding: ${target.path}`);
					return ok({
						identity: identity(opened),
						snapshotPath,
						snapshotIdentity: identity(snapshotOpened)
					});
				} catch (cause) {
					return err(signatureReadFailure(target, cause));
				}
			};
			let result = await perform();
			const cleanupFailures = [];
			for (const owner of [snapshotOwner, sourceOwner]) {
				if (owner === undefined) continue;
				const cleanup = await resources.release(owner);
				if (cleanup.kind === "failed") cleanupFailures.push({
					owner,
					cause: cleanup.cause
				});
			}
			if (result.ok && signal?.aborted) result = err(new AnalysisCancelledError("inspect_signature", {
				cause: signal.reason,
				diagnostics: { snapshot_binding: {
					identity: result.value.identity,
					snapshot_path: result.value.snapshotPath
				} }
			}));
			if (cleanupFailures.length > 0) {
				const cause = new AggregateError(cleanupFailures.map(({ cause: failure }) => failure), "Signature snapshot file handles could not be closed");
				const cleanup = signatureCleanupFailure(target, cleanupFailures.map(({ owner }) => owner.resource), cause, "close");
				new AnalysisCleanupLeaseGroup(cleanup, cleanupFailures.map(({ owner }) => owner.lease));
				result = combineCleanupFailure(result, cleanup);
			}
			return result;
		};
		verifySignatureTarget = async (target, binding, signal) => {
			try {
				assertRegularFileActive(signal);
				const current = await lstat(target.path, { bigint: true });
				assertRegularFileActive(signal);
				if (!current.isFile() || identity(current) !== binding.identity) return changedTarget(target, `Signature target changed during inspection: ${target.path}`);
				let snapshot;
				try {
					snapshot = await lstat(binding.snapshotPath, { bigint: true });
				} catch (cause) {
					const code = cause instanceof Error && "code" in cause ? cause.code : undefined;
					if (code === "ENOENT" || code === "ENOTDIR" || code === "ELOOP") return changedTarget(target, `Digest-verified signature snapshot is unavailable during inspection: ${target.path}`);
					return err(signatureReadFailure(target, cause));
				}
				assertRegularFileActive(signal);
				return snapshot.isFile() && !snapshot.isSymbolicLink() && identity(snapshot) === binding.snapshotIdentity ? ok(undefined) : changedTarget(target, `Digest-verified signature snapshot changed during inspection: ${target.path}`);
			} catch (cause) {
				return err(signatureReadFailure(target, cause));
			}
		};
	})))();
}

//#endregion
//#region dist/native/parsers/codesign.js
var parseCodeSignature, splitEchoedValues, nullableCodeSignValue, splitAlgorithms, parseRuntime;
function init_codesign() {
	return (init_codesign = __esmMin((() => {
		init_nativeInspection();
		parseCodeSignature = (output, unsigned, executablePaths = []) => {
			const { identifier, fields } = splitEchoedValues(output, executablePaths);
			const values = new Map();
			const authorities = [];
			const cdhashes = [];
			for (const line of fields.split(/\r?\n/u)) {
				if (line.startsWith("CodeDirectory ")) {
					values.set("CodeDirectory", line.slice("CodeDirectory ".length));
					continue;
				}
				const separator = line.indexOf("=");
				if (separator < 1) continue;
				const key = line.slice(0, separator).trim();
				const value = line.slice(separator + 1).trim();
				if (key === "Authority") authorities.push(value);
				else if (key === "CDHash") cdhashes.push(value);
				else values.set(key, value);
			}
			const parsed = inspectSignatureSchema.omit({ provenance: true }).parse({
				signed: !unsigned,
				identifier: identifier ?? null,
				team_identifier: nullableCodeSignValue(values.get("TeamIdentifier")),
				format: values.get("Format") ?? null,
				cdhashes,
				hash_algorithms: splitAlgorithms(values.get("Hash choices")),
				authorities,
				designated_requirement: values.get("designated") ?? null,
				entitlements: null,
				timestamp: values.get("Timestamp") ?? null,
				hardened_runtime: parseRuntime(values.get("CodeDirectory")),
				limitations: unsigned ? ["Artifact is not signed."] : []
			});
			return parsed;
		};
		splitEchoedValues = (text, executablePaths) => {
			let rest = text;
			let newline;
			for (const path of executablePaths) {
				const prefix = `Executable=${path}`;
				if (!text.startsWith(prefix)) continue;
				const separator = /^\r?\n/u.exec(text.slice(prefix.length))?.[0];
				if (separator === undefined) continue;
				newline = separator;
				rest = text.slice(prefix.length + separator.length);
				break;
			}
			if (rest === text && text.startsWith("Executable=")) {
				const identifierLine = text.indexOf("\nIdentifier=");
				rest = identifierLine < 0 ? text : text.slice(identifierLine + 1);
			}
			if (!rest.startsWith("Identifier=")) return {
				identifier: undefined,
				fields: rest
			};
			const format = rest.lastIndexOf("\nFormat=");
			if (newline === undefined && format >= 0) newline = /\r?\n/u.exec(rest.slice(format + 1))?.[0];
			const boundary = format >= 0 ? format : rest.indexOf("\n");
			const crlf = newline === undefined || newline === "\r\n";
			const end = boundary < 0 ? rest.length : boundary - (crlf && rest[boundary - 1] === "\r" ? 1 : 0);
			return {
				identifier: rest.slice("Identifier=".length, end),
				fields: rest.slice(end)
			};
		};
		nullableCodeSignValue = (value) => value === undefined || value === "not set" ? null : value;
		splitAlgorithms = (value) => value === undefined ? [] : value.split(/[,+\s]+/u).map((part) => part.trim()).filter((part) => part.length > 0);
		parseRuntime = (value) => {
			if (value === undefined) return null;
			const flags = /(?:^|\s)flags=[^(]*\(([^)]*)\)/u.exec(value)?.[1];
			if (flags === undefined) return null;
			return flags.split(",").some((flag) => flag.trim() === "runtime");
		};
	})))();
}

//#endregion
//#region dist/native/parsers/demangle.js
var linkageName, undecodedSpelling, parseDemangledSymbols;
function init_demangle() {
	return (init_demangle = __esmMin((() => {
		init_swiftSymbolClassification();
		linkageName = (input) => input.startsWith("__") ? input.slice(1) : input;
		undecodedSpelling = (input) => /^[Sse]/u.test(input) ? `$${input}` : linkageName(input);
		parseDemangledSymbols = (inputs, output) => {
			if (inputs.length === 0) {
				if (output === "" || output === "\n") return [];
				throw new TypeError("swift-demangle emitted output for an empty input");
			}
			const expectedRecords = inputs.filter((input) => input !== "_").length;
			const lines = output === "" ? [] : output.replace(/\n$/u, "").split("\n");
			if (lines.length !== expectedRecords) throw new TypeError("swift-demangle output count does not match input");
			let record = 0;
			return inputs.map((input) => {
				if (input === "_") return {
					input,
					output: "",
					status: "invalid"
				};
				const value = lines[record++];
				if (value === undefined || value.length === 0) throw new TypeError("swift-demangle omitted an output line");
				const decoded = value !== input && value !== undecodedSpelling(input);
				return {
					input,
					output: value,
					status: decoded ? "demangled" : isSwiftMangledSymbolName(linkageName(input)) ? "invalid" : "unchanged"
				};
			});
		};
	})))();
}

//#endregion
//#region dist/native/parsers/dyldInfo.js
var parseDyldImports, parseDyldExports, canonicalHex, parseReexportRow, reexportSuffix;
function init_dyldInfo() {
	return (init_dyldInfo = __esmMin((() => {
		parseDyldImports = (output, hasChainedFixups) => output.split("\n").flatMap((rawLine) => {
			const line = rawLine.trim();
			const imported = /^(?:0x[\da-f]+\s+)?(.+?)(?:\s+\[([^\]]+)\])?\s+\(from (.+)\)$/iu.exec(line);
			if (imported?.[1] === undefined) return [];
			const ambiguousSuffix = hasChainedFixups ? /^(.*)\+0x[\da-f]+$/iu.test(imported[1]) : false;
			return [{
				name: ambiguousSuffix ? null : imported[1],
				raw_name: ambiguousSuffix ? imported[1] : null,
				name_status: ambiguousSuffix ? "ambiguous" : "exact",
				addend: null,
				address: null,
				weak: /\bweak-import\b/u.test(imported[2] ?? "") ? true : null,
				reexport: null,
				source: imported[3] ?? null
			}];
		});
		parseDyldExports = (output, imageBase, knownExportNames) => {
			const offsets = /^\s*offset\s+symbol\s*$/mu.test(output);
			return output.split("\n").flatMap((rawLine) => {
				const line = rawLine.trimStart();
				const reexport = parseReexportRow(line, knownExportNames);
				if (reexport !== null) return [{
					name: reexport.name,
					address: null,
					weak: null,
					reexport: true,
					source: reexport.source,
					...reexport.sourceSymbol === undefined ? {} : { sourceSymbol: reexport.sourceSymbol }
				}];
				const exported = /^(0x[\da-f]+)\s+(.+?)(?:\s+\[([^\]]+)\])?$/isu.exec(line);
				if (exported?.[1] === undefined || exported[2] === undefined) return [];
				const rawName = /^0x[\da-f]+\s+(.+)$/isu.exec(line)?.[1];
				const literalName = rawName !== undefined && knownExportNames.has(rawName);
				if (literalName && exported[3] !== undefined && knownExportNames.has(exported[2])) return [];
				const annotation = literalName ? undefined : exported[3];
				const absolute = /\babsolute\b/u.test(annotation ?? "");
				const address = offsets && !absolute ? imageBase === null ? null : `0x${(BigInt(imageBase) + BigInt(exported[1])).toString(16)}` : canonicalHex(exported[1]);
				return [{
					name: literalName ? rawName : exported[2],
					address,
					weak: /\bweak-def\b/u.test(annotation ?? "") ? true : null,
					reexport: false,
					source: null
				}];
			});
		};
		canonicalHex = (value) => value === undefined ? null : `0x${BigInt(value).toString(16)}`;
		parseReexportRow = (line, knownNames) => {
			const prefix = /^\[re-export\]\s+/u.exec(line);
			if (prefix === null) return null;
			const rest = line.slice(prefix[0].length);
			if (rest.length === 0) return null;
			if (!rest.endsWith(")")) return {
				name: rest,
				source: null
			};
			const candidates = [];
			for (const match of rest.matchAll(/\s+\(/gu)) {
				const name = rest.slice(0, match.index);
				if (!knownNames.has(name)) continue;
				const parsed = reexportSuffix(name, rest.slice(match.index + match[0].length, -1));
				if (parsed !== null) candidates.push(parsed);
			}
			if (candidates.length > 0) return candidates.length === 1 ? candidates[0] : null;
			if (knownNames.has(rest)) return {
				name: rest,
				source: null
			};
			let depth = 0;
			for (let index = rest.length - 1; index >= 0; index--) {
				if (rest[index] === ")") depth++;
				else if (rest[index] === "(" && --depth === 0) {
					if (index === 0 || !/\s/u.test(rest[index - 1])) break;
					const name = rest.slice(0, index).trimEnd();
					return reexportSuffix(name, rest.slice(index + 1, -1)) ?? {
						name: rest,
						source: null
					};
				}
			}
			return {
				name: rest,
				source: null
			};
		};
		reexportSuffix = (name, inner) => {
			if (name.length === 0) return null;
			if (inner.startsWith("from ") && inner.length > 5) return {
				name,
				source: inner.slice(5)
			};
			const separator = /\s+from /u.exec(inner);
			if (separator === null) return null;
			const sourceSymbol = inner.slice(0, separator.index);
			const source = inner.slice(separator.index + separator[0].length);
			return sourceSymbol.length > 0 && source.length > 0 ? {
				name,
				source,
				sourceSymbol
			} : null;
		};
	})))();
}

//#endregion
//#region dist/native/parsers/echoedPath.js
var withoutEchoedPathHeader;
function init_echoedPath() {
	return (init_echoedPath = __esmMin((() => {
		withoutEchoedPathHeader = (output, path) => {
			if (path === undefined || !output.startsWith(path)) return output;
			const header = /^(?: \(architecture [^)\n]*\)| \[[^\]\n]*\])?:\r?\n/u.exec(output.slice(path.length));
			return header === null ? output : output.slice(path.length + header[0].length);
		};
	})))();
}

//#endregion
//#region dist/native/parsers/otool.js
var DYLIB_COMMANDS, PAYLOAD_DEPENDENCY_COMMANDS, DYLIB_FIELDS, DYLIB_ENCODING_FIELDS, EMPTY_VALUE_FIELDS, VERSION_MIN_PLATFORMS, BUILD_PLATFORM_NAMES, BUILD_TOOL_NAMES, buildCodeName, normalizeLineEndings, parseOtoolLoadCommands, WORD_SIZES, cpuEndian, parseHeader, headerValue, validateLoadCommandFraming, createLoadCommandState, parseLoadCommand, validateDylibCommandLines, validateLinkerOptionLines, scalarFields, collectEntrypoint, collectBuild, collectDependency, collectSegment, parseFields, TEXT_FIELDS, OFFSET_STRING_FIELD, MACHO_NAME_FIELD, parseField, requireUniqueField, parseSegment, parseSections, parseBuildTools, permissions, NUMERIC_PATTERN, numeric, machoName, stringField, numberField, hexField, stripOffsetSuffix, sectionAlignment;
function init_otool() {
	return (init_otool = __esmMin((() => {
		init_machoPlatform();
		DYLIB_COMMANDS = new Set([
			"LC_ID_DYLIB",
			"LC_LOAD_DYLIB",
			"LC_LOAD_WEAK_DYLIB",
			"LC_REEXPORT_DYLIB",
			"LC_LAZY_LOAD_DYLIB",
			"LC_LOAD_UPWARD_DYLIB"
		]);
		PAYLOAD_DEPENDENCY_COMMANDS = new Set(["LC_LAZY_LOAD_DYLIB_INFO"]);
		DYLIB_FIELDS = [
			"cmd",
			"cmdsize",
			"name",
			"current version",
			"compatibility version"
		];
		DYLIB_ENCODING_FIELDS = ["time stamp", "options"];
		EMPTY_VALUE_FIELDS = new Set([
			"options",
			"segname",
			"sectname"
		]);
		VERSION_MIN_PLATFORMS = new Map([
			["LC_VERSION_MIN_MACOSX", 1],
			["LC_VERSION_MIN_IPHONEOS", 2],
			["LC_VERSION_MIN_TVOS", 3],
			["LC_VERSION_MIN_WATCHOS", 4]
		]);
		BUILD_PLATFORM_NAMES = new Map([
			["1", "MACOS"],
			["2", "IOS"],
			["3", "TVOS"],
			["4", "WATCHOS"],
			["5", "BRIDGEOS"],
			["6", "MACCATALYST"],
			["7", "IOSSIMULATOR"],
			["8", "TVOSSIMULATOR"],
			["9", "WATCHOSSIMULATOR"],
			["10", "DRIVERKIT"],
			["11", "VISIONOS"],
			["12", "VISIONOSSIMULATOR"],
			["13", "FIRMWARE"],
			["14", "SEPOS"],
			["15", "MACOS_EXCLAVECORE"],
			["16", "MACOS_EXCLAVEKIT"],
			["17", "IOS_EXCLAVECORE"],
			["18", "IOS_EXCLAVEKIT"],
			["19", "TVOS_EXCLAVECORE"],
			["20", "TVOS_EXCLAVEKIT"],
			["21", "WATCHOS_EXCLAVECORE"],
			["22", "WATCHOS_EXCLAVEKIT"],
			["23", "VISIONOS_EXCLAVECORE"],
			["24", "VISIONOS_EXCLAVEKIT"]
		]);
		BUILD_TOOL_NAMES = new Map([
			["1", "CLANG"],
			["2", "SWIFT"],
			["3", "LD"],
			["4", "LLD"],
			["1024", "METAL"],
			["1025", "AIRLLD"],
			["1026", "AIRNT"],
			["1027", "AIRNT_PLUGIN"],
			["1028", "AIRPACK"],
			["1031", "GPUARCHIVER"],
			["1032", "METAL_FRAMEWORK"]
		]);
		buildCodeName = (names, value) => value === null ? null : names.get(value) ?? value;
		normalizeLineEndings = (output) => output.replaceAll("\r\n", "\n");
		parseOtoolLoadCommands = (raw) => {
			const output = normalizeLineEndings(raw);
			const header = parseHeader(output);
			if (header === undefined) throw new TypeError("otool output is missing the Mach header");
			const state = createLoadCommandState(header.flags, header.cpuType);
			for (const block of output.split(/(?=^Load command \d+$)/mu)) parseLoadCommand(block, state);
			validateLoadCommandFraming(header, state.commands);
			return {
				wordSize: WORD_SIZES.get(header.magic ?? "") ?? null,
				endian: header.cpuType === null ? null : cpuEndian(header.cpuType),
				fileType: header.fileType,
				flags: [...state.flags].sort(),
				commands: state.commands,
				segments: state.segments,
				dependencies: state.dependencies,
				omittedDependencyCommands: state.omittedDependencyCommands,
				entrypoints: state.entrypoints,
				builds: state.builds
			};
		};
		WORD_SIZES = new Map([
			["0xfeedface", 32],
			["0xfeedfacf", 64],
			["MH_MAGIC", 32],
			["MH_MAGIC_64", 64]
		]);
		cpuEndian = (cpuType) => {
			const family = cpuType & 16777215;
			if (family === 7 || family === 12) return "little";
			return family === 18 ? "big" : null;
		};
		parseHeader = (output) => {
			const lines = output.split(/\r?\n/u).map((line) => line.trim());
			const columnsLine = lines.findIndex((line) => /(?:^|\s)magic\s/u.test(line));
			if (columnsLine < 0) return undefined;
			const columns = lines[columnsLine]?.split(/\s+/u);
			const dataLine = lines.slice(columnsLine + 1).find((line) => line.length > 0);
			const values = dataLine?.split(/\s+/u);
			if (columns === undefined || values === undefined) return undefined;
			const commandCount = headerValue(columns, values, "ncmds");
			const commandBytes = headerValue(columns, values, "sizeofcmds");
			if (commandCount === null || commandBytes === null) throw new TypeError("otool Mach header is missing valid command framing");
			const fileTypeIndex = columns.indexOf("filetype");
			const flagsIndex = columns.indexOf("flags");
			const complete = values.length >= columns.length;
			const fileTypeValueIndex = flagsIndex >= 0 && fileTypeIndex > flagsIndex ? values.length - (columns.length - fileTypeIndex) : fileTypeIndex;
			const flagsEnd = flagsIndex >= 0 ? values.length - (columns.length - flagsIndex - 1) : 0;
			const magicIndex = columns.indexOf("magic");
			return {
				magic: magicIndex < 0 ? null : values[magicIndex] ?? null,
				cpuType: headerValue(columns, values, "cputype"),
				commandCount,
				commandBytes,
				fileType: complete && fileTypeValueIndex >= 0 && fileTypeValueIndex < values.length ? values[fileTypeValueIndex] ?? null : null,
				flags: !complete || flagsIndex < 0 || flagsIndex >= flagsEnd ? [] : values.slice(flagsIndex, flagsEnd).filter((value) => value.length > 0)
			};
		};
		headerValue = (columns, values, name) => {
			const index = columns.indexOf(name);
			if (index < 0) return null;
			const flagsIndex = columns.indexOf("flags");
			const valueIndex = flagsIndex >= 0 && index > flagsIndex ? values.length - (columns.length - index) : index;
			const value = values[valueIndex];
			return value === undefined ? null : numeric(value);
		};
		validateLoadCommandFraming = (header, commands) => {
			if (commands.length !== header.commandCount) throw new TypeError("otool load-command count does not match the Mach header");
			let totalBytes = 0;
			for (const [expectedIndex, command] of commands.entries()) {
				const size = numberField(command.fields, "cmdsize");
				if (command.index !== expectedIndex || size === null || size < 8) throw new TypeError("otool load-command sequence or size is invalid");
				totalBytes += size;
				if (!Number.isSafeInteger(totalBytes)) throw new TypeError("otool load-command byte count is unsafe");
			}
			if (totalBytes !== header.commandBytes) throw new TypeError("otool load-command sizes do not match the Mach header");
		};
		createLoadCommandState = (headerFlags, cpuType) => ({
			cpuType,
			commands: [],
			segments: [],
			dependencies: [],
			entrypoints: [],
			builds: [],
			flags: new Set(headerFlags ?? []),
			omittedDependencyCommands: []
		});
		parseLoadCommand = (block, state) => {
			const indexText = /^Load command (\d+)/u.exec(block)?.[1];
			if (indexText === undefined) return;
			const index = Number(indexText);
			if (!Number.isSafeInteger(index)) throw new TypeError("otool load-command index is unsafe");
			const header = block.split(/\n\s*Section\n/u)[0] ?? block;
			const parsed = parseFields(header);
			const fields = parsed.values;
			const kind = stringField(fields, "cmd");
			if (kind === null) throw new TypeError("otool load command is missing cmd");
			for (const key of scalarFields(kind)) requireUniqueField(parsed, key);
			if (DYLIB_COMMANDS.has(kind)) validateDylibCommandLines(parsed);
			if (kind === "LC_LINKER_OPTION") validateLinkerOptionLines(parsed);
			state.commands.push({
				index,
				kind,
				fields
			});
			collectEntrypoint(kind, fields, state);
			collectBuild(kind, block, fields, state);
			collectDependency(kind, fields, state);
			if (PAYLOAD_DEPENDENCY_COMMANDS.has(kind)) state.omittedDependencyCommands.push(kind);
			collectSegment(kind, block, fields, state);
		};
		validateDylibCommandLines = (parsed) => {
			const encodingFields = DYLIB_ENCODING_FIELDS.filter((key) => parsed.rows.some((field) => field?.[0] === key));
			if (encodingFields.length !== 1) throw new TypeError("otool dylib command must contain timestamp or options");
			for (const key of encodingFields) requireUniqueField(parsed, key);
			const allowed = new Set([...DYLIB_FIELDS, ...DYLIB_ENCODING_FIELDS]);
			for (const field of parsed.rows) {
				const key = field?.[0];
				if (key === undefined || !allowed.has(key)) throw new TypeError("otool dylib command contains ambiguous multiline text");
			}
		};
		validateLinkerOptionLines = (parsed) => {
			const count = numberField(parsed.values, "count");
			const labels = parsed.rows.map((field) => field?.[0]).filter((key) => key !== "cmd" && key !== "cmdsize" && key !== "count");
			if (count === null || labels.length !== count || labels.some((key, index) => key !== `string #${String(index + 1)}`)) throw new TypeError("otool linker-option strings do not match count");
		};
		scalarFields = (kind) => {
			const common = ["cmd", "cmdsize"];
			if (DYLIB_COMMANDS.has(kind)) return DYLIB_FIELDS;
			if (kind === "LC_LINKER_OPTION") return [...common, "count"];
			if (kind === "LC_LOAD_DYLINKER" || kind === "LC_ID_DYLINKER") return [...common, "name"];
			if (kind === "LC_UUID") return [...common, "uuid"];
			if (kind === "LC_MAIN") return [...common, "entryoff"];
			if (kind === "LC_BUILD_VERSION") return [
				...common,
				"platform",
				"minos",
				"sdk",
				"ntools"
			];
			if (kind.startsWith("LC_VERSION_MIN_")) return [
				...common,
				"version",
				"sdk"
			];
			if (kind === "LC_SEGMENT" || kind === "LC_SEGMENT_64") return [
				...common,
				"segname",
				"vmaddr",
				"vmsize",
				"fileoff",
				"filesize",
				"maxprot",
				"initprot",
				"nsects",
				"flags"
			];
			return common;
		};
		collectEntrypoint = (kind, fields, state) => {
			if (kind !== "LC_MAIN") return;
			const entry = numberField(fields, "entryoff");
			if (entry !== null) state.entrypoints.push({ file_offset: entry });
		};
		collectBuild = (kind, block, fields, state) => {
			if (kind === "LC_BUILD_VERSION") {
				const tools = parseBuildTools(block);
				if (numberField(fields, "ntools") !== tools.length) throw new TypeError("otool build-tool count does not match ntools");
				state.builds.push({
					platform: buildCodeName(BUILD_PLATFORM_NAMES, stringField(fields, "platform")),
					minimum_os: stringField(fields, "minos"),
					sdk: stringField(fields, "sdk"),
					tools
				});
				return;
			}
			if (kind.startsWith("LC_VERSION_MIN_")) {
				const platform = kind.slice("LC_VERSION_MIN_".length) || null;
				const devicePlatform = VERSION_MIN_PLATFORMS.get(kind);
				const derivedPlatform = devicePlatform === undefined ? undefined : legacyMachoPlatform(devicePlatform, state.cpuType);
				state.builds.push({
					platform: derivedPlatform === undefined || derivedPlatform === devicePlatform ? platform : buildCodeName(BUILD_PLATFORM_NAMES, String(derivedPlatform)),
					minimum_os: stringField(fields, "version"),
					sdk: stringField(fields, "sdk"),
					tools: []
				});
			}
		};
		collectDependency = (kind, fields, state) => {
			if (!DYLIB_COMMANDS.has(kind) || kind === "LC_ID_DYLIB") return;
			state.dependencies.push({
				path: stripOffsetSuffix(stringField(fields, "name")),
				kind,
				current_version: stringField(fields, "current version"),
				compatibility_version: stringField(fields, "compatibility version")
			});
		};
		collectSegment = (kind, block, fields, state) => {
			if (kind !== "LC_SEGMENT" && kind !== "LC_SEGMENT_64") return;
			const segment = parseSegment(block, fields);
			if (numberField(fields, "nsects") !== segment.sections.length) throw new TypeError("otool segment section count does not match its sections");
			state.segments.push(segment);
		};
		parseFields = (block) => {
			const rows = [];
			for (const rawLine of block.split(/\r?\n/u).slice(1)) if (rawLine.trim().length > 0) rows.push(parseField(rawLine));
			const occurrences = new Map();
			for (const field of rows) if (field !== undefined) occurrences.set(field[0], (occurrences.get(field[0]) ?? 0) + 1);
			const fields = {};
			const ordinals = new Map();
			for (const field of rows) {
				if (field === undefined) continue;
				const [key, value] = field;
				const ordinal = (ordinals.get(key) ?? 0) + 1;
				ordinals.set(key, ordinal);
				const label = (occurrences.get(key) ?? 0) > 1 ? `${key} #${String(ordinal)}` : key;
				fields[label] = TEXT_FIELDS.test(key) ? value : numeric(value) ?? value;
			}
			return {
				values: fields,
				rows
			};
		};
		TEXT_FIELDS = /^(?:segname|sectname|string #\d+)$/u;
		OFFSET_STRING_FIELD = /^(name|path) (.* \(offset \d+\))$/u;
		MACHO_NAME_FIELD = /^(segname|sectname)(?: (.*))?$/u;
		parseField = (rawLine) => {
			const offsetString = OFFSET_STRING_FIELD.exec(rawLine.trimStart());
			if (offsetString?.[1] !== undefined && offsetString[2] !== undefined) return [offsetString[1], offsetString[2]];
			const name = MACHO_NAME_FIELD.exec(rawLine.trimStart());
			if (name?.[1] !== undefined) return [name[1], name[2] ?? ""];
			const option = /^\s*(string #[1-9]\d*)(?: (.*))?$/u.exec(rawLine);
			if (option?.[1] !== undefined) return [option[1], option[2] ?? ""];
			const fixedName = /^\s*(segname|sectname) (.*)$/u.exec(rawLine);
			if (fixedName?.[1] !== undefined) return [fixedName[1], fixedName[2] ?? ""];
			const line = rawLine.trim();
			const match = /^(time stamp|current version|compatibility version|\S+)(?:\s+(.+))?$/u.exec(line);
			return match?.[1] === undefined ? undefined : [match[1], match[2]?.trim() ?? ""];
		};
		requireUniqueField = (parsed, key) => {
			const matches = parsed.rows.filter((field) => field?.[0] === key);
			const field = matches[0];
			if (matches.length !== 1 || field === undefined) throw new TypeError(`otool field ${key} is missing or repeated`);
			if (field[1] === "" && !EMPTY_VALUE_FIELDS.has(key)) throw new TypeError(`otool field ${key} has no value`);
		};
		parseSegment = (block, fields) => ({
			name: machoName(fields, "segname"),
			vm_address: hexField(fields, "vmaddr"),
			vm_size: numberField(fields, "vmsize"),
			file_offset: numberField(fields, "fileoff"),
			file_size: numberField(fields, "filesize"),
			maximum_permissions: permissions(stringField(fields, "maxprot")),
			initial_permissions: permissions(stringField(fields, "initprot")),
			sections: parseSections(block)
		});
		parseSections = (block) => block.split(/(?=\n\s*Section\n)/u).slice(1).map((sectionBlock) => {
			const parsed = parseFields(`Section${sectionBlock}`);
			const fields = parsed.values;
			for (const key of [
				"sectname",
				"segname",
				"addr",
				"size",
				"offset",
				"align",
				"flags"
			]) requireUniqueField(parsed, key);
			return {
				segment: machoName(fields, "segname"),
				name: machoName(fields, "sectname"),
				address: hexField(fields, "addr"),
				size: numberField(fields, "size"),
				file_offset: numberField(fields, "offset"),
				alignment: sectionAlignment(stringField(fields, "align")),
				flags: (stringField(fields, "flags") ?? "").split(/\s+/u).filter((flag) => flag.length > 0)
			};
		});
		parseBuildTools = (block) => {
			const tools = [];
			const lines = block.split(/\r?\n/u).map((line) => line.trim());
			for (let index = 0; index < lines.length - 1; index += 1) {
				const tool = /^tool\s+(.+)$/u.exec(lines[index] ?? "")?.[1];
				const version = /^version\s+(.+)$/u.exec(lines[index + 1] ?? "")?.[1];
				if (tool !== undefined && version !== undefined) tools.push({
					name: BUILD_TOOL_NAMES.get(tool) ?? tool,
					version
				});
			}
			return tools;
		};
		permissions = (raw) => {
			if (raw === null) return {
				read: null,
				write: null,
				execute: null,
				raw: null
			};
			const numericValue = numeric(raw);
			if (numericValue !== null) return {
				read: (numericValue & 1) !== 0,
				write: (numericValue & 2) !== 0,
				execute: (numericValue & 4) !== 0,
				raw
			};
			if (/^[r-][w-][x-]$/u.test(raw)) return {
				read: raw[0] === "r",
				write: raw[1] === "w",
				execute: raw[2] === "x",
				raw
			};
			return {
				read: null,
				write: null,
				execute: null,
				raw
			};
		};
		NUMERIC_PATTERN = /^(?:0x[a-fA-F0-9]+|\d+)$/u;
		numeric = (value) => {
			if (!NUMERIC_PATTERN.test(value)) return null;
			const parsed = Number.parseInt(value, value.startsWith("0x") ? 16 : 10);
			return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
		};
		machoName = (fields, key) => {
			const name = stringField(fields, key);
			if (name === null) throw new TypeError(`otool field ${key} is missing`);
			return name;
		};
		stringField = (fields, name) => {
			const value = fields[name];
			return typeof value === "string" ? value : value === undefined || value === null ? null : String(value);
		};
		numberField = (fields, name) => {
			const value = fields[name];
			return typeof value === "number" ? value : typeof value === "string" ? numeric(value) : null;
		};
		hexField = (fields, name) => {
			const value = stringField(fields, name);
			if (value === null || !NUMERIC_PATTERN.test(value)) return null;
			return `0x${BigInt(value).toString(16)}`;
		};
		stripOffsetSuffix = (value) => value?.replace(/ \(offset \d+\)$/u, "") ?? "unknown";
		sectionAlignment = (raw) => {
			if (raw === null) return null;
			const exponent = numeric(/^2\^(\d+)(?:\s+\(\d+\))?$/u.exec(raw)?.[1] ?? raw);
			return exponent === null || exponent > 52 ? null : 2 ** exponent;
		};
	})))();
}

//#endregion
//#region dist/native/parsers/machoUuid.js
var MACHO_UUID, reconcileMachoUuid, parseDwarfdumpUuid, parseDwarfdumpRows, selectDwarfdumpRow, loadCommandUuid, reconcileObservations;
function init_machoUuid() {
	return (init_machoUuid = __esmMin((() => {
		MACHO_UUID = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/iu;
		reconcileMachoUuid = (commands, dwarfdumpOutput, artifactPath, selectedArchitecture) => reconcileObservations(loadCommandUuid(commands), parseDwarfdumpUuid(dwarfdumpOutput, artifactPath, selectedArchitecture));
		parseDwarfdumpUuid = (output, artifactPath, selectedArchitecture) => {
			const parsed = parseDwarfdumpRows(output, artifactPath);
			return parsed.kind === "invalid" ? parsed : selectDwarfdumpRow(parsed.rows, selectedArchitecture);
		};
		parseDwarfdumpRows = (output, artifactPath) => {
			if (output.trim().length === 0) return {
				kind: "rows",
				rows: []
			};
			const header = /UUID:[ \t]*([^\s]+)[ \t]+\(([^)\r\n]+)\) /uy;
			const rows = [];
			let offset = 0;
			while (offset < output.length) {
				if (output.startsWith("\r\n", offset)) {
					offset += 2;
					continue;
				}
				if (output[offset] === "\n") {
					offset += 1;
					continue;
				}
				header.lastIndex = offset;
				const match = header.exec(output);
				if (match === null) return {
					kind: "invalid",
					reason: "dwarfdump --uuid output contains an unrecognized row"
				};
				const value = match[1] ?? "";
				const architecture = match[2] ?? "";
				offset = header.lastIndex;
				if (!output.startsWith(artifactPath, offset)) return {
					kind: "invalid",
					reason: `dwarfdump --uuid row does not match the selected artifact path (UUID ${JSON.stringify(value)})`
				};
				offset += artifactPath.length;
				if (offset < output.length && output.startsWith("\r\n", offset)) offset += 2;
				else if (output[offset] === "\n") offset += 1;
				else if (offset !== output.length) return {
					kind: "invalid",
					reason: `dwarfdump --uuid returned malformed UUID row ${JSON.stringify(value)}`
				};
				rows.push({
					value,
					architecture
				});
			}
			return {
				kind: "rows",
				rows
			};
		};
		selectDwarfdumpRow = (rows, selectedArchitecture) => {
			if (rows.length === 0) return { kind: "absent" };
			const selectedRows = selectedArchitecture === null ? rows : rows.filter(({ architecture }) => architecture === selectedArchitecture.dwarfdumpName);
			const validRows = selectedRows.filter(({ value }) => MACHO_UUID.test(value));
			const distinctValid = new Set(validRows.map(({ value }) => value.toLowerCase()));
			if (distinctValid.size > 1) return {
				kind: "conflict",
				reason: `dwarfdump --uuid returned conflicting UUIDs for selected architecture ${selectedArchitecture?.name ?? "unknown"}`
			};
			if (selectedRows.length !== 1) return {
				kind: "invalid",
				reason: selectedRows.length > 1 ? `dwarfdump --uuid returned multiple rows for selected architecture ${selectedArchitecture?.name ?? "unknown"}` : `dwarfdump --uuid returned no row for selected architecture ${selectedArchitecture?.name ?? "unknown"}`
			};
			const [row] = selectedRows;
			if (row === undefined) return { kind: "absent" };
			if (!MACHO_UUID.test(row.value)) return {
				kind: "invalid",
				reason: `dwarfdump --uuid returned malformed UUID ${JSON.stringify(row.value)}`
			};
			return {
				kind: "valid",
				value: row.value
			};
		};
		loadCommandUuid = (commands) => {
			const loadCommands = commands.filter(({ kind }) => kind === "LC_UUID");
			if (loadCommands.length === 0) return { kind: "absent" };
			if (loadCommands.length > 1) {
				const observed = loadCommands.map(({ fields }) => fields.uuid).filter((value) => typeof value === "string" && MACHO_UUID.test(value));
				const distinct = new Set(observed.map((value) => value.toLowerCase()));
				return {
					kind: distinct.size > 1 ? "conflict" : "invalid",
					reason: distinct.size > 1 ? `otool returned conflicting LC_UUID values ${observed.map((value) => JSON.stringify(value)).join(" and ")}` : `otool returned ${String(loadCommands.length)} LC_UUID commands`
				};
			}
			const value = loadCommands[0]?.fields.uuid;
			return typeof value === "string" && MACHO_UUID.test(value) ? {
				kind: "valid",
				value
			} : {
				kind: "invalid",
				reason: `otool LC_UUID contains malformed UUID ${JSON.stringify(value ?? null)}`
			};
		};
		reconcileObservations = (loadUuid, dwarfdump) => {
			if (dwarfdump.kind === "valid" && loadUuid.kind === "valid") {
				if (dwarfdump.value.toLowerCase() === loadUuid.value.toLowerCase()) return {
					value: dwarfdump.value,
					limitations: []
				};
				return {
					value: null,
					limitations: [`dwarfdump --uuid (${dwarfdump.value}) conflicts with otool LC_UUID (${loadUuid.value}); the image UUID is unknown.`]
				};
			}
			if (dwarfdump.kind === "valid" && loadUuid.kind === "conflict") return {
				value: null,
				limitations: [loadUuid.reason]
			};
			if (loadUuid.kind === "valid" && dwarfdump.kind === "conflict") return {
				value: null,
				limitations: [dwarfdump.reason]
			};
			if (dwarfdump.kind === "valid") return {
				value: dwarfdump.value,
				limitations: loadUuid.kind === "invalid" ? [`${loadUuid.reason}; using the unambiguous dwarfdump UUID.`] : []
			};
			if (loadUuid.kind === "valid") return {
				value: loadUuid.value,
				limitations: dwarfdump.kind === "invalid" ? [`${dwarfdump.reason}; using the unambiguous otool LC_UUID.`] : []
			};
			return {
				value: null,
				limitations: [...dwarfdump.kind === "invalid" || dwarfdump.kind === "conflict" ? [dwarfdump.reason] : [], ...loadUuid.kind === "invalid" || loadUuid.kind === "conflict" ? [loadUuid.reason] : []]
			};
		};
	})))();
}

//#endregion
//#region dist/native/NativeMachoCommandDiagnostics.js
var MISSING_UUID_DIAGNOSTIC, dyldFailureDiagnostics, isMissingUuidDyldFailure, isUnbackedTextDyldFailure, parseDyldFileTypeRefusal, nativeMachoCapturedOutput, missingUuidLimitation, unusableNativeCommandOutput, conflictingUuidCommandEvidence;
function init_NativeMachoCommandDiagnostics() {
	return (init_NativeMachoCommandDiagnostics = __esmMin((() => {
		init_analysisErrorCore();
		init_echoedPath();
		MISSING_UUID_DIAGNOSTIC = "missing LC_UUID load command";
		dyldFailureDiagnostics = (capture, outputs) => capture.tool !== "dyld_info" || capture.exitCode === null || capture.exitCode === 0 || capture.signal !== null ? [] : outputs.flatMap((output) => withoutEchoedPathHeader(output, capture.arguments.at(-1)).split(/\r?\n/u).map((line) => line.trim().replace(/^(?:dyld_info:\s*)/u, "")));
		isMissingUuidDyldFailure = (capture) => dyldFailureDiagnostics(capture, [capture.stdout]).includes(MISSING_UUID_DIAGNOSTIC);
		isUnbackedTextDyldFailure = (capture) => dyldFailureDiagnostics(capture, [capture.stdout, capture.stderr]).includes("section '__TEXT/__text' has offset=0 but is not a zero-fill section type");
		parseDyldFileTypeRefusal = (capture) => {
			for (const line of dyldFailureDiagnostics(capture, [capture.stdout, capture.stderr])) {
				const fileType = /^unknown (?:mh\.)?filetype ([34])$/u.exec(line)?.[1];
				if (fileType === "3" || fileType === "4") return {
					fileType,
					diagnostic: line
				};
			}
			return null;
		};
		nativeMachoCapturedOutput = (capture) => ({
			stdout: capture.stdout,
			stderr: capture.stderr,
			truncated: false,
			stdout_bytes: capture.stdoutBytes,
			stderr_bytes: capture.stderrBytes,
			exit_code: capture.exitCode,
			signal: capture.signal
		});
		missingUuidLimitation = (mode) => mode === "imports" ? "dyld_info -imports reported 'missing LC_UUID load command'; import observations are unavailable." : "dyld_info -exports reported 'missing LC_UUID load command'; exports include nm symbol-table observations only.";
		unusableNativeCommandOutput = (capture) => new AnalysisOutputError("inspect_macho", `${capture.tool} did not produce a usable inspection result`, { capturedOutput: nativeMachoCapturedOutput(capture) });
		conflictingUuidCommandEvidence = (command) => new AnalysisOutputError("inspect_macho", "dyld_info reported a missing LC_UUID despite an observed LC_UUID load command", { capturedOutput: nativeMachoCapturedOutput(command) });
	})))();
}

//#endregion
//#region dist/native/NativeMachoInspection.js
var DISCOVERY_COMMANDS, SYMBOL_TABLE_EXPORTS, DYLD_INFO_EXPORTS, REQUIRED_SLICE_COMMANDS, OPTIONAL_VTOOL_COMMAND, VTOOL_UNAVAILABLE_LIMITATION, inspectNativeMacho, normalizeMacho, sliceOutput, captureLookup, namesEveryExport, parseNmExports, dependencyPayloadLimitations, covered, uniqueSymbols, fileOffsetLocations, architectureLocations, toolArchitectureName, selectedArchitectureArguments, selectArchitecture;
function init_NativeMachoInspection() {
	return (init_NativeMachoInspection = __esmMin((() => {
		init_analysisErrorCore();
		init_nativeInspection();
		init_jsonValue();
		init_result();
		init_MachoArchitectureSelection();
		init_dyldInfo();
		init_lipo();
		init_echoedPath();
		init_otool();
		init_machoUuid();
		init_unicodeCodePointOrder();
		init_NativeMachoCommandDiagnostics();
		DISCOVERY_COMMANDS = [["lipo", ["-detailed_info"]]];
		SYMBOL_TABLE_EXPORTS = ["nm", ["-gjU", "--no-dyldinfo"]];
		DYLD_INFO_EXPORTS = ["nm", ["-gjU"]];
		REQUIRED_SLICE_COMMANDS = [
			["otool", ["-h", "-l"]],
			SYMBOL_TABLE_EXPORTS,
			["dyld_info", ["-imports"]],
			["dyld_info", ["-exports"]],
			["dwarfdump", ["--uuid"]]
		];
		OPTIONAL_VTOOL_COMMAND = ["vtool", ["-show-build"]];
		VTOOL_UNAVAILABLE_LIMITATION = "vtool is unavailable; build metadata is normalized from otool only.";
		inspectNativeMacho = async (context) => {
			const captures = [];
			for (const [tool, prefix] of DISCOVERY_COMMANDS) {
				const captured = await context.run(tool, [...prefix, context.target.path], context.signal);
				if (!captured.ok) return err(captured.error);
				captures.push(captured.value);
			}
			const lipo = captures.find(({ tool }) => tool === "lipo");
			if (lipo === undefined) throw new TypeError("Missing lipo capture");
			const parsedLipo = parseLipoCapture(lipo, "inspect_macho", context.target.path);
			if (!parsedLipo.ok) return parsedLipo;
			const { format, architectures } = parsedLipo.value;
			const selection = selectArchitecture(context.target, architectures);
			if (selection.status === "absent") return err(new AnalysisOutputError("inspect_macho", `lipo did not list ${selection.architecture}; refusing to read another slice`));
			const selectedArchitecture = selection.status === "selected" ? selection.architecture : null;
			const runSliceCommand = ([tool, prefix]) => context.run(tool, [
				...prefix,
				...selectedArchitectureArguments(tool, selectedArchitecture),
				context.target.path
			], context.signal, tool === "dyld_info" ? (capture) => isMissingUuidDyldFailure(capture) || isUnbackedTextDyldFailure(capture) || parseDyldFileTypeRefusal(capture) !== null : undefined);
			const vtoolSelectsSlice = selectedArchitecture === null || !toolArchitectureName("vtool", selectedArchitecture).includes(".");
			const [required, optional] = await Promise.all([Promise.all(REQUIRED_SLICE_COMMANDS.map((command) => runSliceCommand(command))), vtoolSelectsSlice ? runSliceCommand(OPTIONAL_VTOOL_COMMAND) : null]);
			for (const captured of required) {
				if (!captured.ok) return err(captured.error);
				if ((captured.value.exitCode !== 0 || captured.value.signal !== null) && !isMissingUuidDyldFailure(captured.value) && !isUnbackedTextDyldFailure(captured.value) && parseDyldFileTypeRefusal(captured.value) === null) return err(unusableNativeCommandOutput(captured.value));
				captures.push(captured.value);
			}
			const limitations = [];
			if (optional === null) limitations.push(`vtool cannot select the ${selectedArchitecture} slice; build metadata is normalized from otool only.`);
			else if (optional.ok) captures.push(optional.value);
			else if (optional.error._tag === "AnalysisCapabilityUnavailableError") limitations.push(VTOOL_UNAVAILABLE_LIMITATION);
			else return err(optional.error);
			const nmIndex = captures.findIndex(({ tool }) => tool === "nm");
			const dyldExports = captures.filter(({ tool }) => tool === "dyld_info")[1];
			if (nmIndex < 0 || dyldExports === undefined) throw new TypeError("Missing nm or dyld_info export capture");
			const otool = captures.find(({ tool }) => tool === "otool");
			if (otool === undefined) throw new TypeError("Missing otool capture");
			let load;
			try {
				load = parseOtoolLoadCommands(sliceOutput(otool));
			} catch (cause) {
				return err(new AnalysisOutputError("inspect_macho", "Malformed otool load-command output", {
					cause,
					capturedOutput: nativeMachoCapturedOutput(otool)
				}));
			}
			const unbackedTextFailure = captures.find(isUnbackedTextDyldFailure);
			if (unbackedTextFailure !== undefined) {
				if (![
					"10",
					"DSYM",
					"MH_DSYM"
				].includes(load.fileType ?? "")) return err(unusableNativeCommandOutput(unbackedTextFailure));
				return err(new AnalysisUnsupportedTargetError("inspect_macho", context.target.path, "The selected Mach-O is a dSYM companion whose unbacked text sections are unsupported by dyld_info inspection", {
					capturedOutput: nativeMachoCapturedOutput(unbackedTextFailure),
					remediationAction: "Select the matching linked Mach-O executable for native inspection; this operation does not inspect dSYM companions with unbacked text sections."
				}));
			}
			for (const fileTypeFailure of captures) {
				const refusal = parseDyldFileTypeRefusal(fileTypeFailure);
				if (refusal === null) continue;
				const { fileType, diagnostic } = refusal;
				const typeName = fileType === "4" ? "CORE" : "FVMLIB";
				if (![
					fileType,
					typeName,
					`MH_${typeName}`
				].includes(load.fileType ?? "")) return err(unusableNativeCommandOutput(fileTypeFailure));
				return err(new AnalysisUnsupportedTargetError("inspect_macho", context.target.path, `dyld_info refused the selected Mach-O file type MH_${typeName} (${fileType}): ${diagnostic}`, {
					capturedOutput: nativeMachoCapturedOutput(fileTypeFailure),
					remediationAction: "Select a linked Mach-O executable or relocatable object for native inspection; dyld_info refused the selected file type."
				}));
			}
			const uuidlessDyldFailure = captures.find(isMissingUuidDyldFailure);
			if (uuidlessDyldFailure !== undefined && load.commands.some(({ kind }) => kind === "LC_UUID")) return err(conflictingUuidCommandEvidence(uuidlessDyldFailure));
			if (!isMissingUuidDyldFailure(dyldExports) && !namesEveryExport(captures[nmIndex].stdout, dyldExports)) {
				const withDyldInfo = await runSliceCommand(DYLD_INFO_EXPORTS);
				if (!withDyldInfo.ok) return err(withDyldInfo.error);
				captures[nmIndex] = withDyldInfo.value;
			}
			const selectedArchitectureName = selectedArchitecture ?? (architectures.length === 1 ? architectures[0]?.name ?? null : null);
			const containerOffset = selectedArchitectureName === null ? undefined : format === "thin" ? 0 : architectures.find(({ name }) => name === selectedArchitectureName)?.file_offset ?? undefined;
			const normalized = normalizeMacho(captures, format, context.invocation, limitations, load, architectures, context.target.path, {
				name: selectedArchitectureName,
				container_file_offset: containerOffset ?? null
			});
			const result = containerOffset === undefined ? inspectMachoSchema.parse({
				...normalized,
				limitations: [...normalized.limitations, selectedArchitectureName === null ? "The selected Mach-O slice is unknown; slice-based evidence locations are unavailable." : "The selected Mach-O slice's container file offset was not observed; slice-based evidence locations are unavailable."]
			}) : normalized;
			return ok({
				result: jsonValueSchema.parse(result),
				limitations: result.limitations,
				locations: fileOffsetLocations(result, containerOffset)
			});
		};
		normalizeMacho = (captures, containerFormat, toInvocation, additionalLimitations, load, architectures, artifactPath, selectedArchitecture) => {
			const byTool = captureLookup(captures);
			const dyldImportsCapture = byTool("dyld_info", 0);
			const dyldExportsCapture = byTool("dyld_info", 1);
			const missingImportsUuid = isMissingUuidDyldFailure(dyldImportsCapture);
			const missingExportsUuid = isMissingUuidDyldFailure(dyldExportsCapture);
			const hasChainedFixups = load.commands.some(({ kind }) => kind === "LC_DYLD_CHAINED_FIXUPS");
			const imports = missingImportsUuid ? [] : parseDyldImports(sliceOutput(dyldImportsCapture), hasChainedFixups);
			const imageBase = load.segments.find((segment) => segment.file_offset === 0 && (segment.file_size ?? 0) > 0)?.vm_address ?? null;
			const nmExports = parseNmExports(byTool("nm").stdout);
			const dyldExports = missingExportsUuid ? [] : parseDyldExports(sliceOutput(dyldExportsCapture), imageBase, new Set(nmExports.map(({ name }) => name)));
			const exports = uniqueSymbols([...dyldExports, ...nmExports]);
			const dwarfdump = byTool("dwarfdump");
			const uuid = reconcileMachoUuid(load.commands, dwarfdump.stdout, artifactPath, selectedArchitecture.name === null ? null : {
				name: selectedArchitecture.name,
				dwarfdumpName: toolArchitectureName("dwarfdump", selectedArchitecture.name)
			});
			const provenance = captures.map(toInvocation);
			const threadEntrypoint = load.entrypoints.length === 0 && load.commands.some((command) => command.kind === "LC_UNIXTHREAD" || command.kind === "LC_THREAD");
			const threadEntrypointLimitation = "Thread-state entrypoints (LC_UNIXTHREAD/LC_THREAD) are retained as raw load commands; file offsets are not derived.";
			const limitations = [
				"Imports and exports combine dyld_info and nm; stripped or toolchain-hidden symbols may be absent.",
				...captures.some(({ tool }) => tool === "vtool") ? ["vtool output is retained as provenance but only otool build metadata is normalized."] : [],
				...additionalLimitations,
				...missingImportsUuid ? [missingUuidLimitation("imports")] : [],
				...missingExportsUuid ? [missingUuidLimitation("exports")] : [],
				...uuid.limitations,
				...threadEntrypoint ? [threadEntrypointLimitation] : [],
				...imageBase === null && /^\s*offset\s+symbol\s*$/mu.test(sliceOutput(byTool("dyld_info", 1))) ? ["Export virtual addresses are unavailable because no file-backed image base was observed."] : []
			];
			return inspectMachoSchema.parse({
				format: containerFormat === "fat" ? "mach-o-universal" : "mach-o",
				selected_architecture: selectedArchitecture,
				endian: load.endian,
				word_size: load.wordSize,
				file_type: load.fileType,
				flags: load.flags,
				uuid: uuid.value,
				entrypoints: covered(load.entrypoints, !threadEntrypoint, threadEntrypoint ? [threadEntrypointLimitation] : []),
				architectures: covered(architectures, true),
				build_metadata: covered(load.builds, true),
				load_commands: covered(load.commands, true),
				dependencies: covered(load.dependencies, load.omittedDependencyCommands.length === 0, dependencyPayloadLimitations(load.omittedDependencyCommands)),
				imports: covered(imports, false, [
					"dyld_info textual imports may omit chained or toolchain-unsupported metadata.",
					...missingImportsUuid ? [missingUuidLimitation("imports")] : [],
					...imports.some(({ name_status }) => name_status === "ambiguous") ? ["Chained import text contains symbol/addend expressions whose split is ambiguous."] : []
				]),
				exports: covered(exports, false, [...missingExportsUuid ? [missingUuidLimitation("exports")] : ["Merged nm/dyld_info results may be incomplete for stripped binaries."], ...dyldExports.some(({ sourceSymbol }) => sourceSymbol !== undefined) ? ["Renamed re-exports are listed under their exported name; the source library's symbol name is not reported."] : []]),
				segments: covered(load.segments.map((segment) => ({
					...segment,
					sections: covered(segment.sections, true)
				})), true),
				provenance,
				limitations
			});
		};
		sliceOutput = (capture) => withoutEchoedPathHeader(capture.stdout, capture.arguments.at(-1));
		captureLookup = (captures) => (tool, occurrence = 0) => {
			const capture = captures.filter((item) => item.tool === tool)[occurrence];
			if (capture === undefined) throw new TypeError(`Missing ${tool} capture`);
			return capture;
		};
		namesEveryExport = (nmOutput, dyldExports) => {
			const names = new Set(parseNmExports(nmOutput).map(({ name }) => name));
			return sliceOutput(dyldExports).split("\n").every((rawLine, index) => {
				const line = rawLine.trimStart();
				if (line.length === 0 || index === 0 && line.endsWith(":") || /^-?exports:$/u.test(line) || /^offset\s+symbol$/u.test(line)) return true;
				const rows = parseDyldExports(line, null, names);
				if (rows.length === 0) return names.has(/^0x[\da-f]+\s+(.+)$/isu.exec(line)?.[1] ?? "");
				return rows.length === 1 && names.has(rows[0].name);
			});
		};
		parseNmExports = (output) => output.split("\n").filter((name) => name.length > 0).map((name) => ({
			name,
			address: null,
			weak: null,
			reexport: null,
			source: "nm"
		}));
		dependencyPayloadLimitations = (commands) => {
			if (commands.length === 0) return [];
			const counts = new Map();
			for (const command of commands) counts.set(command, (counts.get(command) ?? 0) + 1);
			const described = [...counts].map(([command, count]) => `${count} ${command}`);
			return [`Dependency inventory omits ${described.join(", ")} because otool -l does not print that command's linkedit install name. trace_dylib_resolution reads the payload.`];
		};
		covered = (items, exhaustive, limitations = []) => ({
			items: [...items],
			total: exhaustive ? items.length : null,
			exhaustive,
			limitations: [...limitations]
		});
		uniqueSymbols = (items) => {
			const unique = new Map();
			for (const item of items) if (!unique.has(item.name)) unique.set(item.name, item);
			return [...unique.values()].sort((left, right) => compareUnicodeCodePoints(left.name, right.name));
		};
		fileOffsetLocations = (macho, containerOffset) => {
			const locations = architectureLocations(macho.architectures.items);
			if (containerOffset === undefined) return locations;
			for (const entrypoint of macho.entrypoints.items) locations.push({
				kind: "file-offset",
				offset: containerOffset + entrypoint.file_offset
			});
			for (const segment of macho.segments.items) {
				if (segment.file_offset === null || segment.file_size === null || segment.file_size === 0) continue;
				locations.push({
					kind: "file-offset-range",
					start: containerOffset + segment.file_offset,
					end: containerOffset + segment.file_offset + segment.file_size
				});
			}
			return locations;
		};
		architectureLocations = (architectures) => {
			const locations = [];
			for (const { file_offset: offset, size } of architectures) {
				if (offset === null) continue;
				locations.push(size === null ? {
					kind: "file-offset",
					offset
				} : {
					kind: "file-offset-range",
					start: offset,
					end: offset + size
				});
			}
			return locations;
		};
		toolArchitectureName = (tool, architecture) => tool === "dyld_info" ? architecture : architecture.replace(/\.v\d+$/u, "");
		selectedArchitectureArguments = (tool, architecture) => {
			if (architecture === null) return [];
			const toolArchitecture = toolArchitectureName(tool, architecture);
			return tool === "dwarfdump" ? [`--arch=${toolArchitecture}`] : ["-arch", toolArchitecture];
		};
		selectArchitecture = (target, available) => {
			if (target.kind !== "executable" || target.availableArchitectures.length < 2 && available.length < 2) return { status: "unfiltered" };
			const normalized = target.architecture === "x86" ? "i386" : target.architecture;
			const policy = MACHO_ARCHITECTURE_POLICIES[target.architecture];
			const selected = policy === undefined ? available.find(({ name }) => name === normalized)?.name : selectMachoArchitectureName(policy, available);
			if (selected !== undefined) return {
				status: "selected",
				architecture: selected
			};
			return {
				status: "absent",
				architecture: normalized
			};
		};
	})))();
}

//#endregion
//#region dist/native/NativeMacOSProvider.js
var NativeMacOSProvider, NativeMacOSClient, nativeCommandCleanupFailure, closeNativeFileScope, nativeOutputFailure, isNativeOperation, translateCodeSignExitFailure, isNonzeroUnsignedObservation, canonicalPath, codeSignCaptureFailure, codeSignArchitectures, invocation, nativePlistObservation, parseEntitlements, nativePlistDecodeFailure, plutilDiagnostic;
function init_NativeMacOSProvider() {
	return (init_NativeMacOSProvider = __esmMin((() => {
		init_NativeCommandAnalysisError();
		init_NativePlistSource();
		init_ArtifactFileOperation();
		init_snapshotEnvironment();
		init_NativeMacOSProviderMetadata();
		init_AppleDispatchMetadata();
		init_NativeUiObservation();
		init_NativeUiCleanupError();
		init_LldbCallTracer();
		init_NativeCallObservation();
		init_AnalysisProvider();
		init_nativeToolContracts();
		init_binaryTargetTypes();
		init_objcSwiftMetadata();
		init_inputIssueProjection();
		init_analysisErrorCore();
		init_nativeDeadlines();
		init_providerAdapterError();
		init_providerCleanupError();
		init_analysisErrorBase();
		init_jsonValue();
		init_plistValue();
		init_plistNumbers();
		init_propertyListKeys();
		init_nativeInspection();
		init_result();
		init_CommandRunner();
		init_SignatureTargetBinding();
		init_codesign();
		init_demangle();
		init_lipo();
		init_plist();
		init_propertyListXmlText();
		init_NativeMachoInspection();
		init_analysisErrorCleanup();
		init_ArtifactResourceScope();
		init_ArtifactReader();
		init_NativeUiHelperRuntime();
		init_NativeUiInterruptionControl();
		init_PlistScalars();
		NativeMacOSProvider = class {
			runner;
			#capabilities;
			#environment;
			#tracerFactory;
			#privateRuntimeRootFactory;
			constructor(environment, runner = new XcrunCommandRunner(environment), platform = process.platform, tracerFactory, privateRuntimeRootFactory) {
				this.runner = runner;
				this.#environment = snapshotEnvironment(environment, platform);
				this.#tracerFactory = tracerFactory ?? (() => new LldbCallTracer(this.#environment));
				this.#privateRuntimeRootFactory = privateRuntimeRootFactory;
				this.#capabilities = nativeMacOSCapabilities(platform);
			}
			identity() {
				return NATIVE_MACOS_PROVIDER_IDENTITY;
			}
			capabilities() {
				return this.#capabilities;
			}
			createClient(target) {
				return new NativeMacOSClient(target, this.runner, this.#tracerFactory(), this.#environment, this.#privateRuntimeRootFactory);
			}
			createBundleResourceClient(root) {
				const plistAvailable = this.#capabilities.some(({ operation, available }) => operation === "inspect_plist" && available);
				return new NativeMacOSClient(undefined, this.runner, this.#tracerFactory(), this.#environment, this.#privateRuntimeRootFactory, root, plistAvailable);
			}
		};
		NativeMacOSClient = class {
			activeTarget;
			runner;
			tracer;
			environment;
			privateRuntimeRootFactory;
			bundleResourceRoot;
			bundlePlistAvailable;
			#pendingNativeUiRuntimes = new Set();
			#pendingCommandOperations = new Set();
			#signatureResources = new ArtifactResourceScope();
			#plistResources = new ArtifactResourceScope();
			#callResources = new ArtifactResourceScope();
			#dispatchResources = new ArtifactResourceScope();
			#nativeUiTail = Promise.resolve();
			#closed = false;
			constructor(activeTarget, runner, tracer, environment, privateRuntimeRootFactory, bundleResourceRoot, bundlePlistAvailable = true) {
				this.activeTarget = activeTarget;
				this.runner = runner;
				this.tracer = tracer;
				this.environment = environment;
				this.privateRuntimeRootFactory = privateRuntimeRootFactory;
				this.bundleResourceRoot = bundleResourceRoot;
				this.bundlePlistAvailable = bundlePlistAvailable;
			}
			get target() {
				if (this.activeTarget === undefined) throw new Error("This provider client has no executable target");
				return this.activeTarget;
			}
			async execute(operation, parameters, options) {
				if (this.#closed) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, "Native provider client is closed"));
				if (options?.signal?.aborted === true) return err(new AnalysisCancelledError(operation, { cause: options.signal.reason }));
				if (operation === "health") return ok(createAnalysisExecution(null, NATIVE_MACOS_PROVIDER_IDENTITY));
				if (this.activeTarget === undefined && operation !== "inspect_plist") return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, "This client is bound to app resource access only."));
				if (this.bundleResourceRoot !== undefined && !this.bundlePlistAvailable) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_plist", "Property list inspection requires a macOS host."));
				if (operation === "inspect_native_dispatch_metadata") {
					const input = nativeDispatchMetadataInputSchema.safeParse(parameters);
					if (!input.success) return err(analysisInputErrorFromIssues(operation, input.error.issues, parameters, { cause: input.error }));
					if (!isAppleDispatchMetadataTarget(this.target)) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, "Binary Apple metadata requires Mach-O; other providers can report symbol-only metadata"));
					try {
						const result = await this.#dispatchResources.run(() => inspectAppleDispatchMetadata(this.target, input.data.max_records, this.#dispatchResources, {
							signal: options?.signal,
							objcClassImportAddresses: input.data.objc_class_import_addresses,
							objcClassImportAddressesComplete: input.data.objc_class_import_addresses_complete ?? true,
							maxInputBytes: input.data.max_input_bytes
						}));
						return ok(createAnalysisExecution(result, result.provider, {
							analysisProfile: APPLE_DISPATCH_METADATA_ANALYSIS_PROFILE,
							locations: [{
								kind: "artifact-path",
								path: this.target.path
							}],
							limitations: result.result.coverage.flatMap(({ reason }) => reason === null ? [] : [reason])
						}));
					} catch (cause) {
						return err(appleDispatchMetadataFailure(cause, this.target.path));
					}
				}
				if (!isNativeOperation(operation)) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, "Operation is not implemented by native macOS tools."));
				if (operation === "observe_native_calls") {
					const result = await observeNativeCalls(this.target, parameters, this.tracer, this.#callResources, options?.signal);
					return result.ok ? ok(createAnalysisExecution(result.value, NATIVE_MACOS_PROVIDER_IDENTITY, {
						limitations: result.value.limitations,
						locations: [{
							kind: "artifact-path",
							path: this.target.path
						}]
					})) : result;
				}
				if (operation === "observe_native_ui" || operation === "capture_native_ui_scenario") {
					return this.#observeNativeUi(operation, parameters, options?.signal);
				}
				const pending = Promise.resolve().then(() => this.#dispatchCommand(operation, parameters, options?.signal));
				this.#pendingCommandOperations.add(pending);
				try {
					const observation = await pending;
					return observation.ok ? ok(createAnalysisExecution(observation.value.result, NATIVE_MACOS_PROVIDER_IDENTITY, {
						limitations: observation.value.limitations,
						locations: observation.value.locations
					})) : err(resolvedAnalysisError(observation.error));
				} catch (cause) {
					return err(nativeOutputFailure(operation, cause));
				} finally {
					this.#pendingCommandOperations.delete(pending);
				}
			}
			async close() {
				this.#closed = true;
				await Promise.allSettled(this.#pendingCommandOperations);
				const uiCleanupFailures = await this.#serializeNativeUi(() => this.#retryNativeUiCleanup());
				const signatureCleanup = await closeNativeFileScope(this.#signatureResources, "signature-snapshot");
				const plistCleanup = await closeNativeFileScope(this.#plistResources, "plist-file");
				const callCleanup = await closeNativeFileScope(this.#callResources, "native-call-target");
				const dispatchCleanup = await closeNativeFileScope(this.#dispatchResources, "native-dispatch-metadata-target");
				const commandCleanup = await this.#retryNativeCommandCleanup();
				let result = await this.tracer.close();
				const cleanupErrors = [
					...uiCleanupFailures.length === 0 ? [] : [this.#nativeUiCleanupFailure(uiCleanupFailures, "close_binary")],
					...commandCleanup === undefined ? [] : [commandCleanup],
					...signatureCleanup === undefined ? [] : [signatureCleanup],
					...plistCleanup === undefined ? [] : [plistCleanup],
					...callCleanup === undefined ? [] : [callCleanup],
					...dispatchCleanup === undefined ? [] : [dispatchCleanup]
				];
				for (const cleanupError of cleanupErrors) result = result.ok ? err(cleanupError) : err(analysisErrorWithCleanupFailure(result.error, cleanupError).bindCleanupDependencies([result.error, cleanupError]));
				return result;
			}
			#observeNativeUi(operation, parameters, signal) {
				return this.#serializeNativeUi(async () => {
					if (this.#closed) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, "Native provider client is closed"));
					const earlierCleanupFailures = await this.#retryNativeUiCleanup();
					if (earlierCleanupFailures.length > 0) return err(this.#nativeUiCleanupFailure(earlierCleanupFailures, operation));
					const deadline = readNativeDeadline(parameters.native_ui_deadline_ms, DEFAULT_NATIVE_UI_DEADLINE_MS);
					if (!deadline.ok) return err(new AnalysisInputError(operation, { userMessage: deadline.message }, [{
						path: ["native_ui_deadline_ms"],
						reason: deadline.reason,
						message: deadline.message,
						minimum: 1,
						maximum: MAX_NATIVE_TIMER_MS
					}]));
					const runtime = createNativeUiHelperRuntime(this.environment, deadline.timeoutMs);
					const interruption = new NativeUiInterruptionControl(signal, runtime.signal, deadline.timeoutMs);
					try {
						this.#pendingNativeUiRuntimes.add(runtime);
						let result;
						try {
							result = await observeNativeUi(this.target, operation, parameters, {
								environment: this.environment,
								runtime,
								interruption
							});
						} catch (cause) {
							result = err(cause instanceof AnalysisError ? cause : new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, { cause }));
						}
						try {
							await runtime.close();
							this.#pendingNativeUiRuntimes.delete(runtime);
						} catch (cause) {
							result = finishNativeUiObservation(result, operation, interruption);
							const cleanup = this.#nativeUiCleanupFailure([{
								runtime,
								cause
							}], operation, result.ok ? result.value : undefined);
							return err(result.ok ? cleanup : analysisErrorWithCleanupFailure(result.error, cleanup, operation).bindCleanupDependencies([result.error, cleanup]));
						}
						result = finishNativeUiObservation(result, operation, interruption);
						return result.ok ? ok(createAnalysisExecution(result.value, NATIVE_MACOS_PROVIDER_IDENTITY, { limitations: result.value.limitations })) : result;
					} finally {
						interruption.dispose();
					}
				});
			}
			#serializeNativeUi(operation) {
				const call = this.#nativeUiTail.then(operation, operation);
				this.#nativeUiTail = call.then(() => undefined, () => undefined);
				return call;
			}
			async #retryNativeUiCleanup() {
				const failures = [];
				for (const runtime of this.#pendingNativeUiRuntimes) {
					try {
						await runtime.close();
						this.#pendingNativeUiRuntimes.delete(runtime);
					} catch (cause) {
						failures.push({
							runtime,
							cause
						});
					}
				}
				return failures;
			}
			async #retryNativeCommandCleanup() {
				if (this.runner.retryCleanup === undefined) return undefined;
				try {
					const failures = await this.runner.retryCleanup();
					return failures.length === 0 ? undefined : nativeCommandCleanupFailure(failures);
				} catch (cause) {
					return new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, ["native-command-process-cleanup"], { reason: cause instanceof Error ? cause.message || cause.name : String(cause) || "native command cleanup failed unexpectedly" }, { cause });
				}
			}
			#nativeUiCleanupFailure(failures, operation, partialObservation) {
				return new NativeUiCleanupError(failures, operation, partialObservation);
			}
			#dispatchCommand(operation, parameters, signal) {
				const timeout = readNativeDeadline(parameters.native_command_timeout_ms, DEFAULT_NATIVE_COMMAND_TIMEOUT_MS);
				if (!timeout.ok) return Promise.resolve(err(new AnalysisInputError(operation, { userMessage: timeout.message }, [{
					path: ["native_command_timeout_ms"],
					reason: timeout.reason,
					message: timeout.message,
					minimum: 1,
					maximum: MAX_NATIVE_TIMER_MS
				}])));
				const timeoutMs = timeout.timeoutMs;
				switch (operation) {
					case "inspect_macho": return this.#inspectMacho(signal, timeoutMs);
					case "inspect_signature": return this.#inspectSignature(signal, timeoutMs);
					case "inspect_plist": return this.#inspectPlist(parameters, signal, timeoutMs);
					case "list_architectures": return this.#listArchitectures(signal, timeoutMs);
					case "demangle_swift": return this.#demangle(parameters, signal, timeoutMs);
				}
			}
			async #listArchitectures(signal, timeoutMs) {
				if (!isMachOFormat(this.target.format)) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "list_architectures", "Active artifact is not Mach-O."));
				const capture = await this.#run("list_architectures", "lipo", ["-detailed_info", this.target.path], {
					signal,
					timeoutMs
				});
				if (!capture.ok) return capture;
				const provenance = [invocation(capture.value, this.target.path)];
				const parsed = parseLipoCapture(capture.value, "list_architectures", this.target.path);
				if (!parsed.ok) return parsed;
				const { architectures } = parsed.value;
				const result = listArchitecturesSchema.parse({
					architectures: {
						items: architectures,
						total: architectures.length,
						exhaustive: true,
						limitations: []
					},
					provenance,
					limitations: []
				});
				return ok({
					result: jsonValueSchema.parse(result),
					limitations: [],
					locations: architectureLocations(result.architectures.items)
				});
			}
			async #demangle(parameters, signal, timeoutMs) {
				const symbols = z.array(z.string()).safeParse(parameters.symbols);
				if (!symbols.success) return err(new AnalysisOutputError("demangle_swift", "symbols were not parsed strings"));
				const capture = await this.#run("demangle_swift", "swift-demangle", [
					"--compact",
					"--",
					...symbols.data
				], {
					signal,
					timeoutMs
				});
				if (!capture.ok) return capture;
				const provenance = [invocation(capture.value, this.target.path)];
				const result = demangleSwiftSchema.parse({
					symbols: parseDemangledSymbols(symbols.data, capture.value.stdout),
					provenance,
					limitations: []
				});
				return ok({
					result: jsonValueSchema.parse(result),
					limitations: [],
					locations: []
				});
			}
			async #inspectSignature(signal, timeoutMs) {
				if (this.target.kind !== "executable" || !isMachOFormat(this.target.format)) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_signature", "Active artifact is not Mach-O; its container-level signature layer is not evaluated by codesign."));
				const inspected = await withSignatureTarget(this.target, this.#signatureResources, (binding) => this.#inspectBoundSignature(binding, signal, timeoutMs), signal, this.privateRuntimeRootFactory);
				return inspected.ok ? ok({
					result: inspected.value,
					limitations: inspected.value.limitations,
					locations: []
				}) : inspected;
			}
			async #inspectBoundSignature(binding, signal, timeoutMs) {
				const architecture = this.target.kind === "executable" ? this.target.architecture : undefined;
				if (architecture === undefined) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_signature", "No executable architecture is selected."));
				const selectedArchitecture = architecture === "x86" ? "i386" : architecture;
				const executablePaths = [binding.snapshotPath, ...await canonicalPath(binding.snapshotPath)];
				const display = await this.#captureSignature(binding, [
					"-d",
					"-a",
					selectedArchitecture,
					"--verbose=4"
				], signal, timeoutMs);
				if (!display.ok) return display;
				const unsigned = isNonzeroUnsignedObservation(display.value, binding.snapshotPath, executablePaths);
				const displayFailure = codeSignCaptureFailure(display.value, binding.snapshotPath, executablePaths);
				if (displayFailure !== null) return err(displayFailure);
				const requirements = await this.#captureSignature(binding, [
					"-d",
					"-a",
					selectedArchitecture,
					"-r-"
				], signal, timeoutMs);
				if (!requirements.ok) return requirements;
				const requirementsFailure = codeSignCaptureFailure(requirements.value, binding.snapshotPath, executablePaths);
				if (requirementsFailure !== null) return err(requirementsFailure);
				const entitlements = await this.#captureSignature(binding, [
					"-d",
					"-a",
					selectedArchitecture,
					"--entitlements",
					":-"
				], signal, timeoutMs);
				if (!entitlements.ok) return entitlements;
				const entitlementsFailure = codeSignCaptureFailure(entitlements.value, binding.snapshotPath, executablePaths);
				if (entitlementsFailure !== null) return err(entitlementsFailure);
				const parsed = parseCodeSignature(display.value.stderr, unsigned, executablePaths);
				const requirementText = /designated\s*=>\s*(.+)$/mu.exec(requirements.value.stdout)?.[1] ?? null;
				const entitlementValue = parseEntitlements(entitlements.value.stdout);
				const captures = [
					display.value,
					requirements.value,
					entitlements.value
				];
				const limitations = [
					...parsed.limitations,
					...entitlementValue.limitations.map((note) => `Entitlements: ${note}`),
					"Inspected a digest-verified Mach-O byte snapshot; filesystem-bound signing context and trust validation are not examined.",
					...entitlementValue.omittedPrototypeKeys === 0 ? [] : [`Entitlements: ${omittedPrototypeKeysLimitation(entitlementValue.omittedPrototypeKeys)}`]
				];
				const architectures = codeSignArchitectures(parsed.format, this.target);
				if (architectures.length > 1) limitations.push(`Partial signature coverage: signature identity, hashes, designated requirement, entitlements and runtime state describe the requested ${selectedArchitecture} architecture; other slices' metadata is not returned.`);
				if (!unsigned && isNonzeroUnsignedObservation(requirements.value, binding.snapshotPath, executablePaths)) limitations.push("The designated requirement for the requested architecture is unavailable because codesign reported it unsigned.");
				if (!unsigned && isNonzeroUnsignedObservation(entitlements.value, binding.snapshotPath, executablePaths)) limitations.push("The entitlements for the requested architecture are unavailable because codesign reported it unsigned.");
				const observation = () => inspectSignatureSchema.parse({
					...parsed,
					designated_requirement: requirementText,
					entitlements: entitlementValue.value,
					provenance: captures.map((capture) => invocation(capture, binding.snapshotPath)),
					limitations
				});
				if (architectures.length > 1) {
					const slices = await this.#inspectSignatureSliceStates(binding, parsed.format, executablePaths, {
						captures,
						limitations
					}, signal, timeoutMs);
					if (!slices.ok) {
						limitations.push("Architecture-specific signature inspection did not complete; remaining slice signing states are unknown.");
						return err(slices.error.retainPartialObservation(observation()));
					}
				}
				const version = await verifySignatureTarget(this.target, binding, signal);
				if (!version.ok) return err(version.error.retainPartialObservation(observation()));
				return ok(observation());
			}
			async #inspectSignatureSliceStates(binding, format, executablePaths, observation, signal, timeoutMs) {
				const { captures, limitations } = observation;
				const unsigned = [];
				let unsignedNote;
				for (const architecture of codeSignArchitectures(format, this.target)) {
					const slice = await this.#captureSignature(binding, [
						"-d",
						"-a",
						architecture,
						"--verbose=4"
					], signal, timeoutMs);
					if (!slice.ok) return slice;
					captures.push(slice.value);
					if (slice.value.exitCode === 0) continue;
					const failure = codeSignCaptureFailure(slice.value, binding.snapshotPath, executablePaths);
					if (failure !== null) return err(failure);
					unsigned.push(architecture);
					if (unsignedNote === undefined) {
						unsignedNote = limitations.length;
						limitations.push("");
					}
					limitations[unsignedNote] = `Unsigned Mach-O slices: ${unsigned.join(", ")}.`;
				}
				return ok(undefined);
			}
			async #captureSignature(binding, args, signal, timeoutMs) {
				const before = await verifySignatureTarget(this.target, binding, signal);
				if (!before.ok) return before;
				let capture;
				try {
					capture = await this.#run("inspect_signature", "codesign", [...args, binding.snapshotPath], {
						signal,
						acceptNonZero: true,
						timeoutMs
					});
				} catch (cause) {
					capture = err(new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_signature", {
						cause,
						diagnostics: {
							phase: "codesign-capture",
							path: this.target.path,
							reason: cause instanceof Error ? cause.message : String(cause)
						}
					}));
				}
				const after = await verifySignatureTarget(this.target, binding, signal);
				return after.ok ? capture : after;
			}
			async #inspectPlist(parameters, signal, timeoutMs) {
				const requested = parameters.path;
				if (requested !== undefined && typeof requested !== "string") return err(new AnalysisOutputError("inspect_plist", "path was not a string"));
				try {
					return await this.#plistResources.run(async () => {
						try {
							const plist = this.bundleResourceRoot === undefined ? await resolveNativePlistSelection(this.target, requested) : resolveBundleResourcePlistSelection(this.bundleResourceRoot, requested);
							if (!plist.ok) return plist;
							const fileInput = {
								selection: plist.value,
								resources: this.#plistResources,
								signal,
								timeoutMs
							};
							const selected = await requireRegularPlist(fileInput);
							if (!selected.ok) return selected;
							const classified = await this.#run("inspect_plist", "file", ["-b", plist.value.path], {
								signal,
								timeoutMs
							});
							if (!classified.ok) return classified;
							const binary = await this.#inspectBinaryPlist(fileInput, classified.value);
							if (binary !== undefined) return binary;
							const format = await plistSourceFormat(classified.value.stdout, fileInput);
							if (!format.ok) return format;
							const source = await this.#inspectTextPlist(fileInput, classified.value, format.value);
							if (source !== undefined) return source;
							return await this.#inspectConvertedPlist(fileInput, classified.value, format.value);
						} catch (cause) {
							return err(nativeOutputFailure("inspect_plist", cause));
						}
					});
				} catch (cause) {
					return err(nativePlistFailure(cause, undefined));
				}
			}
			async #inspectBinaryPlist(fileInput, classified) {
				if (!isBinaryPlistDescription(classified.stdout)) return undefined;
				const source = await readNativePlistBytes(fileInput);
				if (!source.ok) return source;
				const parsed = parsePlistBinary(source.value);
				if (!parsed.ok) {
					if (parsed.error instanceof UnsupportedBinaryPlistUidError) return err(new AnalysisUnsupportedTargetError("inspect_plist", fileInput.selection.path, parsed.error.message, { cause: parsed.error }));
					return parsed.error instanceof AnalysisOutputError ? err(unreadablePlist(fileInput.selection, "binary property list could not be decoded", { cause: parsed.error })) : err(parsed.error);
				}
				return ok(nativePlistObservation({
					parsed: parsed.value,
					format: "binary",
					path: fileInput.selection.path,
					resourceRoot: this.bundleResourceRoot,
					provenance: [invocation(classified, fileInput.selection.path, "$PLIST")]
				}));
			}
			async #inspectTextPlist(fileInput, classified, format) {
				const source = await readNativePlistBytes(fileInput);
				if (!source.ok) return source;
				let parsed;
				const provenance = [invocation(classified, fileInput.selection.path, "$PLIST")];
				if (format === "xml") {
					parsed = parsePlistXmlSource(source.value);
					if (parsed.ok) {
						const validated = await this.#run("inspect_plist", "plutil", [
							"-lint",
							"--",
							fileInput.selection.path
						], {
							signal: fileInput.signal,
							acceptNonZero: true,
							timeoutMs: fileInput.timeoutMs
						});
						if (!validated.ok) return validated;
						if (validated.value.exitCode !== 0) return err(nativePlistDecodeFailure(fileInput.selection, validated.value));
						provenance.push(invocation(validated.value, fileInput.selection.path, "$PLIST"));
					}
					if (!parsed.ok && parsed.error instanceof XmlPlistTextDecodeError && parsed.error.reason === "unsupported-encoding") return undefined;
				} else {
					const json = readPlistJsonSource(source.value);
					if (json === undefined || json.rootKind === "invalid" || json.rootKind !== "container" && format !== "json" || json.needsNumberTypes || json.nonFiniteNumberObserved) return undefined;
					parsed = json.project();
				}
				if (!parsed.ok) return parsed.error instanceof AnalysisOutputError || parsed.error instanceof XmlPlistTextDecodeError ? err(unreadablePlist(fileInput.selection, parsed.error.message, { cause: parsed.error })) : err(parsed.error);
				return ok(nativePlistObservation({
					parsed: parsed.value,
					format,
					path: fileInput.selection.path,
					resourceRoot: this.bundleResourceRoot,
					provenance
				}));
			}
			async #inspectConvertedPlist(fileInput, classified, format) {
				const { path } = fileInput.selection;
				const { signal, timeoutMs } = fileInput;
				const json = await this.#run("inspect_plist", "plutil", [
					"-convert",
					"json",
					"-o",
					"-",
					"--",
					path
				], {
					signal,
					acceptNonZero: true,
					timeoutMs
				});
				if (!json.ok) return json;
				const jsonDecoded = json.value.exitCode === 0;
				const jsonAttempt = jsonDecoded ? readPlistJson(json.value.stdout) : undefined;
				let xml;
				let parsed;
				if (jsonAttempt === undefined || jsonAttempt.needsNumberTypes) {
					const converted = await this.#run("inspect_plist", "plutil", [
						"-convert",
						"xml1",
						"-o",
						"-",
						"--",
						path
					], {
						signal,
						acceptNonZero: !jsonDecoded,
						timeoutMs
					});
					if (!converted.ok) return converted;
					xml = converted.value;
					if (xml.exitCode !== 0) {
						return err(nativePlistDecodeFailure(fileInput.selection, xml));
					}
					parsed = jsonAttempt === undefined ? parsePlistXml(xml.stdout) : jsonAttempt.project(xml.stdout);
				} else {
					parsed = jsonAttempt.project();
				}
				if (!parsed.ok) return parsed;
				const provenance = [
					classified,
					json.value,
					...xml === undefined ? [] : [xml]
				].map((item) => invocation(item, path, "$PLIST"));
				return ok(nativePlistObservation({
					parsed: parsed.value,
					format,
					path,
					resourceRoot: this.bundleResourceRoot,
					provenance
				}));
			}
			async #inspectMacho(signal, timeoutMs) {
				if (!isMachOFormat(this.target.format)) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_macho", "Active artifact is not Mach-O."));
				return inspectNativeMacho({
					target: this.target,
					...signal === undefined ? {} : { signal },
					run: (tool, arguments_, commandSignal, acceptNonZeroIf) => this.#run("inspect_macho", tool, arguments_, {
						signal: commandSignal,
						timeoutMs,
						...acceptNonZeroIf === undefined ? {} : { acceptNonZeroIf }
					}),
					invocation: (capture) => invocation(capture, this.target.path)
				});
			}
			async #run(operation, tool, arguments_, options) {
				const captured = await this.runner.run(tool, arguments_, {
					...options.signal === undefined ? {} : { signal: options.signal },
					timeoutMs: options.timeoutMs,
					acceptNonZero: options.acceptNonZero ?? options.acceptNonZeroIf !== undefined
				});
				if (captured.ok) {
					const hasFailedExit = captured.value.exitCode !== 0 || captured.value.signal !== null;
					if (hasFailedExit && options.acceptNonZeroIf !== undefined && !options.acceptNonZeroIf(captured.value)) return err(translateNativeCommandFailure(operation, new NativeCommandFailure(tool, captured.value.signal !== null || captured.value.exitCode !== null && captured.value.exitCode !== 0 ? "nonzero-exit" : "io", captured.value.exitCode, undefined, {
						stdout: captured.value.stdout,
						stderr: captured.value.stderr,
						stdoutBytes: captured.value.stdoutBytes,
						stderrBytes: captured.value.stderrBytes,
						exitCode: captured.value.exitCode,
						signal: captured.value.signal,
						truncated: false
					})));
					return captured;
				}
				return err(translateNativeCommandFailure(operation, captured.error, options.timeoutMs));
			}
		};
		nativeCommandCleanupFailure = (failures) => {
			const failure = new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, [...new Set(failures.flatMap(({ resources }) => resources))], {
				reason: "Native command process cleanup remains incomplete",
				failures: failures.map(({ reason, resources }) => ({
					reason,
					resources: [...resources]
				}))
			});
			if (failures.length === 0 || failures.some(({ marker }) => marker === undefined)) return failure;
			const markers = failures.flatMap(({ marker }) => marker === undefined ? [] : [marker]);
			return markers.length === 0 ? failure : failure.bindCleanupDependencies(markers);
		};
		closeNativeFileScope = async (scope, resource) => {
			try {
				await scope.close();
				return undefined;
			} catch (cause) {
				const observation = ArtifactReaderFailure.cleanupObservation(cause, resource);
				const failure = new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, observation.resources, { reason: observation.reason }, {
					operation: "close_binary",
					cause
				});
				bindArtifactFileCleanup(cause, failure);
				return failure;
			}
		};
		nativeOutputFailure = (operation, cause) => new AnalysisOutputError(operation, "Native output parsing failed", { cause });
		isNativeOperation = (operation) => NATIVE_TOOL_CONTRACTS.some(({ name }) => name === operation);
		translateCodeSignExitFailure = (capture) => translateNativeCommandFailure("inspect_signature", new NativeCommandFailure("codesign", "nonzero-exit", capture.exitCode, undefined, failureCapture(capture, false)));
		isNonzeroUnsignedObservation = (capture, snapshotPath, executablePaths) => {
			if (capture.exitCode === null || capture.exitCode === 0 || capture.signal !== null || capture.arguments.at(-1) !== snapshotPath || capture.stdout !== "") return false;
			const diagnostic = `${snapshotPath}: code object is not signed at all`;
			return ["", ...executablePaths.flatMap((path) => [`Executable=${path}\n`, `Executable=${path}\r\n`])].some((prefix) => [
				diagnostic,
				`${diagnostic}\n`,
				`${diagnostic}\r\n`
			].some((body) => capture.stderr === `${prefix}${body}`));
		};
		canonicalPath = async (path) => {
			try {
				return [await realpath(path)];
			} catch {
				return [];
			}
		};
		codeSignCaptureFailure = (capture, snapshotPath, executablePaths) => capture.exitCode === 0 || isNonzeroUnsignedObservation(capture, snapshotPath, executablePaths) ? null : translateCodeSignExitFailure(capture);
		codeSignArchitectures = (format, target) => {
			const universal = /^Mach-O universal \(([^)\r\n]+)\)$/u.exec(format ?? "")?.[1];
			if (universal !== undefined) {
				const architectures = universal.split(/\s+/u).filter((architecture) => /^[A-Za-z][A-Za-z0-9_.]*$/u.test(architecture));
				if (architectures.length > 0) return [...new Set(architectures)];
			}
			if (format?.startsWith("Mach-O thin ") === true) return [];
			if (target.kind !== "executable" || !isMachOFormat(target.format)) return [];
			return target.availableArchitectures.map((architecture) => architecture === "x86" ? "i386" : architecture);
		};
		invocation = (capture, artifactPath, alias = "$ARTIFACT") => ({
			tool: capture.tool,
			command: [capture.executable, ...capture.arguments.map((argument) => argument === artifactPath ? alias : argument)],
			tool_version: capture.toolVersion,
			version_reason: capture.versionReason,
			executable_sha256: capture.executableSha256,
			exit: {
				code: capture.exitCode,
				signal: capture.signal
			},
			stdout_bytes: capture.stdoutBytes,
			stderr_bytes: capture.stderrBytes
		});
		nativePlistObservation = (input) => {
			const { parsed, format, path, resourceRoot, provenance } = input;
			const result = inspectPlistSchema.parse({
				format,
				value: parsed.value,
				bundle: parsed.bundle,
				source_path: path,
				...resourceRoot === undefined ? {} : { resource_root: {
					caller_path: resourceRoot.callerPath,
					canonical_path: resourceRoot.canonicalPath,
					info_plist_path: resourceRoot.infoPlistPath,
					layout: resourceRoot.layout,
					executable_sha256: resourceRoot.executableSha256
				} },
				provenance,
				limitations: parsed.limitations
			});
			return {
				result: jsonValueSchema.parse(result),
				limitations: parsed.limitations,
				locations: [{
					kind: "artifact-path",
					path
				}]
			};
		};
		parseEntitlements = (output) => {
			const start = output.indexOf("<?xml");
			const end = output.lastIndexOf("</plist>");
			if (start < 0 || end < start) return {
				value: null,
				omittedPrototypeKeys: 0,
				limitations: []
			};
			const decoded = parseXmlPropertyList(output.slice(start, end + "</plist>".length));
			const projected = projectPlistValue(decoded.value);
			const numbers = createPlistNumberProjection(decoded.numberLiterals);
			const value = numbers.project(projected.value);
			return {
				value,
				omittedPrototypeKeys: decoded.omittedPrototypeKeys,
				limitations: [
					...numbers.limitations(),
					...projected.nonFiniteRealCount === 0 ? [] : [nonFiniteRealLimitation(projected.nonFiniteRealCount)],
					...projected.negativeZeroRealCount === 0 ? [] : [negativeZeroRealLimitation(projected.negativeZeroRealCount)],
					...projected.unknownDateCount === 0 ? [] : [unknownDateLimitation(projected.unknownDateCount)],
					...projected.unknownScalarCount === 0 ? [] : [unknownScalarLimitation(projected.unknownScalarCount)]
				]
			};
		};
		nativePlistDecodeFailure = (selection, command) => {
			const capture = failureCapture(command, false);
			return unreadablePlist(selection, `plutil could not decode it as a property list (${plutilDiagnostic(capture, selection.path)})`, { capturedOutput: {
				stdout: capture.stdout,
				stderr: capture.stderr,
				truncated: capture.truncated,
				stdout_bytes: capture.stdoutBytes,
				stderr_bytes: capture.stderrBytes,
				exit_code: capture.exitCode,
				signal: capture.signal
			} });
		};
		plutilDiagnostic = (capture, path) => {
			const diagnostics = [capture.stderr, capture.stdout].map((stream) => {
				const text = stream.trim();
				return text.startsWith(`${path}: `) ? text.slice(path.length + 2) : text;
			}).filter((text) => text.length > 0);
			return diagnostics.length === 0 ? "plutil printed no diagnostic" : diagnostics.join("\n");
		};
	})))();
}

//#endregion
init_NativeMacOSProvider();
export { NativeMacOSProvider };