import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { z } from "zod";
import { types } from "node:util";
import { isProxy } from "node:util/types";
import { Formatter } from "incur";

//#region dist/domain/analysisErrorBase.js
var ANALYSIS_ERROR_TAGS, AnalysisError, resolvedAnalysisError, primaryAnalysisError;
function init_analysisErrorBase() {
	return (init_analysisErrorBase = __esmMin((() => {
		ANALYSIS_ERROR_TAGS = [
			"AnalysisProtocolError",
			"AnalysisInputError",
			"AnalysisAccessDeniedError",
			"AnalysisArtifactChangedError",
			"AnalysisOutputError",
			"AnalysisCapabilityUnavailableError",
			"AnalysisUnsupportedTargetError",
			"AnalysisCancelledError",
			"AnalysisTimeoutError",
			"AnalysisResourceConstraintError",
			"ProviderSelectionError",
			"ProviderAdapterError",
			"BrowserObservationError",
			"ArtifactOperationError",
			"ProcessCaptureError",
			"EvidenceIntegrityError",
			"EvidenceFileError",
			"UnknownRegistryError",
			"HopperTimeoutError",
			"HopperCancelledError",
			"HopperProtocolError",
			"HopperRemoteError",
			"HopperProcessError",
			"HopperStartError",
			"ConfigurationError",
			"NoBinaryOpenError",
			"BinaryTargetError"
		];
		AnalysisError = class extends Error {
			limit;
			/** Bind the accepted setting at its producing boundary. */
			bindLimit(limit) {
				this.limit = Object.freeze({ ...limit });
				return this;
			}
			#cleanupPrimary;
			#cleanupDependencies;
			#cleanupResourceProjection;
			#cleanupDependents = [];
			diagnostics;
			capturedOutput;
			cleanup;
			cleanupIncomplete;
			#ownedCleanupResources;
			#cleanupResourceOwner;
			#cleanupCompletionOwner;
			#secondaryFailures = [];
			constructor(message, options) {
				super(message, options);
				this.#cleanupPrimary = options?.cleanupPrimary;
				if (options?.limit !== undefined) this.bindLimit(options.limit);
				this.diagnostics = options?.diagnostics === undefined ? undefined : structuredClone(options.diagnostics);
				this.capturedOutput = options?.capturedOutput === undefined ? undefined : { ...options.capturedOutput };
				this.cleanup = options?.cleanup;
				this.cleanupIncomplete = options?.cleanup !== undefined;
				this.#ownedCleanupResources = [...options?.cleanup?.resources ?? []];
				this.partialObservation = options?.partialObservation;
			}
			userMessage = undefined;
			userCategory = undefined;
			executionFailure = undefined;
			partialObservation;
			get cleanupPrimary() {
				return this.#cleanupPrimary;
			}
			/** Later typed failures retained without changing the primary error cause. */
			get secondaryFailures() {
				return [...this.#secondaryFailures];
			}
			cleanupReport = undefined;
			/** Live dependencies own current resource attribution; cleanup keeps history. */
			get cleanupResources() {
				if (this.#cleanupDependencies === undefined) return this.#cleanupResourceOwner?.cleanupResources ?? this.#ownedCleanupResources;
				const pending = [...this.#cleanupDependencies].filter((dependency) => dependency.cleanupIncomplete);
				if (pending.length === 0) return [];
				if (this.#cleanupResourceProjection !== undefined) return this.#cleanupResourceProjection.cleanupResources;
				return [...new Set(pending.flatMap((dependency) => dependency.cleanupResources))];
			}
			/** Whether cleanup follows an explicit owner or dependent errors. */
			get hasCleanupOwner() {
				return this.#cleanupResourceOwner !== undefined || this.#cleanupCompletionOwner !== undefined || this.#cleanupDependencies !== undefined;
			}
			/** Bind attribution only to the producer that owns the complete cleanup set. */
			bindCleanupResourceOwner(owner) {
				this.#cleanupResourceOwner = owner;
				return this;
			}
			/** Observe exact completion without replacing the producer's resource facts. */
			bindCleanupCompletionOwner(owner) {
				this.#cleanupCompletionOwner = owner;
				return this;
			}
			/** Initialize resource facts supplied by a more specific error producer. */
			setCleanupResources(resources) {
				this.#ownedCleanupResources = [...resources];
			}
			/** Retain diagnostic facts without replacing the original typed error. */
			retainDiagnostics(diagnostics) {
				Object.assign(this, { diagnostics: structuredClone({
					...this.diagnostics,
					...diagnostics
				}) });
				return this;
			}
			retainSecondaryFailure(failure, diagnostics) {
				if (diagnostics !== undefined) this.retainDiagnostics(diagnostics);
				this.#secondaryFailures.push(failure);
				return this;
			}
			/** Keep a composed error incomplete until all explicitly owned source errors resolve. */
			bindCleanupDependencies(dependencies, resourceProjection) {
				const pending = this.#cleanupDependencies ??= new Set();
				if (resourceProjection !== undefined) this.#cleanupResourceProjection = resourceProjection;
				for (const dependency of dependencies) {
					if (!dependency.cleanupIncomplete || pending.has(dependency)) continue;
					pending.add(dependency);
					dependency.#cleanupDependents = [...dependency.#cleanupDependents.filter((reference) => reference.deref() !== undefined), new WeakRef(this)];
				}
				if (pending.size === 0) this.resolveCleanup();
				return this;
			}
			/** Clear live cleanup status only after its owning resource confirms retry success. */
			resolveCleanup() {
				if ([...this.#cleanupDependencies ?? []].some((dependency) => dependency.cleanupIncomplete)) return this;
				this.#cleanupDependencies?.clear();
				this.cleanupIncomplete = false;
				for (const reference of this.#cleanupDependents) reference.deref()?.resolveCleanup();
				this.#cleanupDependents = [];
				return this;
			}
			/** Retain a completed observation when a later step fails. */
			retainPartialObservation(observation) {
				this.partialObservation ??= observation;
				return this;
			}
		};
		resolvedAnalysisError = (error) => {
			while (!error.cleanupIncomplete && error.cleanupPrimary !== undefined) error = error.cleanupPrimary;
			return error;
		};
		primaryAnalysisError = (error) => {
			while (error.cleanupPrimary !== undefined) error = error.cleanupPrimary;
			return error;
		};
	})))();
}

//#endregion
//#region dist/domain/analysisErrorCore.js
var AnalysisUnsupportedTargetError, ANALYSIS_RESOURCE_KINDS, AnalysisResourceConstraintError, resourceConstraintRecovery, retryable, AnalysisProtocolError, AnalysisInputError, AnalysisOutputError, AnalysisCapabilityUnavailableError, AnalysisCancelledError, AnalysisTimeoutError, AnalysisAccessDeniedError, AnalysisArtifactChangedError;
function init_analysisErrorCore() {
	return (init_analysisErrorCore = __esmMin((() => {
		init_analysisErrorBase();
		AnalysisUnsupportedTargetError = class extends AnalysisError {
			operation;
			path;
			reason;
			_tag = "AnalysisUnsupportedTargetError";
			/** Refusal-specific recovery, when the producer knows an available workflow. */
			remediationAction;
			constructor(operation, path, reason, options) {
				super(`Unsupported target for ${operation} at ${path}: ${reason}`, options);
				this.operation = operation;
				this.path = path;
				this.reason = reason;
				this.remediationAction = options?.remediationAction;
			}
		};
		ANALYSIS_RESOURCE_KINDS = [
			"memory",
			"cpu",
			"file-size",
			"transport",
			"capacity"
		];
		AnalysisResourceConstraintError = class extends AnalysisError {
			operation;
			resource;
			reason;
			reportedLimits;
			_tag = "AnalysisResourceConstraintError";
			remediationAction;
			/**
			* The fixed format, decoder, or capture allowance that refused the request.
			* Worker limits and host resources do not raise it, so recovery derives from
			* this allowance rather than from `resource`.
			*/
			fixedAllowance;
			/**
			* Whether retrying the same request can succeed. A caller-selected bound is
			* deterministic for the same input, so it is not retryable even when its
			* resource kind would otherwise be treated as admission capacity.
			*/
			retryable;
			constructor(operation, resource, reason, reportedLimits, options) {
				super(`Resource constraint during ${operation}: ${reason}`, options);
				this.operation = operation;
				this.resource = resource;
				this.reason = reason;
				this.reportedLimits = reportedLimits;
				this.remediationAction = options?.remediationAction;
				this.fixedAllowance = options?.fixedAllowance;
				this.retryable = options?.retryable;
			}
		};
		resourceConstraintRecovery = (error, text = (value) => value) => error.fixedAllowance !== undefined ? {
			fixedAllowance: {
				name: text(error.fixedAllowance.name),
				kind: error.fixedAllowance.kind
			},
			...retryable(error)
		} : {
			...error.remediationAction === undefined ? {} : { remediationAction: text(error.remediationAction) },
			...retryable(error)
		};
		retryable = (error) => error.retryable === undefined ? {} : { retryable: error.retryable };
		AnalysisProtocolError = class extends AnalysisError {
			_tag = "AnalysisProtocolError";
		};
		AnalysisInputError = class extends AnalysisError {
			operation;
			issues;
			_tag = "AnalysisInputError";
			userMessage;
			constructor(operation, options, issues = []) {
				super(`Invalid analysis input for ${operation}`, options);
				this.operation = operation;
				this.issues = issues;
				this.userMessage = options?.userMessage;
			}
		};
		AnalysisOutputError = class extends AnalysisError {
			operation;
			reason;
			_tag = "AnalysisOutputError";
			userMessage;
			remediationAction;
			cleanupOnly;
			constructor(operation, reason, options) {
				super(`Invalid analysis output for ${operation}: ${reason}`, options);
				this.operation = operation;
				this.reason = reason;
				this.userMessage = options?.userMessage;
				this.remediationAction = options?.remediationAction;
				this.cleanupOnly = options?.cleanupOnly ?? false;
			}
		};
		AnalysisCapabilityUnavailableError = class extends AnalysisError {
			providerId;
			operation;
			reason;
			_tag = "AnalysisCapabilityUnavailableError";
			userMessage;
			remediationAction;
			/** Incomplete cleanup must settle before the operation can be retried. */
			retryable;
			constructor(providerId, operation, reason, options) {
				super(`Provider ${providerId} cannot execute ${operation}: ${reason}`, options);
				this.providerId = providerId;
				this.operation = operation;
				this.reason = reason;
				this.userMessage = options?.userMessage;
				this.remediationAction = options?.remediationAction;
				this.retryable = options?.retryable === true && !this.cleanupIncomplete;
			}
		};
		AnalysisCancelledError = class extends AnalysisError {
			operation;
			_tag = "AnalysisCancelledError";
			constructor(operation, options) {
				super(`Analysis operation was cancelled: ${operation}`, options);
				this.operation = operation;
			}
		};
		AnalysisTimeoutError = class extends AnalysisError {
			operation;
			timeoutMs;
			_tag = "AnalysisTimeoutError";
			userMessage;
			remediationAction;
			constructor(operation, timeoutMs, options) {
				super(`Analysis operation timed out after ${String(timeoutMs)}ms: ${operation}`, options);
				this.operation = operation;
				this.timeoutMs = timeoutMs;
				this.userMessage = options?.userMessage;
				this.remediationAction = options?.remediationAction;
			}
		};
		AnalysisAccessDeniedError = class extends AnalysisError {
			operation;
			path;
			systemCode;
			_tag = "AnalysisAccessDeniedError";
			constructor(operation, path, systemCode, options) {
				super(`Host filesystem read access denied (${systemCode}) for ${path} during ${operation}`, options);
				this.operation = operation;
				this.path = path;
				this.systemCode = systemCode;
			}
		};
		AnalysisArtifactChangedError = class extends AnalysisError {
			operation;
			path;
			reason;
			_tag = "AnalysisArtifactChangedError";
			constructor(operation, path, reason, options) {
				super(`Selected artifact changed during acquisition: ${reason}`, options);
				this.operation = operation;
				this.path = path;
				this.reason = reason;
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
//#region dist/domain/immutableJson.js
function* ownedTreeChildren(value) {
	if (Array.isArray(value)) {
		for (let index = 0; index < value.length; index++) {
			const descriptor = Object.getOwnPropertyDescriptor(value, index);
			if (descriptor === undefined || !Object.hasOwn(descriptor, "value")) throw new TypeError("Owned JSON trees require dense data arrays");
			yield descriptor.value;
		}
	} else {
		for (const key in value) {
			if (!Object.hasOwn(value, key)) continue;
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			if (descriptor === undefined || !Object.hasOwn(descriptor, "value")) throw new TypeError("Immutable JSON snapshots cannot contain accessors");
			yield descriptor.value;
		}
	}
}
/**
* Seal exclusively owned JSON in bounded steps, authenticating only completion.
* Abandonment or failure can leave the provisional input partly frozen.
*/
function* freezeOwnedJsonSnapshotSteps(value) {
	const pending = [{
		value,
		exiting: false
	}];
	const visited = new Set();
	const ancestors = new Set();
	let examined = 0;
	try {
		while (pending.length > 0) {
			if (examined++ === 4096) {
				examined = 0;
				yield;
			}
			const entry = pending.pop();
			if (entry === undefined) break;
			const item = entry.value;
			if (entry.exiting && typeof item === "object" && item !== null) {
				ancestors.delete(item);
				visited.add(item);
				continue;
			}
			if (isImmutableJsonSnapshot(item)) continue;
			if (typeof item !== "object" || item === null) throw new TypeError("Immutable JSON snapshots require JSON values");
			if (ancestors.has(item)) throw new TypeError("Immutable JSON snapshots cannot contain circular references");
			if (visited.has(item)) continue;
			ancestors.add(item);
			pending.push({
				value: item,
				exiting: true
			});
			pushSnapshotChildren(item, pending);
			Object.freeze(item);
		}
		if (typeof value === "object" && value !== null) immutableSnapshots.add(value);
		return value;
	} finally {
		pending.length = 0;
		visited.clear();
		ancestors.clear();
	}
}
var immutableSnapshots, isImmutableJsonSnapshot, immutableJsonSnapshotMember, canBorrowParsedJsonSnapshot, freezeJsonSnapshot, freezeOwnedJsonTreeSnapshot, pushSnapshotChildren;
function init_immutableJson() {
	return (init_immutableJson = __esmMin((() => {
		immutableSnapshots = new WeakSet();
		isImmutableJsonSnapshot = (value) => value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value) || typeof value === "object" && immutableSnapshots.has(value);
		immutableJsonSnapshotMember = (snapshot, key) => {
			if (typeof snapshot !== "object" || snapshot === null || !immutableSnapshots.has(snapshot)) return undefined;
			const descriptor = Object.getOwnPropertyDescriptor(snapshot, key);
			if (descriptor === undefined || !Object.hasOwn(descriptor, "value")) return undefined;
			const member = descriptor.value;
			if (typeof member === "object" && member !== null) immutableSnapshots.add(member);
			return member;
		};
		canBorrowParsedJsonSnapshot = (source, parsed) => {
			if (!isImmutableJsonSnapshot(source)) return false;
			if (Object.is(source, parsed)) return true;
			const pending = [source, parsed];
			const compared = new Map();
			const sources = new Map();
			while (pending.length > 0) {
				const right = pending.pop();
				const left = pending.pop();
				if (typeof left !== "object" || left === null || typeof right !== "object" || right === null) {
					if (!Object.is(left, right)) return false;
					continue;
				}
				if (isProxy(right) || Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) return false;
				const previous = compared.get(left);
				if (previous !== undefined) {
					if (previous !== right) return false;
					continue;
				}
				if (sources.has(right)) return false;
				compared.set(left, right);
				sources.set(right, left);
				const keys = Reflect.ownKeys(left);
				if (keys.length !== Reflect.ownKeys(right).length) return false;
				for (const key of keys) {
					if (typeof key !== "string") return false;
					const a = Object.getOwnPropertyDescriptor(left, key);
					const b = Object.getOwnPropertyDescriptor(right, key);
					if (a === undefined || b === undefined || !Object.hasOwn(a, "value") || !Object.hasOwn(b, "value") || a.enumerable !== b.enumerable) return false;
					pending.push(a.value, b.value);
				}
			}
			return true;
		};
		freezeJsonSnapshot = (value) => {
			const pending = [{
				value,
				exiting: false
			}];
			const visited = new Set();
			const ancestors = new Set();
			const objects = [];
			while (pending.length > 0) {
				const entry = pending.pop();
				if (entry === undefined) break;
				const item = entry.value;
				if (entry.exiting && typeof item === "object" && item !== null) {
					ancestors.delete(item);
					visited.add(item);
					objects.push(item);
					continue;
				}
				if (isImmutableJsonSnapshot(item)) continue;
				if (typeof item !== "object" || item === null) throw new TypeError("Immutable JSON snapshots require JSON values");
				if (ancestors.has(item)) throw new TypeError("Immutable JSON snapshots cannot contain circular references");
				if (visited.has(item)) continue;
				ancestors.add(item);
				pending.push({
					value: item,
					exiting: true
				});
				pushSnapshotChildren(item, pending);
			}
			for (const item of objects) Object.freeze(item);
			if (typeof value === "object" && value !== null) immutableSnapshots.add(value);
			return value;
		};
		freezeOwnedJsonTreeSnapshot = (value) => {
			const frames = [];
			const ancestors = new Set();
			const enter = (item) => {
				if (isImmutableJsonSnapshot(item)) return;
				if (typeof item !== "object" || item === null) throw new TypeError("Immutable JSON snapshots require JSON values");
				if (isProxy(item)) throw new TypeError("Immutable JSON snapshots cannot contain proxies");
				if (ancestors.has(item)) throw new TypeError("Immutable JSON snapshots cannot contain circular references");
				const prototype = Object.getPrototypeOf(item);
				if (!Array.isArray(item) && prototype !== Object.prototype && prototype !== null) throw new TypeError("Immutable JSON snapshots require ordinary objects");
				ancestors.add(item);
				frames.push({
					value: item,
					children: ownedTreeChildren(item)
				});
			};
			enter(value);
			while (frames.length > 0) {
				const frame = frames[frames.length - 1];
				const next = frame.children.next();
				if (!next.done) enter(next.value);
				else {
					Object.freeze(frame.value);
					ancestors.delete(frame.value);
					frames.pop();
				}
			}
			if (typeof value === "object" && value !== null) immutableSnapshots.add(value);
			return value;
		};
		pushSnapshotChildren = (item, pending) => {
			if (isProxy(item)) throw new TypeError("Immutable JSON snapshots cannot contain proxies");
			const prototype = Object.getPrototypeOf(item);
			if (!Array.isArray(item) && prototype !== Object.prototype && prototype !== null) throw new TypeError("Immutable JSON snapshots require ordinary objects");
			if (Array.isArray(item)) {
				for (let index = 0; index < item.length; index += 1) if (!Object.hasOwn(item, index)) throw new TypeError("Immutable JSON snapshots cannot contain sparse arrays");
			}
			for (const key of Object.getOwnPropertyNames(item)) {
				const descriptor = Object.getOwnPropertyDescriptor(item, key);
				if (descriptor === undefined || !Object.hasOwn(descriptor, "value")) throw new TypeError("Immutable JSON snapshots cannot contain accessors");
				const child = descriptor.value;
				pending.push({
					value: child,
					exiting: false
				});
			}
		};
	})))();
}

//#endregion
//#region dist/domain/jsonValue.js
function* ownEnumerableKeys(value) {
	for (const key in value) if (Object.hasOwn(value, key)) yield key;
}
/** Validate JSON in bounded steps; cache only authenticated immutable roots. */
function* jsonValueValidationSteps(root) {
	const immutable = typeof root === "object" && root !== null && isImmutableJsonSnapshot(root) ? root : undefined;
	if (immutable !== undefined && immutableValidation.has(immutable)) return immutableValidation.get(immutable);
	const finish = (issue) => {
		if (immutable !== undefined) immutableValidation.set(immutable, issue);
		return issue;
	};
	const pending = [];
	let value = root;
	let depth = 0;
	let inspect = true;
	let examined = 0;
	for (;;) {
		if (inspect) {
			if (examined++ === 4096) {
				examined = 0;
				yield;
			}
			if (depth > 1e3) return finish(`JSON value exceeds maximum nesting depth of ${MAX_JSON_DEPTH}. This release has no runtime override.`);
			if (typeof value === "object" && value !== null && types.isProxy(value)) return finish("JSON values cannot contain proxies");
			if (value === null || typeof value === "string" || typeof value === "boolean") {
				inspect = false;
			} else if (typeof value === "number") {
				if (!Number.isFinite(value)) return finish("JSON numbers must be finite");
				inspect = false;
			} else if (Array.isArray(value)) {
				pending.push({
					kind: "array",
					value,
					depth,
					index: 0
				});
				inspect = false;
			} else if (isRecord$1(value)) {
				const prototype = Object.getPrototypeOf(value);
				if (prototype !== Object.prototype && prototype !== null) return finish("JSON objects require ordinary data properties");
				for (const key of Object.getOwnPropertySymbols(value)) if (Object.getOwnPropertyDescriptor(value, key)?.enumerable === true) return finish("JSON object keys must be strings");
				pending.push({
					kind: "object",
					value,
					depth,
					keys: ownEnumerableKeys(value)
				});
				inspect = false;
			} else return finish("Invalid JSON value");
			continue;
		}
		const frame = pending[pending.length - 1];
		if (frame === undefined) return finish(undefined);
		if (frame.kind === "array") {
			if (frame.index >= frame.value.length) {
				pending.pop();
				continue;
			}
			const index = frame.index++;
			const descriptor = Object.getOwnPropertyDescriptor(frame.value, index);
			if (descriptor === undefined || !Object.hasOwn(descriptor, "value")) return finish("JSON arrays require dense data properties without accessors");
			value = descriptor.value;
			depth = frame.depth + 1;
			inspect = true;
			continue;
		}
		const next = frame.keys.next();
		if (next.done) {
			pending.pop();
			continue;
		}
		const descriptor = Object.getOwnPropertyDescriptor(frame.value, next.value);
		if (descriptor?.enumerable !== true) continue;
		if (!Object.hasOwn(descriptor, "value")) return finish("JSON objects cannot contain accessors");
		value = descriptor.value;
		depth = frame.depth + 1;
		inspect = true;
	}
}
var MAX_JSON_DEPTH, isRecord$1, immutableValidation, jsonValueValidationIssue, preserveJsonValue, validatedJsonValue, jsonValueSchema, ownedJsonValueSchema, objectValidation, objectProjection, jsonObjectSchema;
function init_jsonValue() {
	return (init_jsonValue = __esmMin((() => {
		init_immutableJson();
		MAX_JSON_DEPTH = 1e3;
		isRecord$1 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		immutableValidation = new WeakMap();
		jsonValueValidationIssue = (root) => {
			const steps = jsonValueValidationSteps(root);
			for (;;) {
				const step = steps.next();
				if (step.done) return step.value;
			}
		};
		preserveJsonValue = (value) => {
			const immutableCandidate = value;
			if (isImmutableJsonSnapshot(immutableCandidate)) return value;
			if (Array.isArray(value)) {
				const copy = [];
				for (let index = 0; index < value.length; index += 1) copy.push(preserveJsonValue(value[index]));
				return copy;
			}
			if (value !== null && typeof value === "object") {
				const copy = {};
				for (const key of ownEnumerableKeys(value)) Object.defineProperty(copy, key, {
					value: preserveJsonValue(value[key]),
					enumerable: true,
					configurable: true,
					writable: true
				});
				return copy;
			}
			return value;
		};
		validatedJsonValue = z.unknown().superRefine((value, context) => {
			const issue = jsonValueValidationIssue(value);
			if (issue !== undefined) context.addIssue({
				code: "custom",
				message: issue,
				continue: false
			});
		}).transform((value) => value);
		validatedJsonValue._zod.toJSONSchema = () => ({});
		jsonValueSchema = z.unknown().nonoptional().pipe(validatedJsonValue).transform(preserveJsonValue);
		jsonValueSchema._zod.toJSONSchema = () => ({});
		ownedJsonValueSchema = z.unknown().nonoptional().pipe(validatedJsonValue);
		ownedJsonValueSchema._zod.toJSONSchema = () => ({});
		objectValidation = z.custom(isRecord$1, "Expected JSON object");
		objectProjection = () => ({
			type: "object",
			additionalProperties: {}
		});
		objectValidation._zod.toJSONSchema = objectProjection;
		jsonObjectSchema = jsonValueSchema.pipe(objectValidation);
		jsonObjectSchema._zod.toJSONSchema = objectProjection;
	})))();
}

//#endregion
//#region dist/domain/configurationErrors.js
var ConfigurationError, NoBinaryOpenError, BinaryTargetError, readPermissionCode;
function init_configurationErrors() {
	return (init_configurationErrors = __esmMin((() => {
		init_analysisErrorBase();
		ConfigurationError = class extends AnalysisError {
			_tag = "ConfigurationError";
			settings;
			constructor(message, options) {
				super(message, options);
				this.settings = (options?.settings ?? []).map(({ setting, constraint }) => ({
					setting,
					constraint
				}));
			}
		};
		NoBinaryOpenError = class extends AnalysisError {
			_tag = "NoBinaryOpenError";
			constructor() {
				super("No app is open. Ask the user which app to investigate, then call open_binary with its local path.");
			}
		};
		BinaryTargetError = class extends AnalysisError {
			path;
			reason;
			_tag = "BinaryTargetError";
			constraint;
			/** The OS read-permission code of the cause, when the host denied access. */
			systemCode;
			constructor(path, reason, options) {
				super(`Cannot open artifact: ${reason}`, options);
				this.path = path;
				this.reason = reason;
				this.constraint = options?.constraint;
				this.systemCode = readPermissionCode(options?.cause);
			}
		};
		readPermissionCode = (cause) => {
			const code = cause instanceof Error ? Reflect.get(cause, "code") : undefined;
			return code === "EACCES" || code === "EPERM" ? code : undefined;
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
//#region dist/domain/result.js
var ok, err;
function init_result() {
	return (init_result = __esmMin((() => {
		ok = (value) => ({
			ok: true,
			value
		});
		err = (error) => ({
			ok: false,
			error
		});
	})))();
}

//#endregion
//#region dist/domain/jsonSerialization.js
/** Encode ordinary JSON as bounded string parts without a document-sized allocation. */
function* jsonParts(value, pretty = false) {
	yield* encodeValue(value, pretty, false);
}
/** Encode validated JSON with canonical key ordering without allocating the whole document. */
function* canonicalJsonParts(value) {
	yield* encodeValue(value, false, true);
}
/** Buffer JSON parts while preserving complete UTF-16 surrogate pairs. */
function* bufferedJsonParts(parts) {
	let buffer = "";
	for (const part of parts) {
		if (buffer.length + part.length > 64 * 1024 && buffer !== "") {
			yield buffer;
			buffer = "";
		}
		buffer += part;
	}
	if (buffer !== "") yield buffer;
}
function* encodeString(value) {
	if (value.length <= 8192) {
		yield JSON.stringify(value);
		return;
	}
	yield "\"";
	for (let start = 0; start < value.length;) {
		let end = Math.min(start + 8192, value.length);
		const last = value.charCodeAt(end - 1);
		const next = value.charCodeAt(end);
		if (end < value.length && last >= 55296 && last <= 56319 && next >= 56320 && next <= 57343) end -= 1;
		yield JSON.stringify(value.slice(start, end)).slice(1, -1);
		start = end;
	}
	yield "\"";
}
/**
* Encode iteratively into bounded parts. Recursive `yield*` delegation passed
* every token through one generator frame per nesting level, which dominated
* the cost of writing large nested results.
*/
function* encodeValue(root, pretty, canonical) {
	const ancestors = new Set();
	const stack = [];
	let buffer = "";
	let pending = root;
	let hasPending = true;
	while (true) {
		if (hasPending) {
			hasPending = false;
			const text = scalarText(pending);
			if (text !== undefined) buffer += text;
			else if (typeof pending === "string") {
				if (buffer !== "") yield buffer;
				buffer = "";
				yield* encodeString(pending);
			} else {
				const frame = openContainer(pending, stack.length, ancestors, canonical);
				stack.push(frame);
				buffer += frame.array ? "[" : "{";
			}
		}
		if (buffer.length >= PART_CHARACTERS) {
			yield buffer;
			buffer = "";
		}
		const frame = stack.at(-1);
		if (frame === undefined) break;
		const member = nextMember(frame);
		if (member === undefined) {
			if (pretty && frame.written > 0) buffer += indent(frame.depth);
			buffer += frame.array ? "]" : "}";
			ancestors.delete(frame.value);
			stack.pop();
			continue;
		}
		if (frame.written > 0) buffer += ",";
		if (pretty) buffer += indent(frame.depth + 1);
		if (member.key !== undefined) {
			const key = scalarText(member.key);
			if (key !== undefined) buffer += key;
			else {
				if (buffer !== "") yield buffer;
				buffer = "";
				yield* encodeString(member.key);
			}
			buffer += pretty ? ": " : ":";
		}
		frame.written += 1;
		pending = member.item;
		hasPending = true;
	}
	if (buffer !== "") yield buffer;
}
var jsonStringCodeUnits, jsonByteLength, jsonTextCodeUnits, equalJsonText, PART_CHARACTERS, indentation, indent, scalarText, openContainer, nextMember;
function init_jsonSerialization() {
	return (init_jsonSerialization = __esmMin((() => {
		jsonStringCodeUnits = (value) => {
			let length = value.length + 2;
			for (let index = 0; index < value.length; index += 1) {
				const code = value.charCodeAt(index);
				if (code === 34 || code === 92) length += 1;
				else if (code < 32) length += code === 8 || code === 9 || code === 10 || code === 12 || code === 13 ? 1 : 5;
				else if (code >= 55296 && code <= 57343) {
					const next = value.charCodeAt(index + 1);
					if (code <= 56319 && next >= 56320 && next <= 57343) index += 1;
					else length += 5;
				}
			}
			return length;
		};
		jsonByteLength = (value) => {
			let bytes = 0;
			for (const part of jsonParts(value)) bytes += Buffer.byteLength(part, "utf8");
			return bytes;
		};
		jsonTextCodeUnits = (value) => {
			let length = 0;
			for (const part of jsonParts(value)) length += part.length;
			return length;
		};
		equalJsonText = (left, right) => {
			const a = jsonParts(left);
			const b = jsonParts(right);
			let x = a.next();
			let y = b.next();
			let i = 0;
			let j = 0;
			try {
				while (!x.done && !y.done) {
					const length = Math.min(x.value.length - i, y.value.length - j);
					if (x.value.slice(i, i + length) !== y.value.slice(j, j + length)) return false;
					i += length;
					j += length;
					if (i === x.value.length) {
						x = a.next();
						i = 0;
					}
					if (j === y.value.length) {
						y = b.next();
						j = 0;
					}
				}
				return x.done === true && y.done === true;
			} finally {
				a.return(undefined);
				b.return(undefined);
			}
		};
		PART_CHARACTERS = 16 * 1024;
		indentation = [];
		indent = (depth) => indentation[depth] ??= `\n${"  ".repeat(depth)}`;
		scalarText = (value) => {
			if (typeof value === "string") return value.length <= 8192 ? JSON.stringify(value) : undefined;
			if (value === null) return "null";
			if (typeof value === "boolean") return String(value);
			if (typeof value === "number" && Number.isFinite(value)) return String(value);
			return undefined;
		};
		openContainer = (value, depth, ancestors, canonical) => {
			if (typeof value !== "object" || value === null) throw new TypeError("JSON output requires ordinary JSON values");
			if (ancestors.has(value)) throw new TypeError("JSON output contains a circular reference");
			const array = Array.isArray(value);
			if (!array && Object.prototype.toString.call(value) !== "[object Object]") throw new TypeError("JSON output requires ordinary JSON objects");
			ancestors.add(value);
			const keys = array ? undefined : Object.keys(value);
			if (canonical) keys?.sort();
			const count = array ? value.length : keys?.length ?? 0;
			return {
				value,
				array,
				keys,
				count,
				depth,
				index: 0,
				written: 0
			};
		};
		nextMember = (frame) => {
			while (frame.index < frame.count) {
				const index = frame.index;
				frame.index += 1;
				if (frame.array) return {
					key: undefined,
					item: Reflect.get(frame.value, index)
				};
				const key = frame.keys?.[index];
				if (key === undefined) throw new TypeError("JSON object changed during serialization");
				const item = Reflect.get(frame.value, key);
				if (item !== undefined && typeof item !== "function" && typeof item !== "symbol") return {
					key,
					item
				};
			}
			return undefined;
		};
	})))();
}

//#endregion
//#region dist/cli/cliOutputFormatter.js
var formatCliOutput, isScalar, isFlatObject, isObjectArray, isWordCharacter, escapeInlineSyntax, escapeTableCell, renderTable, markdownCell, formatKeyValueTable, formatObjectTable, formatMarkdown;
function init_cliOutputFormatter() {
	return (init_cliOutputFormatter = __esmMin((() => {
		formatCliOutput = (value, format) => format === "md" ? formatMarkdown(value) : Formatter.format(value, format);
		isScalar = (value) => value === null || value === undefined || typeof value !== "object";
		isFlatObject = (value) => Object.values(value).every(isScalar);
		isObjectArray = (value) => Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "object" && item !== null && !Array.isArray(item)) && value.some((item) => Object.keys(item).length > 0);
		isWordCharacter = (character) => character !== undefined && /[\p{L}\p{N}]/u.test(character);
		escapeInlineSyntax = (match, offset, text) => match.startsWith("_") && isWordCharacter(text[offset - 1]) && isWordCharacter(text[offset + match.length]) ? match : match.replace(/./g, "\\$&");
		escapeTableCell = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\\|`*[\]~]|_+/g, escapeInlineSyntax).replace(/\r\n|\r|\n/g, "<br>");
		renderTable = (headers, rows) => {
			if (headers.length === 0) return "";
			const escapedHeaders = headers.map(escapeTableCell);
			const widths = escapedHeaders.map((header) => header.length);
			for (const row of rows) {
				for (let index = 0; index < escapedHeaders.length; index += 1) {
					const width = escapeTableCell(row[index] ?? "").length;
					if (width > widths[index]) widths[index] = width;
				}
			}
			const pad = (value, index) => value.padEnd(widths[index]);
			const lines = [`| ${escapedHeaders.map(pad).join(" | ")} |`, `|${widths.map((width) => "-".repeat(width + 2)).join("|")}|`];
			for (const row of rows) {
				lines.push(`| ${escapedHeaders.map((_, index) => pad(escapeTableCell(row[index] ?? ""), index)).join(" | ")} |`);
			}
			return lines.join("\n");
		};
		markdownCell = (value) => value !== null && typeof value === "object" ? JSON.stringify(value) : value === undefined ? "" : String(value);
		formatKeyValueTable = (value) => renderTable(["Key", "Value"], Object.entries(value).map(([key, child]) => [key, markdownCell(child)]));
		formatObjectTable = (items) => {
			const headers = [];
			const seen = new Set();
			for (const item of items) for (const key of Object.keys(item)) if (!seen.has(key)) {
				seen.add(key);
				headers.push(key);
			}
			if (headers.length === 0) return markdownCell(items);
			return renderTable(headers, items.map((item) => headers.map((key) => markdownCell(Object.hasOwn(item, key) ? item[key] : undefined))));
		};
		formatMarkdown = (value, path = []) => {
			if (value == null && path.length === 0) return "";
			if (isScalar(value)) {
				if (path.length === 0) return String(value);
				return `## ${path.join(".")}\n\n${String(value)}`;
			}
			if (Array.isArray(value)) {
				if (isObjectArray(value)) {
					const table = formatObjectTable(value);
					return path.length === 0 ? table : `## ${path.join(".")}\n\n${table}`;
				}
				return formatMarkdown(markdownCell(value), path);
			}
			const object = value;
			const entries = Object.entries(object);
			if (path.length === 0 && isFlatObject(object)) return formatKeyValueTable(object);
			const needsHeadings = path.length > 0 || entries.length > 1 || entries.some(([, child]) => !isScalar(child));
			if (!needsHeadings) return formatKeyValueTable(object);
			return entries.map(([key, child]) => {
				const childPath = [...path, key];
				const heading = `## ${childPath.join(".")}\n\n`;
				if (isScalar(child)) return `${heading}${String(child)}`;
				if (isObjectArray(child)) return `${heading}${formatObjectTable(child)}`;
				if (typeof child === "object" && child !== null && !Array.isArray(child)) {
					const nested = child;
					return isFlatObject(nested) ? `${heading}${formatKeyValueTable(nested)}` : formatMarkdown(nested, childPath);
				}
				return `${heading}${markdownCell(child)}`;
			}).join("\n\n");
		};
	})))();
}

//#endregion
//#region dist/cli/jsonOutput.js
/** The exact formatted document, including its final newline. */
function* jsonOutputParts(value, format, pretty = true) {
	if (format === "jsonl" && Array.isArray(value)) {
		for (const item of value) {
			yield* jsonParts(item);
			yield "\n";
		}
		return;
	}
	yield* jsonParts(value, pretty && format === "json");
	yield "\n";
}
var writeJsonOutput, writeOutputParts, isTerminalOutput, writeOutputText;
function init_jsonOutput() {
	return (init_jsonOutput = __esmMin((() => {
		init_jsonSerialization();
		writeJsonOutput = async (value, destination, format = "json") => {
			await writeOutputParts(destination, jsonOutputParts(value, format, isTerminalOutput(destination)));
		};
		writeOutputParts = async (destination, parts) => {
			for (const part of bufferedJsonParts(parts)) await writeOutputText(destination, part);
		};
		isTerminalOutput = (destination) => "isTTY" in destination && destination.isTTY === true;
		writeOutputText = (destination, part) => new Promise((resolve, reject) => {
			const onError = (cause) => reject(cause);
			destination.once("error", onError);
			try {
				destination.write(part, (cause) => {
					if (cause) {
						setImmediate(() => destination.off("error", onError));
						reject(cause);
					} else {
						destination.off("error", onError);
						resolve();
					}
				});
			} catch (cause) {
				destination.off("error", onError);
				reject(cause);
			}
		});
	})))();
}

//#endregion
//#region dist/cli/jsonLines.js
function* jsonLinesParts(plan) {
	for (const record of jsonLinesRecords(plan)) {
		yield* jsonLineParts(record);
	}
}
/** One record stays one line even when the record itself is an array. */
function* jsonLineParts(record) {
	yield* jsonParts(record);
	yield "\n";
}
/** Newline-separated records also bound the token estimator's working set. */
function* jsonLinesRecords(plan) {
	yield* plan.records;
	if (plan.context !== undefined || plan.path.length > 0) {
		const metadata = {
			$rea: JSON_LINES_PROTOCOL,
			type: "metadata",
			records: {
				path: plan.path,
				emitted: plan.records.length,
				source: plan.sourceRecords,
				...plan.filter === undefined ? {} : { filter: plan.filter }
			},
			context: plan.context ?? null
		};
		yield metadata;
	}
}
var JSON_LINES_PROTOCOL, COLLECTION_KEYS, isRecord, atPath, collections, documentCollections, withoutRecords, prepareJsonLines, jsonLinesErrorRecord;
function init_jsonLines() {
	return (init_jsonLines = __esmMin((() => {
		init_result();
		init_analysisErrorCore();
		init_jsonSerialization();
		JSON_LINES_PROTOCOL = "jsonl/v1";
		COLLECTION_KEYS = [
			"rows",
			"items",
			"records",
			"occurrences"
		];
		isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		atPath = (value, path) => {
			for (const key of path) {
				if (!isRecord(value) || !Object.hasOwn(value, key)) return undefined;
				value = value[key];
			}
			return value;
		};
		collections = (value, prefix) => {
			if (Array.isArray(value)) return [{
				records: value,
				path: prefix
			}];
			if (!isRecord(value)) return [];
			const found = [];
			const collect = (object, path) => {
				for (const key of COLLECTION_KEYS) {
					const records = object[key];
					if (Object.hasOwn(object, key) && Array.isArray(records)) found.push({
						records,
						path: [...path, key]
					});
				}
			};
			collect(value, prefix);
			if (Object.hasOwn(value, "page") && isRecord(value.page)) collect(value.page, [...prefix, "page"]);
			return found;
		};
		documentCollections = (value, fullOutput) => {
			const prefix = fullOutput ? ["data"] : [];
			const data = atPath(value, prefix);
			return [...collections(data, prefix), ...collections(atPath(data, ["normalized_result"]), [...prefix, "normalized_result"])];
		};
		withoutRecords = (source, selected, path, filtered) => {
			if (path.length === 0 || !isRecord(source)) return undefined;
			const context = { ...source };
			const selectedObject = isRecord(selected) ? selected : undefined;
			if (filtered && Object.hasOwn(source, "evidence_id") && typeof source.evidence_id === "string" && Object.hasOwn(source, "normalized_result")) {
				if (selectedObject && Object.hasOwn(selectedObject, "raw_result")) context.raw_result = selectedObject.raw_result;
				else delete context.raw_result;
			}
			const [key, ...rest] = path;
			if (key === undefined) return context;
			if (rest.length === 0) delete context[key];
			else context[key] = withoutRecords(source[key], selectedObject?.[key], rest, filtered);
			return context;
		};
		prepareJsonLines = (selected, options) => {
			const found = documentCollections(selected, options.fullOutput === true);
			const reject = (reason) => err(new AnalysisOutputError(options.command, reason, { remediationAction: "Use --format json for the complete document, or select one record collection with --filter-output." }));
			if (found.length !== 1) return reject(found.length === 0 ? "JSON Lines requires an array or one explicit rows, items, records, or occurrences collection." : "JSON Lines cannot choose between multiple record collections. Select one collection explicitly.");
			const collection = found[0];
			if (collection === undefined) return reject("The record collection is unavailable.");
			for (const record of collection.records) {
				if (isRecord(record) && Object.hasOwn(record, "$rea")) return reject("A data record uses the reserved $rea JSON Lines control marker.");
			}
			const source = Object.hasOwn(options, "source") ? options.source : selected;
			const originalRecords = atPath(source, collection.path);
			const sourceMatches = Array.isArray(originalRecords);
			let context = withoutRecords(sourceMatches ? source : selected, selected, collection.path, options.filter !== undefined);
			if (options.filter !== undefined && sourceMatches) {
				for (const peer of documentCollections(source, options.fullOutput === true)) {
					if (peer.path.join(".") !== collection.path.join(".")) context = withoutRecords(context, selected, peer.path, true);
				}
			}
			return ok({
				...collection,
				context,
				sourceRecords: sourceMatches ? originalRecords.length : null,
				filter: options.filter
			});
		};
		jsonLinesErrorRecord = (result) => ({
			$rea: JSON_LINES_PROTOCOL,
			type: "error",
			ok: false,
			result
		});
	})))();
}

//#endregion
export { ANALYSIS_RESOURCE_KINDS, AnalysisAccessDeniedError, AnalysisArtifactChangedError, AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisError, AnalysisInputError, AnalysisOutputError, AnalysisProtocolError, AnalysisResourceConstraintError, AnalysisSnapshotMismatchError, AnalysisTimeoutError, AnalysisUnsupportedTargetError, BinaryTargetError, ConfigurationError, EvidenceFileError, EvidenceIntegrityError, EvidenceReferenceError, MAX_JSON_DEPTH, NoBinaryOpenError, artifactIntegrityClaimSchema, artifactIntegrityDetails, artifactIntegrityPair, artifactIntegrityPairOf, artifactMd5PairSchema, artifactSha256PairSchema, bufferedJsonParts, canBorrowParsedJsonSnapshot, canonicalJsonParts, equalJsonText, err, fixedAllowanceOptions, fixedAllowanceRemediation, fixedProducerInputAllowance, formatCliOutput, freezeJsonSnapshot, freezeOwnedJsonSnapshotSteps, freezeOwnedJsonTreeSnapshot, immutableJsonSnapshotMember, init_analysisErrorBase, init_analysisErrorCore, init_artifactIntegrity, init_cliOutputFormatter, init_configurationErrors, init_evidenceErrors, init_fixedAllowanceRemediation, init_immutableJson, init_jsonLines, init_jsonOutput, init_jsonSerialization, init_jsonValue, init_result, isImmutableJsonSnapshot, isTerminalOutput, jsonByteLength, jsonLineParts, jsonLinesErrorRecord, jsonLinesParts, jsonLinesRecords, jsonObjectSchema, jsonOutputParts, jsonParts, jsonStringCodeUnits, jsonTextCodeUnits, jsonValueSchema, jsonValueValidationIssue, jsonValueValidationSteps, ok, ownedJsonValueSchema, prepareJsonLines, primaryAnalysisError, projectArtifactIntegrityDetails, resolvedAnalysisError, resourceConstraintRecovery, writeJsonOutput, writeOutputParts, writeOutputText };