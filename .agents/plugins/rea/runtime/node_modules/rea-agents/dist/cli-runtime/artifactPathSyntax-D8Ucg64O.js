import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { err, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { ProviderProcessSupervisor, init_ProviderProcess, spawnOwnedProviderProcess } from "./ProviderProcess-DdOAhfXm.js";
import { cleanupOwnedProcessGroup, init_ProcessOwnership } from "./ProcessOwnership-BIq-8nU3.js";
import { PrivateRuntimeRoot, init_PrivateRuntimeRoot } from "./PrivateRuntimeRoot-CCl5QOdR.js";
import { z } from "zod";

//#region dist/domain/javascript/javascriptModuleSpecifier.js
var isRelativeJavaScriptModuleSpecifier, decodeJavaScriptModuleUrlPath;
function init_javascriptModuleSpecifier() {
	return (init_javascriptModuleSpecifier = __esmMin((() => {
		init_result();
		isRelativeJavaScriptModuleSpecifier = (value) => value === "." || value === ".." || value.startsWith("./") || value.startsWith("../");
		decodeJavaScriptModuleUrlPath = (value) => {
			if (/%(?:2f|5c)/iu.test(value)) return err("ES module URL paths cannot contain percent-encoded slash or backslash bytes.");
			try {
				const decoded = decodeURIComponent(value);
				return decoded.includes("\0") ? err("The decoded module URL path contains NUL.") : ok(decoded);
			} catch (cause) {
				if (!(cause instanceof URIError)) throw cause;
				return err("The module URL path contains malformed percent encoding.");
			}
		};
	})))();
}

//#endregion
//#region dist/application/TypeScriptEmittedSourceCandidates.js
var EMITTED_SUFFIXES, typescriptEmittedSourceCandidates;
function init_TypeScriptEmittedSourceCandidates() {
	return (init_TypeScriptEmittedSourceCandidates = __esmMin((() => {
		EMITTED_SUFFIXES = [
			[".js", [
				".ts",
				".tsx",
				".d.ts"
			]],
			[".mjs", [".mts", ".d.mts"]],
			[".cjs", [".cts", ".d.cts"]],
			[".jsx", [".tsx", ".d.ts"]]
		];
		typescriptEmittedSourceCandidates = (sourcePath, candidate) => {
			if (!/\.(?:ts|tsx|mts|cts)$/u.test(sourcePath)) return [];
			const emitted = EMITTED_SUFFIXES.find(([suffix]) => candidate.endsWith(suffix));
			if (emitted === undefined) return [];
			const stem = candidate.slice(0, candidate.length - emitted[0].length);
			return emitted[1].map((suffix) => ({
				path: `${stem}${suffix}`,
				kind: suffix.startsWith(".d.") ? "declaration" : "implementation"
			}));
		};
	})))();
}

//#endregion
//#region dist/process/WorkerFrameSignal.js
var WorkerFrameSignal;
function init_WorkerFrameSignal() {
	return (init_WorkerFrameSignal = __esmMin((() => {
		WorkerFrameSignal = class {
			#waiters = new Set();
			wake(outcome) {
				for (const wake of this.#waiters) wake(outcome);
				this.clear();
			}
			clear() {
				this.#waiters.clear();
			}
			async waitForOutputClose(supervisor, signal) {
				let wakeFrame;
				const frameAvailable = new Promise((resolve) => {
					wakeFrame = resolve;
					this.#waiters.add(wakeFrame);
				});
				const outputCloseController = new AbortController();
				const interruptOutputClose = () => outputCloseController.abort(signal.reason);
				if (signal.aborted) interruptOutputClose();
				else signal.addEventListener("abort", interruptOutputClose, { once: true });
				try {
					const outputClose = supervisor.waitForOutputClose(undefined, outputCloseController.signal).then((closed) => closed ? "closed" : "interrupted");
					return await Promise.race([frameAvailable, outputClose]);
				} finally {
					outputCloseController.abort();
					signal.removeEventListener("abort", interruptOutputClose);
					this.#waiters.delete(wakeFrame);
				}
			}
		};
	})))();
}

//#endregion
//#region dist/process/OwnedWorkerRuntime.js
var _a, OwnedWorkerRuntimeCleanupError, OwnedWorkerRuntimeCleanupEpoch, OwnedWorkerRuntime, releasedCleanupOwner, message;
function init_OwnedWorkerRuntime() {
	return (init_OwnedWorkerRuntime = __esmMin((() => {
		init_PrivateRuntimeRoot();
		init_ProviderProcess();
		init_ProcessOwnership();
		;
		OwnedWorkerRuntimeCleanupError = class extends Error {
			cleanupResources;
			processId;
			#cleanupEpoch;
			constructor(cleanupResources, processId, message, cleanupEpoch, options) {
				super(message, options);
				this.cleanupResources = cleanupResources;
				this.processId = processId;
				this.name = "OwnedWorkerRuntimeCleanupError";
				this.#cleanupEpoch = cleanupEpoch;
			}
			bindCleanupFailure(error) {
				if (this.#cleanupEpoch === undefined) {
					error.bindCleanupResourceOwner(releasedCleanupOwner);
					error.resolveCleanup();
					return;
				}
				this.#cleanupEpoch.bind(error);
			}
		};
		OwnedWorkerRuntimeCleanupEpoch = class {
			rootPath;
			#released = false;
			#runId;
			#failures = [];
			constructor(rootPath) {
				this.rootPath = rootPath;
			}
			get cleanupResources() {
				return this.#released ? [] : [...this.#runId === undefined ? [] : [this.#runId], this.rootPath];
			}
			setRunId(runId) {
				if (!this.#released) this.#runId = runId;
			}
			bind(error) {
				error.bindCleanupResourceOwner(this);
				if (this.#released) {
					error.resolveCleanup();
					return;
				}
				this.#failures = [...this.#failures.filter((reference) => reference.deref() !== undefined), new WeakRef(error)];
			}
			release() {
				if (this.#released) return;
				this.#released = true;
				for (const reference of this.#failures) reference.deref()?.resolveCleanup();
				this.#failures = [];
			}
		};
		OwnedWorkerRuntime = class {
			options;
			static #pending = new Set();
			#root;
			#cleanupEpoch;
			#supervisor;
			#processId = null;
			#acquisition;
			#cleanupRetryAttempt;
			#stopAttempt;
			#closeAttempt;
			#closing = false;
			#closed = false;
			#lastRunId;
			#terminalCloseRequested = false;
			#inputFailure;
			#stdinGeneration = 0;
			#stdoutListeners = new Set();
			constructor(options) {
				this.options = options;
			}
			get rootPath() {
				return this.#root?.path;
			}
			/** Exposes the exact supervisor so consumers retain their protocol policy. */
			get supervisor() {
				return this.#supervisor;
			}
			get cleanupResources() {
				const resources = [...this.#supervisor === undefined ? [] : [this.#supervisor.launch.ownership?.runId ?? this.#lastRunId], ...this.#root === undefined ? [] : [this.#root.path]].filter((resource) => resource !== undefined);
				return resources.length === 0 ? [] : resources;
			}
			/** Whether this exact owner still retains an unconfirmed resource release. */
			get hasPendingCleanup() {
				return _a.#pending.has(this);
			}
			/** First error observed on the current child's request stream, if any. */
			get inputFailure() {
				return this.#inputFailure;
			}
			/** Keep a returned typed cleanup error live until this exact owner releases. */
			bindCleanupFailure(error) {
				if (this.#cleanupEpoch === undefined) {
					error.bindCleanupResourceOwner(releasedCleanupOwner);
					error.resolveCleanup();
					return;
				}
				this.#cleanupEpoch.bind(error);
			}
			/** Mark this still-owned runtime for retry before any consumer starts a child. */
			retainForCleanup() {
				_a.#pending.add(this);
			}
			/** Retry every earlier worker owner before any consumer admits a new child. */
			static async retryPending(except) {
				for (const owner of [...this.#pending]) if (owner !== except) await owner.#retryPending();
			}
			/**
			* Acquire one child and let the protocol owner complete its own handshake.
			* Close waits for this entire callback, including a late handshake.
			*/
			start(spawnOptions, initialize) {
				if (this.#terminalCloseRequested || this.#closing) return Promise.reject(new Error("Owned worker runtime is closing"));
				if (this.#acquisition !== undefined) return this.#acquisition;
				if (this.#supervisor !== undefined && !_a.#pending.has(this)) return Promise.resolve();
				if (this.options.retryCleanup !== undefined && _a.#pending.has(this)) return this.#retryOwnedCleanup().then(() => {
					if (this.#terminalCloseRequested || this.#closing) throw new Error("Owned worker runtime is closing");
					return this.start(spawnOptions, initialize);
				});
				const ownRetry = _a.#pending.has(this) ? this.#retryPending() : Promise.resolve();
				const acquisition = ownRetry.then(async () => {
					if (this.#closed) this.#closed = false;
					await this.#start(spawnOptions, initialize);
				});
				this.#acquisition = acquisition;
				void acquisition.finally(() => {
					if (this.#acquisition === acquisition) this.#acquisition = undefined;
				}).catch(() => undefined);
				return acquisition;
			}
			/** Attach protocol stdout while ensuring it is detached before process stop. */
			onStdout(listener) {
				const stream = this.#supervisor?.launch.process.stdout;
				if (stream === null || stream === undefined) throw new Error("Owned worker runtime has no stdout stream");
				stream.on("data", listener);
				this.#stdoutListeners.add({
					stream,
					listener
				});
			}
			stop() {
				if (this.#stopAttempt !== undefined) return this.#stopAttempt;
				const attempt = this.#stop();
				this.#stopAttempt = attempt;
				void attempt.finally(() => {
					if (this.#stopAttempt === attempt) this.#stopAttempt = undefined;
				}).catch(() => undefined);
				return attempt;
			}
			/** Stop the exact child before releasing its root; every failure is retryable. */
			close() {
				this.#terminalCloseRequested = true;
				this.#closing = true;
				if (this.#closed) return Promise.resolve();
				if (this.#closeAttempt !== undefined) return this.#closeAttempt;
				const attempt = this.#close();
				this.#closeAttempt = attempt;
				void attempt.finally(() => {
					if (this.#closeAttempt === attempt) this.#closeAttempt = undefined;
				}).catch(() => undefined);
				return attempt;
			}
			async #retryPending() {
				if (this.options.retryCleanup !== undefined) return this.#retryOwnedCleanup();
				if (this.#terminalCloseRequested) return this.close();
				this.#closing = true;
				if (this.#closeAttempt === undefined) {
					const attempt = this.#close();
					this.#closeAttempt = attempt;
					void attempt.finally(() => {
						if (this.#closeAttempt === attempt) this.#closeAttempt = undefined;
					}).catch(() => undefined);
				}
				const attempt = this.#closeAttempt;
				if (attempt === undefined) return;
				try {
					await attempt;
					if (!this.#terminalCloseRequested) {
						this.#closed = false;
						this.#closing = false;
					}
				} catch (cause) {
					if (!this.#terminalCloseRequested) this.#closing = false;
					throw cause;
				}
			}
			#retryOwnedCleanup() {
				if (this.#cleanupRetryAttempt !== undefined) return this.#cleanupRetryAttempt;
				const attempt = Promise.resolve().then(() => this.options.retryCleanup?.()).then(() => {
					if (_a.#pending.has(this)) throw this.#cleanupError("Higher-level cleanup retry returned while ownership remains pending");
				});
				this.#cleanupRetryAttempt = attempt;
				void attempt.finally(() => {
					if (this.#cleanupRetryAttempt === attempt) this.#cleanupRetryAttempt = undefined;
				}).catch(() => undefined);
				return attempt;
			}
			async #start(spawnOptions, initialize) {
				await _a.retryPending(this);
				if (this.#closing) throw new Error("Owned worker runtime is closing");
				this.#root ??= await PrivateRuntimeRoot.create({ prefix: this.options.rootPrefix });
				this.#cleanupEpoch ??= new OwnedWorkerRuntimeCleanupEpoch(this.#root.path);
				if (this.#closing) throw new Error("Owned worker runtime is closing");
				this.#lastRunId = spawnOptions.runId;
				const spawned = await (this.options.launcher ?? spawnOwnedProviderProcess)({
					...spawnOptions,
					cwd: this.#root.path
				});
				this.#inputFailure = undefined;
				this.#observeStdin(spawned.process.stdin);
				this.#processId = spawned.process.pid ?? null;
				this.#cleanupEpoch.setRunId(spawned.ownership?.runId ?? spawnOptions.runId);
				this.#supervisor = new ProviderProcessSupervisor({
					...spawned,
					ownsProcessLifetime: true,
					cleanup: spawned.cleanup ?? (() => cleanupOwnedProcessGroup(spawned.ownership))
				}, this.options.supervisorOptions);
				if (this.#closing) throw new Error("Owned worker runtime is closing");
				await initialize?.(this.#supervisor);
				if (this.#closing) throw new Error("Owned worker runtime is closing");
			}
			async #stop() {
				const acquisition = this.#acquisition;
				if (acquisition !== undefined) await acquisition.catch(() => undefined);
				const supervisor = this.#supervisor;
				if (supervisor === undefined) return { status: "already-exited" };
				this.#detachStdout();
				const stopped = await supervisor.stop();
				if (stopped.status === "incomplete") {
					_a.#pending.add(this);
					const stdin = supervisor.launch.process.stdin;
					if (stdin !== undefined && stdin !== null && !stdin.destroyed && !stdin.writableEnded) {
						try {
							stdin.end();
						} catch {}
					}
					return stopped;
				}
				supervisor.dispose();
				this.#supervisor = undefined;
				this.#processId = null;
				this.#cleanupEpoch?.setRunId(undefined);
				return stopped;
			}
			async #close() {
				const acquisition = this.#acquisition;
				if (acquisition !== undefined) await acquisition.catch(() => undefined);
				const stopped = await this.stop();
				if (stopped.status === "incomplete") throw this.#cleanupError(stopped.reason);
				if (this.#root !== undefined) {
					try {
						await this.#root.close();
						this.#root = undefined;
						this.#cleanupEpoch?.release();
						this.#cleanupEpoch = undefined;
					} catch (cause) {
						_a.#pending.add(this);
						throw this.#cleanupError(message(cause), cause);
					}
				}
				this.#closed = true;
				_a.#pending.delete(this);
			}
			#detachStdout() {
				for (const { stream, listener } of this.#stdoutListeners) stream.off("data", listener);
				this.#stdoutListeners.clear();
			}
			#observeStdin(stream) {
				if (stream === null || stream === undefined) return;
				const generation = ++this.#stdinGeneration;
				const onError = (cause) => {
					if (generation !== this.#stdinGeneration || this.#inputFailure !== undefined) return;
					this.#inputFailure = cause instanceof Error ? cause : new Error("Owned worker request stream failed", { cause });
					this.options.onInputFailure?.(this.#inputFailure);
				};
				const onClose = () => {
					stream.off("error", onError);
					stream.off("close", onClose);
				};
				stream.on("error", onError);
				stream.once("close", onClose);
			}
			#cleanupError(reason, cause) {
				const resources = this.cleanupResources ?? [];
				return new OwnedWorkerRuntimeCleanupError(resources, this.#supervisor?.launch.process.pid ?? null, reason, this.#cleanupEpoch, cause === undefined ? undefined : { cause });
			}
		};
		_a = OwnedWorkerRuntime;
		releasedCleanupOwner = { cleanupResources: [] };
		message = (cause) => cause instanceof Error ? cause.message : String(cause);
	})))();
}

//#endregion
//#region dist/domain/sourceMapEnvelope.js
var sourceMapMappingsSchema, sourceMapJsonText, isRecord, classifySourceMapSection, classifySourceMapSections, isVersion3Map, materializeSectionPath, compareSectionPaths, inspectSourceMapEnvelope;
function init_sourceMapEnvelope() {
	return (init_sourceMapEnvelope = __esmMin((() => {
		sourceMapMappingsSchema = z.string();
		sourceMapJsonText = (text) => {
			const withoutBom = text.replace(/^\uFEFF/u, "");
			if (!withoutBom.startsWith(")]}'")) return withoutBom;
			const newline = withoutBom.search(/[\r\n]/u);
			return newline === -1 ? "" : withoutBom.slice(newline);
		};
		isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		classifySourceMapSection = (section) => {
			if (!isRecord(section)) return {
				kind: "invalid",
				reason: "Indexed source-map section must be an object."
			};
			if (Object.prototype.hasOwnProperty.call(section, "url")) return typeof section.url === "string" ? {
				kind: "external",
				url: section.url
			} : {
				kind: "invalid",
				reason: "External source-map section URL must be a string."
			};
			if (!isRecord(section.map)) return {
				kind: "invalid",
				reason: "Indexed source-map section requires an embedded map or external URL."
			};
			if (!isVersion3Map(section.map)) return {
				kind: "invalid",
				reason: "Indexed source-map section map is not a version 3 map."
			};
			return {
				kind: "embedded",
				map: section.map
			};
		};
		classifySourceMapSections = (map) => {
			if (!isRecord(map)) return {
				kind: "invalid",
				reason: "Source map must be an object."
			};
			if (!Object.prototype.hasOwnProperty.call(map, "sections")) return { kind: "regular" };
			return Array.isArray(map.sections) ? {
				kind: "indexed",
				sections: map.sections
			} : {
				kind: "invalid",
				reason: "Indexed source-map sections must be an array."
			};
		};
		isVersion3Map = (value) => isRecord(value) && value.version === 3;
		materializeSectionPath = (path) => {
			const result = [];
			for (let current = path; current !== null; current = current.parent) result.push(current.index);
			return result.reverse();
		};
		compareSectionPaths = (left, right) => {
			for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
				const leftIndex = left[index] ?? 0;
				const rightIndex = right[index] ?? 0;
				if (leftIndex !== rightIndex) return leftIndex - rightIndex;
			}
			return left.length - right.length;
		};
		inspectSourceMapEnvelope = (root) => {
			if (!isVersion3Map(root)) return {
				status: "invalid",
				reason: "Source map is not a version 3 map."
			};
			const leaves = [];
			const externalSections = [];
			const invalidSections = [];
			const pending = [{
				map: root,
				path: null
			}];
			while (pending.length > 0) {
				const current = pending.pop();
				if (current === undefined) break;
				const map = current.map;
				const sectionList = classifySourceMapSections(map);
				if (sectionList.kind === "invalid") {
					invalidSections.push({
						path: current.path,
						reason: sectionList.reason
					});
					continue;
				}
				if (sectionList.kind === "indexed") {
					const children = [];
					for (let index = 0; index < sectionList.sections.length; index += 1) {
						const section = sectionList.sections[index];
						const path = {
							parent: current.path,
							index
						};
						const classification = classifySourceMapSection(section);
						if (classification.kind === "external") externalSections.push({
							path,
							url: classification.url
						});
						else if (classification.kind === "invalid") invalidSections.push({
							path,
							reason: classification.reason
						});
						else children.push({
							map: classification.map,
							path
						});
					}
					for (let index = children.length - 1; index >= 0; index -= 1) {
						const child = children[index];
						if (child !== undefined) pending.push(child);
					}
				} else leaves.push({
					section_path: materializeSectionPath(current.path),
					map
				});
			}
			const external = externalSections.map(({ path, url }) => ({
				section_path: materializeSectionPath(path),
				url
			})).sort((left, right) => compareSectionPaths(left.section_path, right.section_path));
			const invalid = invalidSections.map(({ path, reason }) => ({
				section_path: materializeSectionPath(path),
				reason
			})).sort((left, right) => compareSectionPaths(left.section_path, right.section_path));
			const status = invalid.length > 0 ? "malformed" : external.length > 0 ? "unsupported" : "included";
			return {
				status,
				leaves,
				external_sections: external,
				invalid_sections: invalid
			};
		};
	})))();
}

//#endregion
//#region dist/domain/artifactPathSyntax.js
var hasScheme, looksExternal, stripQueryAndFragment, admitsCanonicalPathSyntax, isUrlTrimmed, htmlUrlText, UTF8, UTF8_ENCODER, percentDecodeUrlPath;
function init_artifactPathSyntax() {
	return (init_artifactPathSyntax = __esmMin((() => {
		hasScheme = (value) => /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(value);
		looksExternal = (value) => hasScheme(value) || value.startsWith("//");
		stripQueryAndFragment = (value) => value.split("#", 1)[0]?.split("?", 1)[0] ?? "";
		admitsCanonicalPathSyntax = (value) => !value.includes("\0") && !value.includes("\\") && !/%(?:2e|2f|5c)/iu.test(value);
		isUrlTrimmed = (code) => code <= 32;
		htmlUrlText = (value) => {
			let start = 0;
			let end = value.length;
			while (start < end && isUrlTrimmed(value.charCodeAt(start))) start += 1;
			while (end > start && isUrlTrimmed(value.charCodeAt(end - 1))) end -= 1;
			return value.slice(start, end).replace(/[\t\n\r]/gu, "");
		};
		UTF8 = new TextDecoder("utf-8", {
			fatal: true,
			ignoreBOM: true
		});
		UTF8_ENCODER = new TextEncoder();
		percentDecodeUrlPath = (value) => {
			if (!/%[0-9a-f]{2}/iu.test(value)) return value;
			const bytes = [];
			for (let index = 0; index < value.length;) {
				const escape = value.slice(index, index + 3);
				if (/^%[0-9a-f]{2}$/iu.test(escape)) {
					bytes.push(Number.parseInt(escape.slice(1), 16));
					index += 3;
					continue;
				}
				const character = String.fromCodePoint(value.codePointAt(index) ?? 0);
				bytes.push(...UTF8_ENCODER.encode(character));
				index += character.length;
			}
			try {
				const decoded = UTF8.decode(new Uint8Array(bytes));
				return decoded.includes("\0") ? null : decoded;
			} catch (cause) {
				void cause;
				return null;
			}
		};
	})))();
}

//#endregion
export { OwnedWorkerRuntime, OwnedWorkerRuntimeCleanupError, WorkerFrameSignal, admitsCanonicalPathSyntax, classifySourceMapSection, classifySourceMapSections, decodeJavaScriptModuleUrlPath, hasScheme, htmlUrlText, init_OwnedWorkerRuntime, init_TypeScriptEmittedSourceCandidates, init_WorkerFrameSignal, init_artifactPathSyntax, init_javascriptModuleSpecifier, init_sourceMapEnvelope, inspectSourceMapEnvelope, isRelativeJavaScriptModuleSpecifier, looksExternal, percentDecodeUrlPath, sourceMapJsonText, sourceMapMappingsSchema, stripQueryAndFragment, typescriptEmittedSourceCandidates };