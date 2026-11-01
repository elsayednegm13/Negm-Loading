import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { i as resolvedAnalysisError, n as init_analysisErrorBase, r as primaryAnalysisError, t as AnalysisError } from "./analysisErrorBase-BNnZv0cP.js";
import { i as init_configurationErrors, n as ConfigurationError, r as NoBinaryOpenError, t as BinaryTargetError } from "./configurationErrors-B8zPbKDE.js";
import { a as AnalysisCapabilityUnavailableError, d as AnalysisUnsupportedTargetError, f as init_analysisErrorCore, i as AnalysisCancelledError, l as AnalysisResourceConstraintError, n as AnalysisAccessDeniedError, o as AnalysisInputError, r as AnalysisArtifactChangedError, s as AnalysisOutputError, u as AnalysisTimeoutError } from "./analysisErrorCore-Cl6H9zyu.js";
import { i as jsonValueSchema, m as isImmutableJsonSnapshot, n as init_jsonValue, p as init_immutableJson } from "./jsonValue-CvnZ7JX6.js";
import { z } from "zod";

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
//#region dist/domain/hopperStartupFailure.js
var failures, HOPPER_STARTUP_FAILURES, hopperStartupFailure, hopperStartupExitCode, isHopperStartupFailureCode;
function init_hopperStartupFailure() {
	return (init_hopperStartupFailure = __esmMin((() => {
		failures = [
			[
				70,
				"private_display_unavailable",
				"REA could not start its private Linux display. Install Xvfb, then rerun rea doctor."
			],
			[
				71,
				"x11_authorization_failed",
				"REA could not authorize its private Linux display. Install xauth, then rerun rea doctor."
			],
			[
				72,
				"unsupported_hopper_build",
				"This Hopper build is not supported for unattended Linux analysis. Unset HOPPER_LAUNCHER_PATH and rerun rea setup --yes --install-hopper, or update REA."
			],
			[
				73,
				"invalid_launch_command",
				"REA refused an unexpected Hopper launch command. Check HOPPER_LAUNCHER_PATH and rerun rea doctor."
			],
			[
				74,
				"process_ownership_mismatch",
				"REA could not verify ownership of the launched Hopper process and stopped safely. Close other Hopper sessions and retry."
			],
			[
				75,
				"hopper_exited_during_startup",
				"Hopper exited before the REA bridge was ready. In CI, run rea doctor --provider hopper --json; if Hopper showed a UI or license prompt, complete it in the runner user session, otherwise close stale Hopper sessions and retry."
			],
			[
				76,
				"unsupported_demo_dialog",
				"This Hopper demo dialog is not supported for unattended Linux analysis. Update REA or use a supported Hopper build."
			],
			[
				77,
				"unexpected_display_geometry",
				"REA's private Linux display did not match the validated layout. Close custom display overrides and retry."
			],
			[
				78,
				"x11_input_failed",
				"REA could not activate Hopper's validated demo control. Install the XTEST runtime, then rerun rea doctor."
			],
			[
				79,
				"runtime_dependency_unavailable",
				"A Linux demo-session dependency is unavailable. Rerun rea setup --yes --install-hopper, then rea doctor."
			],
			[
				80,
				"x11_socket_directory_unusable",
				"REA cannot use the host X11 socket directory for a private display. Run rea doctor --provider hopper for exact mount and namespace diagnostics."
			]
		];
		HOPPER_STARTUP_FAILURES = new Map(failures.map(([exitCode, code, message]) => [exitCode, {
			code,
			message
		}]));
		hopperStartupFailure = (exitCode) => exitCode === null ? undefined : HOPPER_STARTUP_FAILURES.get(exitCode);
		hopperStartupExitCode = (code) => failures.find(([, candidate]) => candidate === code)?.[0];
		isHopperStartupFailureCode = (value) => failures.some(([, candidate]) => candidate === value);
	})))();
}

//#endregion
//#region dist/domain/hopperErrors.js
var HopperError, HopperTimeoutError, HopperCancelledError, hopperCancelledBySignal, HopperProtocolError, HopperRemoteError, HopperProcessError, HopperStartError;
function init_hopperErrors() {
	return (init_hopperErrors = __esmMin((() => {
		init_analysisErrorBase();
		init_hopperStartupFailure();
		HopperError = class extends AnalysisError {};
		HopperTimeoutError = class extends HopperError {
			timeoutMs;
			operation;
			requestId;
			providerState;
			stage;
			launcherOutcome;
			_tag = "HopperTimeoutError";
			constructor(timeoutMs, operation, requestId, providerState = "not_started", stage = operation === undefined ? "launch" : "analysis", launcherOutcome, options = {}) {
				super(`Hopper ${operation === undefined ? "startup" : operation} timed out after ${String(timeoutMs)}ms`, options);
				this.timeoutMs = timeoutMs;
				this.operation = operation;
				this.requestId = requestId;
				this.providerState = providerState;
				this.stage = stage;
				this.launcherOutcome = launcherOutcome;
			}
		};
		HopperCancelledError = class extends HopperError {
			_tag = "HopperCancelledError";
			constructor(...parameters) {
				const errorOptions = { ...parameters[1] };
				if (parameters.length > 0) Object.defineProperty(errorOptions, "cause", {
					configurable: true,
					enumerable: true,
					value: parameters[0],
					writable: true
				});
				super("Hopper operation was cancelled", errorOptions);
			}
		};
		hopperCancelledBySignal = (signal) => signal?.aborted === true ? new HopperCancelledError(signal.reason) : new HopperCancelledError();
		HopperProtocolError = class extends HopperError {
			_tag = "HopperProtocolError";
		};
		HopperRemoteError = class extends HopperError {
			code;
			safeMessage;
			_tag = "HopperRemoteError";
			diagnosticType;
			operation;
			requestId;
			constructor(code, safeMessage, context = {}) {
				super(`Hopper request failed (${String(code)}): ${safeMessage}`, context);
				this.code = code;
				this.safeMessage = safeMessage;
				this.diagnosticType = context.diagnosticType ?? "remote";
				this.operation = context.operation;
				this.requestId = context.requestId;
			}
		};
		HopperProcessError = class extends HopperError {
			exitCode;
			_tag = "HopperProcessError";
			failureCode;
			userMessage;
			providerState;
			stage;
			diagnostic;
			operation;
			requestId;
			launcherFailure;
			constructor(exitCode, context = {}) {
				super(`Hopper bridge stopped unexpectedly with code ${String(exitCode)}`, context);
				this.exitCode = exitCode;
				this.diagnostic = context.diagnostic;
				this.operation = context.operation;
				this.requestId = context.requestId;
				this.launcherFailure = context.launcherFailure;
				const failure = hopperStartupFailure(exitCode);
				this.stage = context.stage ?? (failure === undefined ? context.operation === undefined ? "connection" : "analysis" : "launch");
				this.failureCode = failure?.code;
				this.userMessage = failure?.message;
				this.providerState = context.providerState ?? (exitCode === null ? "unknown" : "exited");
			}
		};
		HopperStartError = class extends HopperError {
			_tag = "HopperStartError";
			userMessage;
			ownerRunId;
			launcherFailure;
			launchRejection;
			constructor(options) {
				super("Hopper application bridge could not be started", options);
				this.userMessage = options?.userMessage;
				this.ownerRunId = options?.ownerRunId;
				this.launcherFailure = options?.launcherFailure;
				this.launchRejection = options?.launchRejection;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/artifactIntegrity.js
var sha256, md5, artifactIntegrityClaimSchema, artifactSha256PairSchema, artifactMd5PairSchema, artifactIntegrityPair, artifactIntegrityPairOf, artifactIntegrityDetails, projectArtifactIntegrityDetails;
function init_artifactIntegrity() {
	return (init_artifactIntegrity = __esmMin((() => {
		sha256 = z.string().regex(/^[a-f0-9]{64}$/u);
		md5 = z.string().regex(/^[a-f0-9]{32}$/u);
		artifactIntegrityClaimSchema = z.discriminatedUnion("algorithm", [z.strictObject({
			algorithm: z.literal("sha256"),
			digest: sha256
		}), z.strictObject({
			algorithm: z.literal("md5"),
			digest: md5
		})]);
		artifactSha256PairSchema = z.object({
			declared_sha256: sha256,
			observed_sha256: sha256
		});
		artifactMd5PairSchema = z.object({
			algorithm: z.literal("md5"),
			declared_md5: md5,
			observed_md5: md5
		});
		artifactIntegrityPair = (claim, observed) => claim.algorithm === "sha256" ? {
			declared_sha256: claim.digest,
			observed_sha256: observed
		} : {
			algorithm: "md5",
			declared_md5: claim.digest,
			observed_md5: observed
		};
		artifactIntegrityPairOf = (pair) => "declared_sha256" in pair ? {
			declared_sha256: pair.declared_sha256,
			observed_sha256: pair.observed_sha256
		} : {
			algorithm: pair.algorithm,
			declared_md5: pair.declared_md5,
			observed_md5: pair.observed_md5
		};
		artifactIntegrityDetails = (logicalPath, claim, observed, unpacked) => ({
			logicalPath,
			unpacked,
			...claim?.algorithm === "md5" ? {
				algorithm: "md5",
				declaredMd5: claim.digest,
				calculatedMd5: observed
			} : {
				declaredSha256: claim?.digest ?? null,
				calculatedSha256: observed
			}
		});
		projectArtifactIntegrityDetails = (details) => ({
			logical_path: details.logicalPath,
			..."declaredSha256" in details ? {
				declared_sha256: details.declaredSha256,
				calculated_sha256: details.calculatedSha256
			} : {
				algorithm: details.algorithm,
				declared_md5: details.declaredMd5,
				calculated_md5: details.calculatedMd5
			},
			unpacked: details.unpacked
		});
	})))();
}

//#endregion
//#region dist/domain/artifactOperationError.js
var ArtifactOperationError, artifactDetailsMessage;
function init_artifactOperationError() {
	return (init_artifactOperationError = __esmMin((() => {
		init_artifactIntegrity();
		init_analysisErrorBase();
		ArtifactOperationError = class extends AnalysisError {
			operation;
			reason;
			artifactDetails;
			detail;
			_tag = "ArtifactOperationError";
			userMessage;
			admission;
			boundary;
			constructor(operation, reason, artifactDetails, detail, options) {
				super(artifactDetails === undefined ? `Artifact ${operation} failed: ${reason}` : artifactDetailsMessage(operation, reason, artifactDetails), options);
				this.operation = operation;
				this.reason = reason;
				this.artifactDetails = artifactDetails;
				this.detail = detail;
				this.admission = options?.admission;
				this.boundary = options?.boundary;
				this.userMessage = options?.userMessage ?? (options?.admission === undefined ? undefined : detail);
			}
		};
		artifactDetailsMessage = (operation, reason, details) => {
			const { logical_path, ...facts } = projectArtifactIntegrityDetails(details);
			const description = Object.entries(facts).map(([key, value]) => `${key}=${String(value ?? "unavailable")}`).join(", ");
			return `Artifact ${operation} failed: ${reason} at ${logical_path} (${description})`;
		};
	})))();
}

//#endregion
//#region dist/domain/browserObservationError.js
var browserCleanupObservation, BrowserObservationError, observationFailureMessage;
function init_browserObservationError() {
	return (init_browserObservationError = __esmMin((() => {
		init_analysisErrorBase();
		init_analysisErrorCore();
		browserCleanupObservation = (cause) => cause instanceof AnalysisError && cause.cleanup !== undefined ? cause.cleanup : {
			reason: cause instanceof Error ? cause.message : String(cause),
			resources: cause instanceof AnalysisError && cause.cleanupResources.length > 0 ? cause.cleanupResources : ["browser_transport"]
		};
		BrowserObservationError = class BrowserObservationError extends AnalysisError {
			operation;
			reason;
			_tag = "BrowserObservationError";
			cleanupIncomplete;
			userCategory;
			userMessage;
			/** Producer-supplied explanation; undefined selects the operation default. */
			detail;
			remediationAction;
			constructor(operation, reason, options) {
				super(`Browser observation ${operation} failed: ${reason}`, options);
				this.operation = operation;
				this.reason = reason;
				this.detail = options?.detail;
				this.userMessage = options?.detail ?? observationFailureMessage(operation, reason);
				this.remediationAction = options?.remediationAction;
				this.cleanupIncomplete = this.cleanup !== undefined || reason === "cleanup_failed";
				this.setCleanupResources(this.cleanup?.resources ?? (reason === "cleanup_failed" ? ["browser_transport"] : []));
				this.userCategory = reason === "cancelled" || options?.cause instanceof AnalysisCancelledError || options?.cause instanceof AnalysisError && options.cause.userCategory === "cancelled" ? "cancelled" : undefined;
			}
			/**
			* Attribute this failure to the caller's operation without discarding
			* producer facts; the original cause keeps the primary failure chain intact.
			*/
			forOperation(operation) {
				if (operation === this.operation) return this;
				return new BrowserObservationError(operation, this.reason, {
					cause: this.cause,
					...this.detail === undefined ? {} : { detail: this.detail },
					...this.remediationAction === undefined ? {} : { remediationAction: this.remediationAction },
					cleanupPrimary: this.cleanupPrimary,
					diagnostics: this.diagnostics,
					capturedOutput: this.capturedOutput,
					cleanup: this.cleanup,
					partialObservation: this.partialObservation
				});
			}
		};
		observationFailureMessage = (operation, reason) => {
			if (reason === "cancelled") return `${operation} was cancelled. Collected observations and cleanup status are reported when available.`;
			if (reason === "timeout") return `${operation} exceeded its execution deadline. Review the target's responsiveness and retained observations before retrying.`;
			if (reason === "endpoint_unreachable") return `${operation} could not reach the selected loopback debugging endpoint. Verify that the target process is running with debugging enabled and that the endpoint's port matches it, then retry.`;
			if (reason === "target_not_found") return `${operation} could not find the selected target at the debugging endpoint. Refresh target discovery for that endpoint and retry with a returned target ID.`;
			if (reason === "target_session_detached") return `${operation} lost its debugging session while the target may still exist. Refresh target discovery and attach to the selected target again.`;
			if (reason === "target_changed") return `${operation} could not retain a stable document because the target changed during observation. Retry after navigation settles; refresh target discovery if the selected page was replaced.`;
			if (reason === "service_worker_blocked") return `${operation} refused the selected page because it is controlled by or has a registered service worker while the service-worker policy is block. Set environment.service_workers to allow to permit observation, or remove the service worker registration through the browser.`;
			if (reason === "disconnected") return `${operation} lost its debugging connection. Verify that the target process is still running, refresh target discovery, and retry the observation.`;
			return undefined;
		};
	})))();
}

//#endregion
//#region dist/domain/evidenceErrors.js
var EvidenceIntegrityError, AnalysisSnapshotMismatchError, EvidenceReferenceError, EvidenceFileError;
function init_evidenceErrors() {
	return (init_evidenceErrors = __esmMin((() => {
		init_analysisErrorBase();
		EvidenceIntegrityError = class extends AnalysisError {
			_tag = "EvidenceIntegrityError";
			userMessage;
			constructor(message, options) {
				super(message, options);
				this.userMessage = options?.userMessage;
			}
		};
		AnalysisSnapshotMismatchError = class extends EvidenceIntegrityError {};
		EvidenceReferenceError = class extends EvidenceIntegrityError {
			evidenceId;
			reason;
			expected;
			actual;
			constructor(evidenceId, reason, expected, actual) {
				super(`Evidence reference ${reason}: ${evidenceId}`);
				this.evidenceId = evidenceId;
				this.reason = reason;
				this.expected = expected;
				this.actual = actual;
			}
		};
		EvidenceFileError = class extends AnalysisError {
			operation;
			reason;
			_tag = "EvidenceFileError";
			userMessage;
			/** Caller-selected path that failed, resolved against the working directory. */
			path;
			/** Present only when a write committed before cleanup failed. */
			published;
			/** Schema issues relative to the selected file's JSON root, never the request envelope. */
			contentIssues;
			constructor(operation, reason, options) {
				super(`Evidence bundle ${operation} failed: ${reason}`, options);
				this.operation = operation;
				this.reason = reason;
				this.path = options?.path;
				this.published = options?.published;
				this.userMessage = options?.userMessage;
				this.contentIssues = options?.contentIssues;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/providerSelectionError.js
var ProviderSelectionError, providerSelectionDiagnostic, providerSelectionUserMessage;
function init_providerSelectionError() {
	return (init_providerSelectionError = __esmMin((() => {
		init_analysisErrorBase();
		ProviderSelectionError = class extends AnalysisError {
			_tag = "ProviderSelectionError";
			operation;
			reason;
			requestedProviderId;
			candidateIds;
			rejections;
			remediationAction;
			userMessage;
			constructor(options) {
				const operation = options.operation ?? "open_binary";
				super(providerSelectionDiagnostic(options), {
					capturedOutput: options.capturedOutput,
					diagnostics: options.diagnostics,
					partialObservation: options.partialObservation,
					...options.cause === undefined ? {} : { cause: options.cause }
				});
				this.operation = operation;
				this.reason = options.reason;
				this.requestedProviderId = options.requestedProviderId;
				this.candidateIds = [...options.candidateIds];
				this.rejections = [...options.rejections ?? []].map((rejection) => ({
					...rejection,
					diagnostics: structuredClone(rejection.diagnostics)
				}));
				this.remediationAction = options.remediationAction;
				this.userMessage = options.userMessage ?? providerSelectionUserMessage(options);
			}
		};
		providerSelectionDiagnostic = (options) => {
			const candidates = options.candidateIds.length === 0 ? "none" : options.candidateIds.join(", ");
			return `Analysis provider selection failed (${options.reason}) for ${options.requestedProviderId}; candidates: ${candidates}`;
		};
		providerSelectionUserMessage = (options) => {
			switch (options.reason) {
				case "ambiguous": return "Multiple analysis providers support this target. Choose one with provider_id, --provider, or REA_ANALYSIS_PROVIDER.";
				case "unknown_provider": return `The requested analysis provider is unknown. Choose one of: ${options.candidateIds.join(", ") || "no configured providers"}.`;
				case "provider_unavailable": return "The selected analysis provider is unavailable. Review the reported local diagnostics or run `rea doctor`, then retry.";
				case "target_unsupported": return "The selected analysis provider does not support this target. Choose another provider or open a supported extracted binary.";
				case "invalid_options": return "The analysis provider selection or open options are invalid. Correct them and try again.";
			}
		};
	})))();
}

//#endregion
//#region dist/domain/providerAdapterError.js
var ProviderAdapterError;
function init_providerAdapterError() {
	return (init_providerAdapterError = __esmMin((() => {
		init_analysisErrorBase();
		ProviderAdapterError = class extends AnalysisError {
			providerId;
			operation;
			_tag = "ProviderAdapterError";
			userMessage;
			remediationAction;
			constructor(providerId, operation, options = {}) {
				super(`Provider ${providerId} adapter failed during ${operation}`, options);
				this.providerId = providerId;
				this.operation = operation;
				this.userMessage = options.userMessage;
				this.remediationAction = options.remediationAction;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/unknownRegistryError.js
var UnknownRegistryError;
function init_unknownRegistryError() {
	return (init_unknownRegistryError = __esmMin((() => {
		init_analysisErrorBase();
		UnknownRegistryError = class extends AnalysisError {
			reason;
			_tag = "UnknownRegistryError";
			constructor(reason, options) {
				super(`Residual unknown registry mutation failed: ${reason}`, options);
				this.reason = reason;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/providerOperationHealth.js
var PROVIDER_OPERATION_STATES, PROVIDER_RETRY_ACTIONS, PROVIDER_FAILURE_STAGES, providerRetryAction, sharedProviderFailureStage;
function init_providerOperationHealth() {
	return (init_providerOperationHealth = __esmMin((() => {
		PROVIDER_OPERATION_STATES = [
			"idle",
			"busy",
			"exited",
			"unreachable",
			"not_started",
			"unknown"
		];
		PROVIDER_RETRY_ACTIONS = [
			"retry",
			"wait",
			"restart_provider",
			"unknown"
		];
		PROVIDER_FAILURE_STAGES = [
			"launch",
			"connection",
			"analysis",
			"decompilation",
			"unknown"
		];
		providerRetryAction = (state, startupFailure = false) => {
			if (state === "idle") return null;
			if (startupFailure && state === "exited") return "retry";
			switch (state) {
				case "busy": return "wait";
				case "exited":
				case "unreachable": return "restart_provider";
				case "not_started": return "retry";
				case "unknown": return "unknown";
			}
		};
		sharedProviderFailureStage = (requests) => {
			const first = requests[0]?.stage;
			if (first === undefined) return null;
			return requests.every((request) => request.stage === first) ? first : "unknown";
		};
	})))();
}

//#endregion
//#region dist/domain/fixedAllowanceRemediation.js
var unchangedRequest, fixedAllowanceRemediation, fixedAllowanceOptions, fixedProducerInputAllowance;
function init_fixedAllowanceRemediation() {
	return (init_fixedAllowanceRemediation = __esmMin((() => {
		unchangedRequest = "Repeating the unchanged request fails the same way.";
		fixedAllowanceRemediation = (allowance, kind) => {
			switch (kind) {
				case "parser": return `${allowance} is a fixed allowance. Worker memory limits, inherited limits, and additional host memory do not raise it. Select another complete input within the allowance when that preserves the needed observation. ${unchangedRequest}`;
				case "count": return `${allowance} is a fixed count. Waiting for an active analysis to finish does not raise it. ${unchangedRequest}`;
				case "bytes": return `${allowance} is a fixed byte allowance. Waiting for an active analysis to finish does not raise it. ${unchangedRequest}`;
				case "report": return `${allowance} is a fixed report allowance. This refusal does not leave a completed report or Evidence record to retrieve, and complete CLI JSON does not raise it. ${unchangedRequest}`;
				case "input": return `Select a suitable complete artifact within ${allowance}. Increasing an evidence-reply file-size allowance does not admit this input. Do not truncate required bytes. ${unchangedRequest}`;
				case "capture": return `${allowance} is a fixed capture allowance. Worker memory limits, inherited limits, and additional host memory do not raise it. ${unchangedRequest}`;
				case "live": return `${allowance} is a fixed capture allowance. Worker memory limits, inherited limits, and additional host memory do not raise it. Capturing the same output exceeds the allowance again; live output may change between requests.`;
				case "work": return `${allowance} is a fixed work allowance. Worker CPU limits and additional CPU time do not raise it. Select another complete artifact within the allowance. ${unchangedRequest}`;
			}
		};
		fixedAllowanceOptions = (allowance, kind) => ({
			retryable: false,
			fixedAllowance: {
				name: allowance,
				kind
			}
		});
		fixedProducerInputAllowance = (bytes, allowance) => fixedAllowanceOptions(`${allowance} of ${String(bytes)} bytes (this release has no runtime override)`, "input");
	})))();
}

//#endregion
//#region dist/domain/analysisErrorPresentation.js
var MCP_TRANSPORT_EVIDENCE_EXPORT, MCP_TRANSPORT_EVIDENCE_DISCOVERY, analysisErrorRemediationAction, analysisErrorCategory, browserErrorCategory, artifactErrorCategory, STATIC_ERROR_CATEGORIES, analysisErrorUserMessage, hopperErrorUserMessage, RESTART_OWNED_PROVIDER, RESTART_UNREACHABLE_HOPPER, hopperProcessRemediation, hopperProcessMessage, standardErrorMessage, timeoutUserMessage, timeoutRemediation, UNREADABLE_OUTPUT_TAGS, UNSUPPORTED_PROVIDER_TAGS, CANCELLED_TAGS, TIMEOUT_TAGS, ADAPTER_FAILURE_TAGS, START_FAILURE_TAGS, INTEGRITY_POLICY_OPERATIONS, artifactMessage, evidenceFileMessage, KNOWN_ERROR_TAGS, assertKnownAnalysisErrorTag;
function init_analysisErrorPresentation() {
	return (init_analysisErrorPresentation = __esmMin((() => {
		init_analysisErrorCore();
		init_artifactOperationError();
		init_configurationErrors();
		init_browserObservationError();
		init_evidenceErrors();
		init_hopperErrors();
		init_providerSelectionError();
		init_providerAdapterError();
		init_unknownRegistryError();
		init_providerOperationHealth();
		init_fixedAllowanceRemediation();
		init_analysisErrorBase();
		MCP_TRANSPORT_EVIDENCE_EXPORT = "Export complete retained session evidence through export_evidence_bundle to a caller-selected path, or use complete CLI JSON output. The connection remains usable.";
		MCP_TRANSPORT_EVIDENCE_DISCOVERY = `Discover retained records with get_evidence_bundle and detail: summary, then inspect compatible records through inspect_analysis_view using an exact Evidence reference. ${MCP_TRANSPORT_EVIDENCE_EXPORT}`;
		analysisErrorRemediationAction = (error) => {
			error = resolvedAnalysisError(error);
			if ((error instanceof ProviderAdapterError || error instanceof AnalysisCapabilityUnavailableError) && error.remediationAction !== undefined) return error.remediationAction;
			if (error instanceof BrowserObservationError && error.remediationAction !== undefined) return error.remediationAction;
			if (error instanceof BrowserObservationError && error.reason === "service_worker_blocked") return "Set environment.service_workers to allow to permit this capture, or remove the service worker registration through the browser. REA never removes existing registrations.";
			if (error instanceof AnalysisCapabilityUnavailableError && error.retryable) return "Review details.reason, then retry the same analysis after the condition clears.";
			if (error instanceof EvidenceFileError && error.published !== undefined) return "Use the published file at details.published_path and resolve the reported staging cleanup failure.";
			if (error instanceof ProviderSelectionError && error.remediationAction !== undefined) return error.remediationAction;
			if (error instanceof AnalysisSnapshotMismatchError) return "Run analysis without this snapshot, then save a fresh snapshot using the intended artifact, provider, and analysis profile.";
			if (error instanceof AnalysisUnsupportedTargetError) return error.remediationAction ?? "Select a target supported by this operation or choose an operation supporting the reported target format.";
			if (error instanceof AnalysisResourceConstraintError) return error.remediationAction ?? (error.fixedAllowance !== undefined ? fixedAllowanceRemediation(error.fixedAllowance.name, error.fixedAllowance.kind) : error.resource === "capacity" ? "Wait for an active analysis to complete, then retry within the reported admission limits." : error.resource === "transport" ? MCP_TRANSPORT_EVIDENCE_DISCOVERY : error.resource === "cpu" ? "Review the reported worker CPU limits and observed signal. Retry with sufficient CPU time or a smaller artifact; REA retains tighter inherited limits." : error.resource === "file-size" ? "Review the reported worker file-size limits and write failure. Retry with a sufficient file-size allowance for the evidence reply; REA retains tighter inherited limits." : "Review the reported worker memory limits and available host memory. Retry with sufficient memory or a smaller artifact; REA retains tighter inherited limits.");
			if (error instanceof AnalysisTimeoutError && error.remediationAction !== undefined) return error.remediationAction;
			if (error instanceof AnalysisTimeoutError) return timeoutRemediation(error);
			if (error instanceof ArtifactOperationError && error.reason === "limit" && error.boundary === "capacity") return "Use an artifact within the capacity reported in details.detail. Changing output detail or retrying the unchanged input does not remove this boundary.";
			if (error instanceof HopperTimeoutError) return error.operation === undefined ? "Review details.launcher and inspect Hopper for ongoing initial analysis or a pending loader, demo, or license dialog. For a large target, use update_analysis_settings with setting hopper.startup_timeout_ms and action set for the next startup attempt without restarting REA, or increase REA_HOPPER_STARTUP_TIMEOUT_MS for future REA processes. Allow at least that long in the MCP client. Resolve retained cleanup before reopening." : error.providerState === "busy" ? "Check binary_session.analysis_activity, wait for the active Hopper request to finish, then retry." : "Check binary_session for Hopper health, then retry the operation.";
			if (error instanceof HopperProcessError) return hopperProcessRemediation(error);
			if (error instanceof HopperStartError) return error.ownerRunId === undefined ? "Check the Hopper launcher and target details, then retry opening the target." : `Use the active REA session ${error.ownerRunId} or close it before opening this target again.`;
			if (error instanceof HopperRemoteError) return error.diagnosticType === "invalid_request" ? "Correct the reported address, document, or arguments and retry." : "Review the Hopper diagnostic details and correct the request or target; run `rea doctor` if the provider itself is failing. Repeating the unchanged request is not expected to succeed.";
			if (error instanceof EvidenceReferenceError) return "Use an exact Evidence reference available from the selected source, supply the complete inline Evidence, re-run its producer, or select/import its Evidence bundle. close_binary clears a server session's retained records.";
			if (error instanceof BinaryTargetError && error.constraint === "directory_requires_file") return "For a JavaScript/Electron application directory, call analyze_javascript_application with input_path or run `rea analyze <directory>`. For binary analysis, select its executable file.";
			if (error instanceof BinaryTargetError && error.constraint === "load_selection_rejected") return "Correct the reported load argument (--target-format, --architecture, or --entry-point on the CLI; format, architecture, or entry_point through MCP) and retry.";
			if (error instanceof BinaryTargetError && error.constraint === "file_format_rejected") return "Review the reported file-format reason and select a supported, well-formed target.";
			if (error instanceof BinaryTargetError && error.constraint === "wasm_requires_static_inspection") return `For static inspection, call inspect_wasm_artifact with ${JSON.stringify({ path: error.path })} or run \`rea inspect-wasm-artifact <path> --format json\`. This separate lane requires caller-supplied WABT 1.0.42 via absolute REA_WABT_BIN_DIRECTORY; check its availability in binary_session. REA does not execute WASM or install tools, and the header alone does not establish that the complete module is valid.`;
			if (error instanceof AnalysisAccessDeniedError || error instanceof BinaryTargetError && error.systemCode !== undefined) return "Check the current process's read access to the selected path. Retry with a readable local file.";
			if (error instanceof AnalysisArtifactChangedError) return "Wait until the selected file is stable. For an active binary session, reopen the target with open_binary before retrying so REA acquires its current identity; for a CLI command or target-free tool, rerun the operation.";
			if (error instanceof ConfigurationError && error.settings.length > 0) return `Correct ${[...new Set(error.settings.map(({ setting }) => setting))].join(", ")} in the environment that starts REA (your shell or the MCP client's registration), then rerun.`;
			if (error instanceof AnalysisInputError) return `Read the declared input schema or CLI usage for ${error.operation}; if using MCP and the catalog may be stale, call tools/list. Correct the listed fields, then retry. Do not repeat the unchanged call.`;
			if (error instanceof AnalysisOutputError && error.remediationAction !== undefined) return error.remediationAction;
			if (error instanceof UnknownRegistryError && error.reason === "not-found") return "Check that the unknown_id belongs to this session, then retry.";
			return analysisErrorUserMessage(error);
		};
		analysisErrorCategory = (error) => {
			error = primaryAnalysisError(error);
			if (error instanceof AnalysisCapabilityUnavailableError && error.retryable) return "unavailable";
			if (error instanceof BinaryTargetError && error.constraint === "load_selection_rejected") return "invalid_input";
			if (error instanceof BinaryTargetError && (error.constraint === "wasm_requires_static_inspection" || error.constraint === "file_format_rejected")) return "unsupported_target";
			if (error instanceof ProviderSelectionError && error.reason === "provider_unavailable") return "unavailable";
			if (error._tag === "ProcessCaptureError") return error.userCategory ?? "execution_failure";
			if (error instanceof BrowserObservationError) return error.userCategory ?? browserErrorCategory(error.reason);
			if (error instanceof HopperRemoteError && error.diagnosticType === "invalid_request") return "invalid_input";
			if (error instanceof HopperRemoteError && error.diagnosticType === "authorization") return "unavailable";
			if (error instanceof HopperProcessError || error instanceof HopperStartError) return "unavailable";
			if (error instanceof ArtifactOperationError) return artifactErrorCategory(error.reason);
			if (error instanceof EvidenceFileError && error.reason === "path-limit") return "resource_constraint";
			if (error instanceof EvidenceFileError && (error.reason === "missing" || error.reason === "not-file" || error.reason === "wrong-kind" || error.reason === "exists")) return "invalid_input";
			if (error instanceof UnknownRegistryError && error.reason === "already-exists") return "invalid_input";
			return STATIC_ERROR_CATEGORIES[error._tag] ?? "execution_failure";
		};
		browserErrorCategory = (reason) => {
			if (reason === "cancelled") return "cancelled";
			if (reason === "timeout") return "timeout";
			if (reason === "payload_limit") return "truncated";
			if (reason === "target_not_found" || reason === "target_not_allowed" || reason === "service_worker_blocked" || reason === "target_changed" || reason === "target_session_detached" || reason === "endpoint_unreachable" || reason === "disconnected") return "unavailable";
			return "execution_failure";
		};
		artifactErrorCategory = (reason) => {
			if (reason === "integrity") return "integrity_mismatch";
			if (reason === "limit") return "truncated";
			if (reason === "cancelled") return "cancelled";
			if (reason === "unavailable") return "unavailable";
			return "execution_failure";
		};
		STATIC_ERROR_CATEGORIES = {
			ConfigurationError: "invalid_input",
			AnalysisInputError: "invalid_input",
			AnalysisAccessDeniedError: "unavailable",
			AnalysisArtifactChangedError: "integrity_mismatch",
			AnalysisCapabilityUnavailableError: "unsupported_provider",
			AnalysisUnsupportedTargetError: "unsupported_target",
			ProviderSelectionError: "unsupported_provider",
			EvidenceIntegrityError: "integrity_mismatch",
			AnalysisCancelledError: "cancelled",
			HopperCancelledError: "cancelled",
			AnalysisTimeoutError: "timeout",
			AnalysisResourceConstraintError: "resource_constraint",
			HopperTimeoutError: "timeout",
			NoBinaryOpenError: "unavailable",
			BinaryTargetError: "unavailable"
		};
		analysisErrorUserMessage = (error) => {
			error = resolvedAnalysisError(error);
			if (error instanceof AnalysisSnapshotMismatchError) return error.message;
			if (error instanceof AnalysisUnsupportedTargetError) return error.message;
			if (error instanceof AnalysisResourceConstraintError) return error.reason;
			if (error instanceof AnalysisAccessDeniedError) return "Host filesystem permissions denied read access to the selected path.";
			if (error instanceof AnalysisArtifactChangedError) return "The selected artifact changed during acquisition; no stable snapshot was decoded.";
			if (error instanceof AnalysisInputError) return error.userMessage ?? "Analysis input is invalid. Check the arguments and try again.";
			if (error instanceof AnalysisTimeoutError) return error.userMessage ?? timeoutUserMessage(error);
			const hopperMessage = hopperErrorUserMessage(error);
			if (hopperMessage !== undefined) return hopperMessage;
			if (error.userMessage !== undefined) return error.userMessage;
			if (error instanceof AnalysisCapabilityUnavailableError && error.retryable) return "Required runtime controls are unavailable for this attempt.";
			const standardMessage = standardErrorMessage(error._tag);
			if (standardMessage !== undefined) return standardMessage;
			if (error instanceof ArtifactOperationError) return artifactMessage(error);
			if (error instanceof EvidenceReferenceError) return error.reason === "missing" ? `Evidence ${error.evidenceId} is not available from the selected source. Supply complete inline Evidence, re-run its producer, or select/import its bundle before using this reference.` : `Evidence ${error.evidenceId} does not match the requested reference (${error.reason}). Check the expected and actual identity in the diagnostic details.`;
			if (error instanceof EvidenceIntegrityError) return "Evidence is invalid or has changed. Recreate or re-import it, then try again.";
			if (error instanceof EvidenceFileError) return evidenceFileMessage(error);
			if (error instanceof UnknownRegistryError && error.reason === "already-exists") return "This residual unknown already exists in the session. Reuse it or call update_unknown with its current expected_revision; do not repeat record_unknown.";
			if (error instanceof UnknownRegistryError && error.reason === "not-found") return "The requested residual unknown does not exist in this session. Check the unknown_id and try again.";
			if (error instanceof UnknownRegistryError) return "Evidence state changed before the update completed. Refresh the current state and try again.";
			if (error instanceof ConfigurationError) return error.settings.length === 0 ? "REA configuration is invalid. Run `rea doctor` and fix the reported setting." : `REA configuration is invalid: ${error.settings.map(({ setting, constraint }) => constraint.includes(setting) ? constraint.replace(/\.$/u, "") : `${setting}: ${constraint}`).join("; ")}.`;
			if (error instanceof NoBinaryOpenError) return error.message;
			if (error instanceof BinaryTargetError && error.constraint === "wasm_requires_static_inspection") return `${error.message}. Static WebAssembly inspection uses a separate optional WABT lane, not a native analysis engine.`;
			if (error instanceof BinaryTargetError) return error.constraint === "directory_requires_file" ? "open_binary accepts files and macOS app bundles. This target is a directory; JavaScript/Electron application directories can be analyzed directly with analyze_javascript_application or `rea analyze <directory>`." : error.constraint === "file_format_rejected" || error.constraint === "load_selection_rejected" ? `${error.message}.` : `${error.message}. Check that the path exists, is readable, and points to a supported file.`;
			if (error._tag === "ProcessCaptureError") return error.userMessage ?? "Process capture could not complete. Run `rea doctor`, then review capture policy and try again.";
			return "Analysis could not complete. Run `rea doctor`, then try again.";
		};
		hopperErrorUserMessage = (error) => {
			if (error instanceof HopperTimeoutError) {
				if (error.operation === undefined) return "REA timed out waiting for Hopper bridge readiness, which includes initial analysis. Hopper may still be analyzing the target or waiting for a loader, demo, or license dialog. Review the captured launcher outcome and resolve retained cleanup before retrying.";
				const request = error.operation;
				return error.providerState === "busy" ? `Hopper timed out during ${request} while the provider remained busy. Check binary_session.analysis_activity, wait for the active request to finish, then retry.` : `Hopper timed out during ${request} before it started. Check binary_session for provider health, then retry.`;
			}
			if (error instanceof HopperProcessError) return hopperProcessMessage(error);
			if (error instanceof HopperStartError) return error.userMessage ?? "Hopper could not start. Check the launcher and target details, then retry opening the target.";
			if (error instanceof HopperRemoteError) return `Hopper ${error.operation ?? "analysis"} failed (${String(error.code)}, ${error.diagnosticType}): ${error.safeMessage}`;
			return undefined;
		};
		RESTART_OWNED_PROVIDER = "Restart the owned provider by calling close_binary, then open the target again and retry.";
		RESTART_UNREACHABLE_HOPPER = `${RESTART_OWNED_PROVIDER} If Hopper may have exited, call export_evidence_bundle before close_binary; closing clears retained records.`;
		hopperProcessRemediation = (error) => {
			if (error.failureCode !== undefined && error.userMessage !== undefined) return error.userMessage;
			if (error.stage === "launch") return "Review the captured launcher diagnostics and Hopper setup, then retry opening the target.";
			if (error.providerState === "unreachable") return RESTART_UNREACHABLE_HOPPER;
			if (providerRetryAction(error.providerState) === "restart_provider") return RESTART_OWNED_PROVIDER;
			return "Read binary_session.provider_operation_health for this request before retrying or restarting the owned provider.";
		};
		hopperProcessMessage = (error) => {
			const stage = error.stage;
			const where = error.operation ?? stage;
			const request = error.requestId === undefined ? "" : ` Request id ${String(error.requestId)}.`;
			const startup = error.userMessage === undefined ? "" : ` ${error.userMessage}`;
			if (error.providerState === "exited") {
				const signal = error.launcherFailure?.signal;
				const exit = error.exitCode === null ? signal === undefined || signal === null ? "no exit code was observed" : `signal ${signal}` : `exit code ${String(error.exitCode)}`;
				const recovery = error.failureCode === undefined && stage !== "launch" ? ` ${RESTART_OWNED_PROVIDER}` : "";
				return `Hopper exited during ${where} (${exit}).${startup}${recovery}${request}`;
			}
			if (error.providerState === "unreachable") return `Hopper became unreachable during ${where}; its process exit was not observed. ${RESTART_UNREACHABLE_HOPPER}${startup}${request}`;
			return `Hopper failed during ${where} and REA could not determine whether the provider is busy, exited, or unreachable.${startup} Read binary_session.provider_operation_health for this request before retrying or restarting.${request}`;
		};
		standardErrorMessage = (tag) => {
			if (UNREADABLE_OUTPUT_TAGS.has(tag)) return "Analysis returned an unreadable result. Run `rea doctor` and review the reported details; repeating the unchanged request is not expected to succeed.";
			if (UNSUPPORTED_PROVIDER_TAGS.has(tag)) return "This analysis is unavailable for the current target. Choose another analysis or target.";
			if (CANCELLED_TAGS.has(tag)) return "Analysis was cancelled. Start it again when ready.";
			if (TIMEOUT_TAGS.has(tag)) return "Analysis took too long. Try a smaller request, then run `rea doctor` if it continues.";
			if (ADAPTER_FAILURE_TAGS.has(tag)) return "Analysis could not complete. Run `rea doctor` and review the reported details; repeating the unchanged request is not expected to succeed.";
			if (START_FAILURE_TAGS.has(tag)) return "Analysis could not start or stopped unexpectedly. Run `rea doctor`, then try again.";
			return undefined;
		};
		timeoutUserMessage = (error) => `REA's ${error.operation} operation reached its ${String(error.timeoutMs)}ms server/provider deadline. This is not a client-side timeout; extending only the MCP client's deadline does not change this budget.`;
		timeoutRemediation = (error) => `Inspect any partial Evidence, provider diagnostics and reported session/provider cleanup state for ${error.operation}. Reduce the request if supported, or resolve the reported provider condition before retrying. Do not repeat the unchanged call or retry while work or cleanup may still be active.`;
		UNREADABLE_OUTPUT_TAGS = new Set([
			"AnalysisProtocolError",
			"AnalysisOutputError",
			"HopperProtocolError"
		]);
		UNSUPPORTED_PROVIDER_TAGS = new Set(["AnalysisCapabilityUnavailableError", "ProviderSelectionError"]);
		CANCELLED_TAGS = new Set(["AnalysisCancelledError", "HopperCancelledError"]);
		TIMEOUT_TAGS = new Set(["AnalysisTimeoutError", "HopperTimeoutError"]);
		ADAPTER_FAILURE_TAGS = new Set(["ProviderAdapterError", "HopperRemoteError"]);
		START_FAILURE_TAGS = new Set(["HopperProcessError", "HopperStartError"]);
		INTEGRITY_POLICY_OPERATIONS = new Set([
			"inventory_artifact",
			"inspect_artifact",
			"extract_artifact",
			"analyze_javascript_application"
		]);
		artifactMessage = ({ operation, reason, artifactDetails: details, detail }) => {
			if (reason === "cancelled") return "Artifact operation was cancelled. Start it again when ready.";
			if (reason === "limit") return detail ?? "Artifact processing reached a resource limit. Select an artifact within the reported limits and retry.";
			if (reason === "path") return detail ?? "Artifact contains a conflicting internal path. Inspect the reported path before retrying.";
			if (reason === "unavailable" && details?.unpacked === true) return `ASAR unpacked companion bytes are unavailable for ${details.logicalPath}. Select the archive in place with its .unpacked directory beside it, then retry.`;
			if (reason === "unavailable") return "Artifact processing is unavailable. Review the reported availability reason and resolve that condition before retrying.";
			if (reason === "integrity" && details !== undefined && INTEGRITY_POLICY_OPERATIONS.has(operation)) return `${details?.unpacked === true && "calculatedSha256" in details && details.calculatedSha256 !== null ? `Declared ASAR integrity for unpacked entry ${details.logicalPath} contradicts its companion file; packaging tools commonly sign or strip unpacked native binaries after writing the archive.` : "Artifact bytes contradict declared integrity."} If expected, rerun ${operation === "inventory_artifact" ? "inspect_artifact" : operation} with integrity_policy=record-and-continue (CLI: --integrity-policy record-and-continue) to retain observed bytes as untrusted; otherwise get a fresh copy.`;
			if (reason === "format" || reason === "integrity") return "Artifact is invalid or has changed. Get a fresh copy and try again.";
			return "Artifact could not be read or written. Check file access and try again.";
		};
		evidenceFileMessage = ({ operation, reason, published }) => {
			if (published !== undefined) return "The output file was published, but staging cleanup remains incomplete.";
			if (reason === "path-limit") return "Filesystem path-length constraints prevented reading or atomic publication at the selected path. Choose a shorter local path.";
			if (reason === "missing") return operation === "read" ? "Evidence file does not exist at the selected path. Check the path and try again." : "Evidence output directory does not exist. Choose an existing directory and try again.";
			if (reason === "not-file") return "Evidence path does not point to a regular file. Choose a file and try again.";
			if (reason === "exists") return "Evidence file already exists. Choose another path or allow overwrite.";
			if (reason === "invalid-json") return "Evidence file is not valid JSON. Repair or recreate the file and try again.";
			return "Evidence file could not be accessed. Check file permissions and try again.";
		};
		KNOWN_ERROR_TAGS = {
			AnalysisProtocolError: true,
			AnalysisInputError: true,
			AnalysisAccessDeniedError: true,
			AnalysisArtifactChangedError: true,
			AnalysisOutputError: true,
			AnalysisCapabilityUnavailableError: true,
			AnalysisUnsupportedTargetError: true,
			AnalysisCancelledError: true,
			AnalysisTimeoutError: true,
			AnalysisResourceConstraintError: true,
			ProviderSelectionError: true,
			ProviderAdapterError: true,
			BrowserObservationError: true,
			ArtifactOperationError: true,
			ProcessCaptureError: true,
			EvidenceIntegrityError: true,
			EvidenceFileError: true,
			UnknownRegistryError: true,
			HopperTimeoutError: true,
			HopperCancelledError: true,
			HopperProtocolError: true,
			HopperRemoteError: true,
			HopperProcessError: true,
			HopperStartError: true,
			ConfigurationError: true,
			NoBinaryOpenError: true,
			BinaryTargetError: true
		};
		assertKnownAnalysisErrorTag = (tag) => {
			if (KNOWN_ERROR_TAGS[tag] !== true) throw new TypeError("Unknown analysis error tag");
		};
	})))();
}

//#endregion
//#region dist/domain/analysisErrorProjection.js
var projectAnalysisError, projectAnalysisErrorWithoutCapturedOutput, projectError, errorRecovery, underlyingErrorCode, BROWSER_ERROR_CODES, artifactOperationCode, evidenceFileCode, unknownRegistryCode, processCaptureCode, STATIC_ERROR_CODES, staticErrorCode, errorDetails, requestErrorDetails, artifactStateErrorDetails, providerErrorDetails, primaryBrowserFailureReason, lifecycleErrorDetails, RETRYABLE_CODES;
function init_analysisErrorProjection() {
	return (init_analysisErrorProjection = __esmMin((() => {
		init_artifactIntegrity();
		init_jsonValue();
		init_immutableJson();
		init_analysisErrorPresentation();
		init_analysisErrorCore();
		init_artifactOperationError();
		init_configurationErrors();
		init_browserObservationError();
		init_evidenceErrors();
		init_hopperErrors();
		init_providerAdapterError();
		init_providerSelectionError();
		init_unknownRegistryError();
		init_providerOperationHealth();
		init_analysisErrorBase();
		projectAnalysisError = (error) => projectError(error, true);
		projectAnalysisErrorWithoutCapturedOutput = (error) => projectError(error, false);
		projectError = (error, includeCapturedOutput) => {
			const composed = error;
			error = resolvedAnalysisError(error);
			let diagnosticSource = error;
			while (diagnosticSource.diagnostics === undefined && diagnosticSource.cleanupPrimary !== undefined) diagnosticSource = diagnosticSource.cleanupPrimary;
			const diagnostics = diagnosticSource.diagnostics;
			const capturedOutput = composed.capturedOutput ?? error.capturedOutput;
			const partialObservation = composed.partialObservation ?? error.partialObservation;
			let cleanupReport = composed.cleanupReport;
			for (let owner = composed.cleanupPrimary; cleanupReport === undefined && owner !== undefined; owner = owner.cleanupPrimary) cleanupReport = owner.cleanupReport;
			assertKnownAnalysisErrorTag(error._tag);
			const primary = primaryAnalysisError(error);
			assertKnownAnalysisErrorTag(primary._tag);
			const underlyingCode = underlyingErrorCode(primary);
			const code = error.cleanupIncomplete ? "cleanup_incomplete" : underlyingCode;
			const primaryDetails = errorDetails(primary);
			const details = {
				...primaryDetails,
				...primary.limit === undefined ? {} : { limit: { ...primary.limit } },
				...cleanupReport === undefined ? {} : { cleanup_report: jsonValueSchema.parse(cleanupReport) },
				...diagnostics === undefined ? {} : {
					diagnostics,
					...primaryDetails?.diagnostics === undefined ? {} : { provider_diagnostics: primaryDetails.diagnostics }
				},
				...composed === error || composed.diagnostics === undefined ? {} : { cleanup_history: composed.diagnostics },
				...error.cleanupIncomplete ? {
					cleanup: "incomplete",
					resources: [...error.cleanupResources],
					...error.cleanup === undefined ? {} : { cleanup_reason: error.cleanup.reason },
					execution_failure: primaryDetails?.execution_failure ?? underlyingCode
				} : {},
				...!includeCapturedOutput || capturedOutput === undefined ? {} : { captured_output: { ...capturedOutput } },
				...partialObservation === undefined ? {} : { partial_observation: isImmutableJsonSnapshot(partialObservation) ? partialObservation : jsonValueSchema.parse(partialObservation) }
			};
			const recovery = errorRecovery(error);
			return {
				code,
				category: analysisErrorCategory(error),
				message: analysisErrorUserMessage(error),
				retryable: RETRYABLE_CODES.has(code) || error instanceof AnalysisCapabilityUnavailableError && error.retryable || code === "resource_constraint" && error instanceof AnalysisResourceConstraintError && (error.retryable ?? error.resource === "capacity"),
				remediation: { action: analysisErrorRemediationAction(error) },
				...recovery === undefined ? {} : { recovery },
				...Object.keys(details).length === 0 ? {} : { details }
			};
		};
		errorRecovery = (error) => {
			if (error instanceof AnalysisInputError) return {
				kind: "inspect_input_contract",
				operation: error.operation
			};
			if (error instanceof AnalysisTimeoutError) return {
				kind: "inspect_timeout_state",
				operation: error.operation,
				timeout_ms: error.timeoutMs
			};
			return undefined;
		};
		underlyingErrorCode = (error) => {
			if (error instanceof HopperRemoteError && error.diagnosticType === "invalid_request") return "invalid_request";
			if (error instanceof ProviderSelectionError) return error.reason === "provider_unavailable" ? "provider_unavailable" : "capability_unavailable";
			if (error instanceof BrowserObservationError) return error.userCategory === "cancelled" ? "cancelled" : BROWSER_ERROR_CODES[error.reason];
			if (error instanceof ArtifactOperationError) return artifactOperationCode(error);
			if (error instanceof BinaryTargetError) return error.constraint === "load_selection_rejected" ? "invalid_request" : error.systemCode === undefined ? "target_unavailable" : "access_denied";
			if (error instanceof EvidenceFileError) return evidenceFileCode(error.reason);
			if (error instanceof UnknownRegistryError) return unknownRegistryCode(error.reason);
			if (error._tag === "ProcessCaptureError") return processCaptureCode(error);
			return staticErrorCode(error._tag);
		};
		BROWSER_ERROR_CODES = {
			endpoint_unreachable: "provider_unavailable",
			invalid_endpoint_response: "unreadable_output",
			target_not_found: "target_unavailable",
			target_not_allowed: "target_unavailable",
			service_worker_blocked: "target_unavailable",
			target_changed: "target_unavailable",
			target_session_detached: "target_unavailable",
			protocol_error: "unreadable_output",
			disconnected: "provider_unavailable",
			payload_limit: "truncated",
			window_not_found: "unreadable_output",
			window_metadata_missing: "unreadable_output",
			process_ownership_unavailable: "unreadable_output",
			cleanup_failed: "execution_failure",
			cancelled: "cancelled",
			timeout: "provider_timeout"
		};
		artifactOperationCode = (error) => {
			if (error.reason === "integrity" && error.artifactDetails !== undefined) return "artifact_integrity_mismatch";
			if (error.reason === "limit") return "truncated";
			if (error.reason === "cancelled") return "cancelled";
			return "artifact_operation_failed";
		};
		evidenceFileCode = (reason) => {
			if (reason === "invalid-json") return "evidence_integrity_mismatch";
			if (reason === "path-limit") return "resource_constraint";
			if (reason === "io") return "execution_failure";
			return "invalid_request";
		};
		unknownRegistryCode = (reason) => {
			if (reason === "revision-conflict") return "revision_conflict";
			if (reason === "already-exists") return "invalid_request";
			if (reason === "limit") return "truncated";
			if (reason === "integrity") return "evidence_integrity_mismatch";
			return "execution_failure";
		};
		processCaptureCode = (error) => {
			if (error.cleanupIncomplete) return "cleanup_incomplete";
			if (error.userCategory === "cancelled") return "cancelled";
			return "process_capture_failed";
		};
		STATIC_ERROR_CODES = {
			AnalysisProtocolError: "unreadable_output",
			AnalysisOutputError: "unreadable_output",
			HopperProtocolError: "unreadable_output",
			AnalysisInputError: "invalid_request",
			AnalysisAccessDeniedError: "access_denied",
			AnalysisArtifactChangedError: "artifact_changed",
			AnalysisCapabilityUnavailableError: "capability_unavailable",
			AnalysisUnsupportedTargetError: "unsupported_target",
			AnalysisCancelledError: "cancelled",
			HopperCancelledError: "cancelled",
			AnalysisTimeoutError: "provider_timeout",
			AnalysisResourceConstraintError: "resource_constraint",
			HopperTimeoutError: "provider_timeout",
			HopperProcessError: "provider_unavailable",
			HopperStartError: "provider_unavailable",
			ConfigurationError: "configuration_invalid",
			NoBinaryOpenError: "target_unavailable",
			EvidenceIntegrityError: "evidence_integrity_mismatch",
			ProviderAdapterError: "execution_failure",
			HopperRemoteError: "execution_failure"
		};
		staticErrorCode = (tag) => {
			switch (tag) {
				case "ArtifactOperationError":
				case "BinaryTargetError":
				case "BrowserObservationError":
				case "EvidenceFileError":
				case "ProcessCaptureError":
				case "ProviderSelectionError":
				case "UnknownRegistryError": throw new TypeError(`Unhandled specialized analysis error: ${tag}`);
				default: return STATIC_ERROR_CODES[tag];
			}
		};
		errorDetails = (error) => requestErrorDetails(error) ?? artifactStateErrorDetails(error) ?? providerErrorDetails(error) ?? lifecycleErrorDetails(error);
		requestErrorDetails = (error) => {
			if (error instanceof AnalysisUnsupportedTargetError) return {
				operation: error.operation,
				path: error.path,
				reason: error.reason
			};
			if (error instanceof AnalysisResourceConstraintError) return {
				operation: error.operation,
				resource: error.resource,
				reason: error.reason,
				reported_limits: error.reportedLimits
			};
			if (error instanceof AnalysisArtifactChangedError) return {
				operation: error.operation,
				path: error.path,
				reason: error.reason,
				boundary: "stable-artifact-read"
			};
			if (error instanceof AnalysisAccessDeniedError) return {
				operation: error.operation,
				path: error.path,
				system_code: error.systemCode,
				boundary: "filesystem-read"
			};
			if (error instanceof AnalysisOutputError) return {
				operation: error.operation,
				reason: error.reason,
				...error.diagnostics === undefined ? {} : { diagnostics: error.diagnostics }
			};
			if (error instanceof AnalysisInputError && error.issues.length > 0) return {
				operation: error.operation,
				issues: error.issues.map((issue) => ({
					path: [...issue.path],
					reason: issue.reason,
					...issue.message === undefined ? {} : { message: issue.message },
					...issue.expected === undefined ? {} : { expected: issue.expected },
					...issue.minimum === undefined ? {} : { minimum: issue.minimum },
					...issue.maximum === undefined ? {} : { maximum: issue.maximum }
				}))
			};
			if (error instanceof EvidenceReferenceError) return {
				evidence_id: error.evidenceId,
				reason: error.reason,
				expected: error.expected,
				actual: error.actual
			};
			if (error instanceof EvidenceIntegrityError) return { reason: error.message };
			return undefined;
		};
		artifactStateErrorDetails = (error) => {
			if (error instanceof ArtifactOperationError && error.artifactDetails) return projectArtifactIntegrityDetails(error.artifactDetails);
			if (error instanceof ArtifactOperationError) return {
				operation: error.operation,
				reason: error.reason,
				...error.reason === "limit" ? { truncated: true } : {},
				...error.detail === undefined ? {} : { detail: error.detail },
				...error.boundary === undefined ? {} : { boundary: error.boundary },
				...error.admission === undefined ? {} : {
					admission: error.admission.kind,
					maximum_header_bytes: error.admission.maximumBytes,
					maximum_header_bytes_source: error.admission.source,
					setting: "REA_ASAR_MAX_HEADER_BYTES"
				}
			};
			if (error instanceof UnknownRegistryError) return { reason: error.reason };
			if (error instanceof EvidenceFileError) return {
				operation: error.operation,
				reason: error.reason,
				...error.reason === "path-limit" ? { boundary: "filesystem-path" } : {},
				...error.path === undefined ? {} : { path: error.path },
				...error.contentIssues === undefined ? {} : { content_issues: error.contentIssues.map((issue) => ({
					...issue,
					path: [...issue.path]
				})) },
				...error.published === undefined ? {} : {
					published: true,
					bytes: error.published.bytes,
					published_path: error.published.path
				}
			};
			return undefined;
		};
		providerErrorDetails = (error) => {
			if (error instanceof AnalysisCapabilityUnavailableError) return {
				provider_id: error.providerId,
				operation: error.operation,
				reason: error.reason
			};
			if (error instanceof ProviderSelectionError) return {
				operation: error.operation,
				selection_reason: error.reason,
				requested_provider_id: error.requestedProviderId,
				candidate_ids: [...error.candidateIds],
				rejections: error.rejections.map((rejection) => ({
					provider_id: rejection.providerId,
					code: rejection.code,
					reason: rejection.reason,
					diagnostics: rejection.diagnostics
				}))
			};
			if (error instanceof ProviderAdapterError) return {
				provider_id: error.providerId,
				operation: error.operation,
				...error.cleanupIncomplete ? {
					cleanup: "incomplete",
					resources: [...error.cleanupResources]
				} : {}
			};
			if (error instanceof BrowserObservationError) {
				const primaryReason = primaryBrowserFailureReason(error);
				return {
					operation: error.operation,
					reason: error.reason,
					...error.cleanupIncomplete ? {
						cleanup: "incomplete",
						resources: [...error.cleanupResources],
						...primaryReason === undefined ? {} : { primary_reason: primaryReason }
					} : {}
				};
			}
			if (error instanceof HopperRemoteError) return {
				stage: "analysis",
				provider_code: error.code,
				diagnostic_type: error.diagnosticType,
				...error.operation === undefined ? {} : { operation: error.operation },
				...error.requestId === undefined ? {} : { request_id: error.requestId }
			};
			if (error instanceof HopperProcessError) {
				const stage = error.stage;
				return {
					exit_code: error.exitCode,
					stage,
					provider_state: error.providerState,
					retry_action: providerRetryAction(error.providerState, error.failureCode !== undefined || error.stage === "launch"),
					...error.failureCode === undefined ? {} : { failure_code: error.failureCode },
					...error.operation === undefined ? {} : { operation: error.operation },
					...error.requestId === undefined ? {} : { request_id: error.requestId },
					...error.diagnostic === undefined ? {} : { diagnostics: { ...error.diagnostic } },
					...error.launcherFailure === undefined ? {} : { launcher: error.launcherFailure }
				};
			}
			if (error instanceof HopperStartError) return {
				stage: "launch",
				provider_state: "unknown",
				...error.launchRejection === undefined ? {} : { launch_rejection: { ...error.launchRejection } },
				retry_action: error.ownerRunId === undefined ? "retry" : "unknown",
				...error.ownerRunId === undefined ? {} : { owner_run_id: error.ownerRunId },
				...error.launcherFailure === undefined ? {} : { launcher: error.launcherFailure }
			};
			return undefined;
		};
		primaryBrowserFailureReason = (error) => {
			const aggregate = error.cause instanceof AggregateError;
			const primary = error.cause instanceof AggregateError ? error.cause.errors[0] : error.cause;
			if (primary instanceof BrowserObservationError) return primary.reason;
			if (primary instanceof AnalysisCancelledError) return "cancelled";
			if (primary instanceof AnalysisTimeoutError) return "timeout";
			if (typeof primary === "object" && primary !== null && "_tag" in primary) return typeof primary._tag === "string" ? primary._tag : "execution_failure";
			return aggregate ? "execution_failure" : undefined;
		};
		lifecycleErrorDetails = (error) => {
			if (error instanceof AnalysisCancelledError) return {
				operation: error.operation,
				cleanup: error.cleanupIncomplete ? "incomplete" : "complete",
				...error.cleanup === undefined || !error.cleanupIncomplete ? {} : {
					cleanup_reason: error.cleanup.reason,
					resources: [...error.cleanup.resources],
					execution_failure: "cancelled"
				}
			};
			if (error instanceof HopperCancelledError) return {
				operation: "hopper",
				cleanup: "complete"
			};
			if (error instanceof AnalysisTimeoutError) return {
				operation: error.operation,
				timeout_ms: error.timeoutMs,
				...error.cleanup === undefined || !error.cleanupIncomplete ? {} : {
					cleanup: "incomplete",
					cleanup_reason: error.cleanup.reason,
					resources: [...error.cleanup.resources]
				}
			};
			if (error instanceof HopperTimeoutError) return {
				stage: error.operation === undefined ? "startup" : error.stage,
				timeout_ms: error.timeoutMs,
				...error.launcherOutcome === undefined ? {} : { launcher: error.launcherOutcome },
				provider_state: error.providerState,
				retry_action: error.providerState === "busy" ? "wait" : "retry",
				...error.operation === undefined ? {} : { operation: error.operation },
				...error.requestId === undefined ? {} : { request_id: error.requestId }
			};
			if (error._tag === "ProcessCaptureError" && error.cleanupIncomplete) return {
				cleanup: "incomplete",
				resources: [...error.cleanupResources],
				...error.cleanupReport === undefined ? {} : { cleanup_report: jsonValueSchema.parse(error.cleanupReport) },
				...error.executionFailure === undefined ? {} : { execution_failure: error.executionFailure }
			};
			if (error._tag === "ProcessCaptureError") {
				const details = {
					...error.userCategory === "cancelled" ? {
						operation: "process_capture",
						cleanup: "complete"
					} : {},
					...error.cleanupReport === undefined ? {} : { cleanup_report: jsonValueSchema.parse(error.cleanupReport) },
					...error.executionFailure === undefined ? {} : { execution_failure: error.executionFailure }
				};
				return Object.keys(details).length === 0 ? undefined : details;
			}
			if (error instanceof ConfigurationError && error.settings.length > 0) return { settings: error.settings.map(({ setting, constraint }) => ({
				setting,
				constraint
			})) };
			if (error instanceof BinaryTargetError) return {
				path: error.path,
				reason: error.reason,
				...error.constraint === undefined ? {} : { constraint: error.constraint },
				...error.systemCode === undefined ? {} : {
					system_code: error.systemCode,
					boundary: "filesystem-read"
				}
			};
			return undefined;
		};
		RETRYABLE_CODES = new Set([
			"artifact_changed",
			"provider_timeout",
			"cancelled",
			"revision_conflict",
			"provider_unavailable"
		]);
	})))();
}

//#endregion
export { safeParseJson as $, init_browserObservationError as A, HopperCancelledError as B, AnalysisSnapshotMismatchError as C, init_evidenceErrors as D, EvidenceReferenceError as E, artifactIntegrityPair as F, HopperTimeoutError as G, HopperProtocolError as H, artifactIntegrityPairOf as I, hopperStartupExitCode as J, hopperCancelledBySignal as K, artifactMd5PairSchema as L, init_artifactOperationError as M, artifactIntegrityClaimSchema as N, BrowserObservationError as O, artifactIntegrityDetails as P, init_safeJson as Q, artifactSha256PairSchema as R, init_providerSelectionError as S, EvidenceIntegrityError as T, HopperRemoteError as U, HopperProcessError as V, HopperStartError as W, init_hopperStartupFailure as X, hopperStartupFailure as Y, isHopperStartupFailureCode as Z, UnknownRegistryError as _, MCP_TRANSPORT_EVIDENCE_EXPORT as a, init_providerAdapterError as b, fixedAllowanceRemediation as c, PROVIDER_FAILURE_STAGES as d, PROVIDER_OPERATION_STATES as f, sharedProviderFailureStage as g, providerRetryAction as h, MCP_TRANSPORT_EVIDENCE_DISCOVERY as i, ArtifactOperationError as j, browserCleanupObservation as k, fixedProducerInputAllowance as l, init_providerOperationHealth as m, projectAnalysisError as n, init_analysisErrorPresentation as o, PROVIDER_RETRY_ACTIONS as p, init_hopperErrors as q, projectAnalysisErrorWithoutCapturedOutput as r, fixedAllowanceOptions as s, init_analysisErrorProjection as t, init_fixedAllowanceRemediation as u, init_unknownRegistryError as v, EvidenceFileError as w, ProviderSelectionError as x, ProviderAdapterError as y, init_artifactIntegrity as z };