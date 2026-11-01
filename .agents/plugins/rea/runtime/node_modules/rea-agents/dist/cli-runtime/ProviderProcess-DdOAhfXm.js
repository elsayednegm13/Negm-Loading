import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { ProcessOwnershipEvidenceOwner, init_ProcessOwnershipEvidence, init_ProcessOwnershipObservation, prepareProcessOwnershipInspection, systemProcessOwnershipHost } from "./ProcessOwnershipEvidence-DNSlHo8A.js";
import { RuntimeControlUnavailableError, init_RuntimeControlUnavailableError, init_WindowsNativeLoader, requireWindowsNativeAuthority, windowsHandleSchema } from "./WindowsNativeLoader-B88N4705.js";
import { z } from "zod";
import { isUtf8 } from "node:buffer";
import { EventEmitter } from "node:events";
import { spawn } from "node:child_process";
import { PassThrough, Writable } from "node:stream";

//#region dist/windows/WindowsOwnedProcess.js
var launchSchema, pollSchema, limitedPollSchema, NATIVE_CONTROL_NAMES, WindowsNativeControlUnavailableError, quoteWindowsProcessArgument, WindowsOwnedProcess;
function init_WindowsOwnedProcess() {
	return (init_WindowsOwnedProcess = __esmMin((() => {
		init_RuntimeControlUnavailableError();
		init_WindowsNativeLoader();
		launchSchema = z.strictObject({
			pid: z.int().positive().max(4294967295),
			handle: windowsHandleSchema,
			jobAssigned: z.literal(true),
			killOnOwnerClose: z.literal(true)
		});
		pollSchema = z.strictObject({
			stdout: z.instanceof(Buffer),
			stderr: z.instanceof(Buffer),
			stdoutEnded: z.boolean(),
			stderrEnded: z.boolean(),
			exitCode: z.int().nonnegative().max(4294967295).nullable(),
			activeProcesses: z.int().nonnegative()
		});
		limitedPollSchema = pollSchema.extend({
			memoryLimitReached: z.boolean(),
			peakJobMemoryBytes: z.int().nonnegative().max(Number.MAX_SAFE_INTEGER)
		});
		NATIVE_CONTROL_NAMES = {
			"protocol-stdin": "owned protocol stdin",
			"job-memory-limit": "Job Object memory limits"
		};
		WindowsNativeControlUnavailableError = class extends RuntimeControlUnavailableError {
			control;
			code = "windows-native-control-unavailable";
			constructor(control) {
				super(`The bundled Windows native artifact does not support ${NATIVE_CONTROL_NAMES[control]}; use a matching current Windows x64 REA package.`, { remediationAction: "Install the matching current Windows x64 REA package; its native inspection must prove this control. REA does not launch without it, so retrying the unchanged installation will not succeed." });
				this.control = control;
				this.name = "WindowsNativeControlUnavailableError";
			}
		};
		quoteWindowsProcessArgument = (value) => {
			if (value.includes("\0")) throw new TypeError("Windows process argument contains NUL");
			return `"${value.replace(/(\\*)"/gu, "$1$1\\\"").replace(/(\\+)$/u, "$1$1")}"`;
		};
		WindowsOwnedProcess = class extends EventEmitter {
			stdout = new PassThrough();
			stderr = new PassThrough();
			stdin;
			signalCode = null;
			exitCode = null;
			pid;
			#handle;
			#authority;
			#settled;
			#settle;
			#closed = false;
			#releasePending = false;
			#failure;
			#timer;
			#blockedWake;
			#blockedOutput = new Set();
			#unreferenced = false;
			#cleanup;
			#memoryLimitBytes;
			#memoryLimitReached = false;
			#peakJobMemoryBytes;
			#outputIncomplete = false;
			constructor(command, arguments_, cwd, environment, verbatim, options = {}) {
				super();
				const protocolStdin = options.protocolStdin === true;
				this.#memoryLimitBytes = options.memoryLimitBytes;
				this.#authority = options.authority ?? requireWindowsNativeAuthority();
				if (protocolStdin && this.#authority.inspection.protocolStdin !== true) throw new WindowsNativeControlUnavailableError("protocol-stdin");
				if (this.#memoryLimitBytes !== undefined && this.#authority.inspection.jobMemoryLimit !== true) throw new WindowsNativeControlUnavailableError("job-memory-limit");
				const entries = Object.entries(environment).filter((entry) => entry[1] !== undefined).map(([key, value]) => `${key}=${value}`);
				const line = [quoteWindowsProcessArgument(command.replaceAll("/", "\\")), ...arguments_.map((value) => verbatim ? value : quoteWindowsProcessArgument(value))].join(" ");
				let controls = protocolStdin ? [true] : [];
				if (this.#memoryLimitBytes !== undefined) controls = [protocolStdin, this.#memoryLimitBytes];
				const spawned = this.#authority.call("process_spawn", [
					command,
					line,
					cwd ?? "",
					entries,
					...controls
				]);
				const launched = this.#memoryLimitBytes === undefined ? launchSchema.parse(spawned) : launchSchema.extend({ jobMemoryLimitBytes: z.literal(this.#memoryLimitBytes) }).parse(spawned);
				this.pid = launched.pid;
				this.#handle = launched.handle;
				this.stdin = protocolStdin ? new Writable({
					write: (chunk, _encoding, callback) => {
						void this.#writeInput(chunk).then(() => callback(), (cause) => callback(cause instanceof Error ? cause : new Error(String(cause))));
					},
					final: (callback) => {
						try {
							this.#authority.call("process_stdin_close", [this.#handle]);
							callback();
						} catch (cause) {
							callback(cause instanceof Error ? cause : new Error(String(cause)));
						}
					},
					destroy: (cause, callback) => {
						try {
							if (!this.#closed) this.#authority.call("process_stdin_close", [this.#handle]);
							callback(cause);
						} catch (failure) {
							callback(failure instanceof Error ? failure : new Error(String(failure)));
						}
					}
				}) : null;
				this.#settled = new Promise((resolve) => {
					this.#settle = resolve;
				});
				this.#schedule();
			}
			/** Whether the job reported reaching its commit limit; sticky once observed. */
			get memoryLimitReached() {
				return this.#memoryLimitReached;
			}
			/** Latest observed peak job commit; undefined for an unlimited job. */
			get peakJobMemoryBytes() {
				return this.#peakJobMemoryBytes;
			}
			/** True when cleanup destroyed a backpressured stream before all output was observed. */
			get outputIncomplete() {
				return this.#outputIncomplete;
			}
			async #writeInput(chunk) {
				const bytes = z.instanceof(Buffer).parse(chunk);
				const written = z.int().nonnegative().max(Number.MAX_SAFE_INTEGER).parse(await this.#authority.call("process_stdin_write", [this.#handle, bytes]));
				if (written !== bytes.length) throw new Error("Owned Windows input write did not preserve all requested bytes");
			}
			/** Terminate the retained job, never a PID supplied by another caller. */
			kill(signal) {
				if (signal === 0) return !this.#closed && z.number().parse(this.#authority.call("process_alive", [this.#handle])) > 0;
				return this.#closed ? false : z.boolean().parse(this.#authority.call("process_terminate", [this.#handle]));
			}
			/** Terminate and verify that the entire job has settled before releasing it. */
			cleanup() {
				this.#cleanup ??= this.#stop().then((result) => {
					if (!result.cleaned) this.#cleanup = undefined;
					return result;
				});
				return this.#cleanup;
			}
			/** Release event-loop references so unsettled jobs do not prevent host exit. */
			unref() {
				this.#unreferenced = true;
				this.#timer?.unref();
				this.#blockedWake?.unref();
			}
			/** Restore event-loop references when retrying process lifecycle observation. */
			ref() {
				this.#unreferenced = false;
				this.#timer?.ref();
				this.#blockedWake?.ref();
			}
			async #stop() {
				if (this.#closed) return {
					cleaned: true,
					signaled: false
				};
				if (this.#releasePending) {
					try {
						this.#release();
						return {
							cleaned: true,
							signaled: false
						};
					} catch (cause) {
						return {
							cleaned: false,
							reason: cause instanceof Error ? cause.message : String(cause)
						};
					}
				}
				let timer;
				try {
					const signaled = this.kill();
					this.#discardBlockedOutput();
					this.#schedule();
					const settled = await Promise.race([this.#settled.then(() => true), new Promise((resolve) => {
						timer = setTimeout(() => resolve(false), 5e3);
					})]);
					return settled ? {
						cleaned: true,
						signaled
					} : {
						cleaned: false,
						reason: this.#failure ?? "Windows Job Object did not settle within the cleanup deadline"
					};
				} catch (cause) {
					return {
						cleaned: false,
						reason: cause instanceof Error ? cause.message : String(cause)
					};
				} finally {
					if (timer !== undefined) clearTimeout(timer);
				}
			}
			#schedule(delay = 25) {
				if (this.#closed || this.#timer !== undefined || this.#blockedOutput.size > 0) return;
				this.#timer = setTimeout(() => this.#poll(), delay);
				if (this.#unreferenced) this.#timer.unref();
			}
			#scheduleBlockedWake() {
				if (this.#closed || this.#blockedOutput.size === 0 || this.#blockedWake !== undefined) return;
				this.#blockedWake = setTimeout(() => {
					this.#blockedWake = undefined;
					this.#scheduleBlockedWake();
				}, 1e3);
				if (this.#unreferenced) this.#blockedWake.unref();
			}
			#clearBlockedWake() {
				if (this.#blockedWake !== undefined) clearTimeout(this.#blockedWake);
				this.#blockedWake = undefined;
			}
			#unblockOutput(stream) {
				if (stream.destroyed) this.#outputIncomplete = true;
				this.#blockedOutput.delete(stream);
				if (this.#blockedOutput.size === 0) this.#clearBlockedWake();
				this.#schedule(0);
			}
			#discardBlockedOutput() {
				if (this.#blockedOutput.size > 0) this.#outputIncomplete = true;
				for (const stream of this.#blockedOutput) stream.destroy();
				this.#blockedOutput.clear();
				this.#clearBlockedWake();
			}
			#poll() {
				this.#timer = undefined;
				if (this.#closed) return;
				if (this.#releasePending) {
					try {
						this.#release();
					} catch (cause) {
						const failure = cause instanceof Error ? cause : new Error(String(cause));
						this.#failure = failure.message;
						if (this.listenerCount("error") > 0) this.emit("error", failure);
					}
					return;
				}
				try {
					const observed = this.#authority.call("process_poll", [this.#handle]);
					let state;
					if (this.#memoryLimitBytes === undefined) state = pollSchema.parse(observed);
					else {
						const limited = limitedPollSchema.parse(observed);
						this.#memoryLimitReached ||= limited.memoryLimitReached;
						this.#peakJobMemoryBytes = limited.peakJobMemoryBytes;
						state = limited;
					}
					this.#failure = undefined;
					const idle = state.stdout.length === 0 && state.stderr.length === 0;
					this.#writeOutput(this.stdout, state.stdout);
					this.#writeOutput(this.stderr, state.stderr);
					if (state.exitCode !== null && this.exitCode === null) {
						this.exitCode = state.exitCode;
						this.emit("exit", state.exitCode, null);
					}
					if (state.exitCode !== null && state.stdoutEnded && state.stderrEnded && state.activeProcesses === 0) {
						this.#release();
					} else this.#schedule(idle ? 25 : 0);
				} catch (cause) {
					const failure = cause instanceof Error ? cause : new Error(String(cause));
					this.#failure = failure.message;
					if (this.listenerCount("error") > 0) this.emit("error", failure);
				}
			}
			#writeOutput(stream, bytes) {
				if (bytes.length === 0 || stream.writableEnded) return;
				if (stream.destroyed) {
					this.#outputIncomplete = true;
					return;
				}
				if (stream.write(bytes)) return;
				this.#blockedOutput.add(stream);
				const unblock = () => {
					stream.off("drain", unblock);
					stream.off("close", unblock);
					this.#unblockOutput(stream);
				};
				stream.once("drain", unblock);
				stream.once("close", unblock);
				this.#scheduleBlockedWake();
			}
			#release() {
				if (this.#closed) return;
				if (!this.#releasePending) {
					if (this.#timer !== undefined) clearTimeout(this.#timer);
					this.#timer = undefined;
					this.#clearBlockedWake();
					this.stdin?.destroy();
					if (!this.stdout.destroyed) this.stdout.end();
					if (!this.stderr.destroyed) this.stderr.end();
					this.#releasePending = true;
				}
				this.#authority.call("process_close", [this.#handle]);
				this.#releasePending = false;
				this.#closed = true;
				this.#settle?.();
				this.emit("close", this.exitCode, null);
			}
		};
	})))();
}

//#endregion
//#region dist/process/ProcessOutputTokenScanner.js
var PROCESS_OUTPUT_TOKEN_CONTEXT_BYTES, NEWLINE, isWordByte, ProcessOutputTokenScanner;
function init_ProcessOutputTokenScanner() {
	return (init_ProcessOutputTokenScanner = __esmMin((() => {
		PROCESS_OUTPUT_TOKEN_CONTEXT_BYTES = 1024;
		NEWLINE = 10;
		isWordByte = (byte) => byte >= 48 && byte <= 57 || byte >= 65 && byte <= 90 || byte >= 97 && byte <= 122 || byte === 95;
		ProcessOutputTokenScanner = class {
			#marker;
			#lineTail = Buffer.alloc(0);
			#lineTailCut = false;
			#latest;
			#pending;
			constructor(marker) {
				if (marker.length === 0 || marker.includes("\n")) throw new RangeError("Output token must be non-empty single-line text");
				this.#marker = Buffer.from(marker, "utf8");
				if (!isWordByte(this.#marker[this.#marker.length - 1])) throw new RangeError("Output token must end in an ASCII word byte");
			}
			scan(chunk, start) {
				if (chunk.length === 0) return;
				if (this.#pending !== undefined) {
					if (!isWordByte(chunk[0])) this.#latest = this.#pending;
					this.#pending = undefined;
				}
				this.#extendOpenLine(chunk);
				const carried = this.#lineTail.byteLength;
				const searched = carried === 0 ? chunk : Buffer.concat([this.#lineTail, chunk]);
				let index = searched.lastIndexOf(this.#marker);
				while (index >= 0 && index + this.#marker.byteLength > carried) {
					const end = index + this.#marker.byteLength;
					if (end === searched.length) this.#pending = this.#record(searched, index, start - carried);
					else if (!isWordByte(searched[end])) {
						this.#latest = this.#record(searched, index, start - carried);
						break;
					}
					index = index === 0 ? -1 : searched.lastIndexOf(this.#marker, index - 1);
				}
				this.#retainLineTail(searched);
			}
			/** Only a true stream end proves the boundary of a trailing bare token. */
			finish() {
				if (this.#pending !== undefined) this.#latest = this.#pending;
				this.#pending = undefined;
				if (this.#latest !== undefined) this.#latest.open = false;
			}
			latestWithin(start, end) {
				const latest = this.#latest;
				if (latest === undefined || latest.offset < start || latest.offset >= end) return undefined;
				const prefixInRange = latest.offset - latest.prefix.length >= start;
				const bytes = Buffer.concat([...prefixInRange ? [latest.prefix] : [], latest.suffix]);
				return {
					offset: latest.offset,
					line: bytes.toString("utf8"),
					...!isUtf8(bytes) ? { invalidUtf8: true } : {},
					truncated: latest.prefixCut || latest.suffixCut || !prefixInRange,
					...latest.suffixCut || latest.open ? { trailingContextIncomplete: true } : {}
				};
			}
			#record(searched, index, searchedStart) {
				const lineStart = index === 0 ? 0 : searched.lastIndexOf(NEWLINE, index - 1) + 1;
				const prefixFits = index - lineStart <= 1024 && (lineStart > 0 || !this.#lineTailCut);
				const lineEnd = searched.indexOf(NEWLINE, index);
				const available = lineEnd < 0 ? searched.byteLength : lineEnd;
				const suffixEnd = Math.min(available, index + this.#marker.byteLength + PROCESS_OUTPUT_TOKEN_CONTEXT_BYTES);
				return {
					offset: searchedStart + index,
					prefix: prefixFits ? Buffer.from(searched.subarray(lineStart, index)) : Buffer.alloc(0),
					prefixCut: !prefixFits,
					suffix: Buffer.from(searched.subarray(index, suffixEnd)),
					open: lineEnd < 0 && suffixEnd === available,
					suffixCut: suffixEnd < available
				};
			}
			#extendOpenLine(chunk) {
				const latest = this.#latest;
				if (latest?.open !== true) return;
				const lineEnd = chunk.indexOf(NEWLINE);
				const available = lineEnd < 0 ? chunk.byteLength : lineEnd;
				const room = this.#marker.byteLength + PROCESS_OUTPUT_TOKEN_CONTEXT_BYTES - latest.suffix.byteLength;
				const taken = Math.min(available, Math.max(0, room));
				if (taken > 0) latest.suffix = Buffer.concat([latest.suffix, chunk.subarray(0, taken)]);
				latest.suffixCut = taken < available;
				latest.open = lineEnd < 0 && taken === available;
			}
			#retainLineTail(searched) {
				const lineStart = searched.lastIndexOf(NEWLINE) + 1;
				const limit = PROCESS_OUTPUT_TOKEN_CONTEXT_BYTES + this.#marker.byteLength - 1;
				this.#lineTailCut = searched.byteLength - lineStart > limit || lineStart === 0 && this.#lineTailCut;
				this.#lineTail = Buffer.from(searched.subarray(Math.max(lineStart, searched.byteLength - limit)));
			}
		};
	})))();
}

//#endregion
//#region dist/process/ProviderProcess.js
var DEFAULT_TERMINATION_GRACE_MS, DEFAULT_KILL_GRACE_MS, OUTPUT_CLOSE_GRACE_MS, MAX_LATE_OUTPUT_BYTES, outputCheckpoints, incompleteCleanup, spawnOwnedProviderProcess, ProviderProcessSupervisor, ProcessOutputCapture, deferred, waitForSpawn, waitForProcessEvent;
function init_ProviderProcess() {
	return (init_ProviderProcess = __esmMin((() => {
		init_WindowsOwnedProcess();
		init_ProcessOutputTokenScanner();
		init_ProcessOwnershipObservation();
		init_ProcessOwnershipEvidence();
		DEFAULT_TERMINATION_GRACE_MS = 250;
		DEFAULT_KILL_GRACE_MS = 1e3;
		OUTPUT_CLOSE_GRACE_MS = 1e3;
		MAX_LATE_OUTPUT_BYTES = 64 * 1024;
		outputCheckpoints = new WeakMap();
		incompleteCleanup = (failure) => ({
			status: "incomplete",
			reason: failure.reason,
			cleanupResult: failure
		});
		spawnOwnedProviderProcess = async (options) => {
			options.signal?.throwIfAborted();
			await prepareProcessOwnershipInspection(options.signal);
			options.signal?.throwIfAborted();
			const platform = options.platform ?? process.platform;
			const sweepTokenOwnedProcesses = options.sweepTokenOwnedProcesses === true && platform !== "win32";
			let captureBaseline;
			if (sweepTokenOwnedProcesses) {
				const capture = systemProcessOwnershipHost.captureBaseline;
				if (capture === undefined) throw new Error("Process ownership baseline is unavailable on this host");
				captureBaseline = await capture(options.signal);
				options.signal?.throwIfAborted();
			}
			const hostEnvironment = options.hostEnvironment ?? process.env;
			const environment = {
				...hostEnvironment,
				...options.env,
				REA_PROCESS_RUN_ID: options.runId
			};
			if (platform === "win32" && process.platform === "win32") {
				const child = new WindowsOwnedProcess(options.command, options.arguments, options.cwd, environment, options.windowsVerbatimArguments ?? false, {
					protocolStdin: options.stdin === "pipe",
					...options.memoryLimitBytes === undefined ? {} : { memoryLimitBytes: options.memoryLimitBytes }
				});
				return {
					process: child,
					ownership: {
						runId: options.runId,
						leaderPid: child.pid,
						processGroupId: child.pid,
						expectedParentPid: process.pid
					},
					cleanup: () => child.cleanup()
				};
			}
			if (options.memoryLimitBytes !== undefined) throw new Error("Owned process memory limits require the Windows Job Object launcher; no limit can be enforced on this host.");
			const child = spawn(options.command, [...options.arguments], {
				shell: false,
				windowsHide: true,
				stdio: [
					options.stdin ?? "ignore",
					"pipe",
					"pipe"
				],
				detached: platform !== "win32",
				windowsVerbatimArguments: options.windowsVerbatimArguments ?? false,
				env: environment,
				...options.cwd === undefined ? {} : { cwd: options.cwd }
			});
			await waitForSpawn(child);
			const pid = child.pid;
			if (pid === undefined) throw new Error("Provider launcher has no process ID");
			const ownership = {
				runId: options.runId,
				leaderPid: pid,
				processGroupId: pid,
				expectedParentPid: process.pid,
				evidenceOwner: new ProcessOwnershipEvidenceOwner(),
				...sweepTokenOwnedProcesses ? {
					sweepTokenOwnedProcesses: true,
					captureBaseline
				} : {},
				...options.expectedCommand === null ? {} : { expectedCommand: options.expectedCommand ?? options.command }
			};
			return {
				process: child,
				ownership
			};
		};
		ProviderProcessSupervisor = class {
			launch;
			#options;
			#stdout = new ProcessOutputCapture();
			#stderr = new ProcessOutputCapture();
			#exit = deferred();
			#outputClose = deferred();
			#outputClosed = false;
			#outputIncomplete = false;
			#stdoutObservedBytes = 0;
			#stderrObservedBytes = 0;
			#diagnosticTruncated = false;
			#stdoutMarker;
			#stderrMarker;
			#onStdout = (chunk) => {
				this.#capture("stdout", this.#stdout, chunk);
			};
			#onStderr = (chunk) => {
				this.#capture("stderr", this.#stderr, chunk);
			};
			#onStdoutEnd = () => {
				this.#stdoutMarker?.finish();
			};
			#onStderrEnd = () => {
				this.#stderrMarker?.finish();
			};
			#onStdoutError = (cause) => {
				this.#recordStreamError("stdout", cause);
			};
			#onStderrError = (cause) => {
				this.#recordStreamError("stderr", cause);
			};
			#onExit = (code, signal) => {
				this.#recordExit(code, signal);
			};
			#onClose = (code, signal) => {
				this.#recordExit(code, signal);
				this.#outputClosed = true;
				if (!this.#disposed) this.#options.onDiagnostic?.({
					type: "output-close",
					snapshot: this.snapshot()
				});
				this.#outputClose.resolve(undefined);
			};
			#onError = (cause) => {
				this.#options.onDiagnostic?.({
					type: "error",
					message: cause.message,
					cause
				});
			};
			#exitObservation;
			#stopPromise;
			#stopRequested = false;
			#disposed = false;
			#maxAggregateDiagnosticBytes;
			#maxStreamDiagnosticBytes;
			#outputEpoch = 0;
			constructor(launch, options = {}) {
				this.launch = launch;
				this.#options = options;
				const budget = options.maxDiagnosticBytes;
				if (typeof budget === "number") this.#maxAggregateDiagnosticBytes = budget;
				else if (budget !== undefined) this.#maxStreamDiagnosticBytes = {
					stdout: budget.stdout,
					stderr: budget.stderr
				};
				this.#resetMarkers();
				if (options.captureStdout !== false) this.#attach(launch.process.stdout, "stdout");
				this.#attach(launch.process.stderr, "stderr");
				launch.process.once("exit", this.#onExit);
				launch.process.once("close", this.#onClose);
				launch.process.on("error", this.#onError);
				if (launch.process.exitCode !== null || launch.process.signalCode !== null) this.#recordExit(launch.process.exitCode, launch.process.signalCode);
			}
			/**
			* Recorded process exit without concatenating retained stream diagnostics.
			* Undefined until exit or close is observed.
			*/
			observedExit() {
				const exit = this.#exitObservation;
				if (exit === undefined) return undefined;
				return {
					code: exit.code,
					signal: exit.signal
				};
			}
			/** Whether the process owner acknowledged output closure, separately from exit. */
			observedOutputClose() {
				return this.#outputClosed;
			}
			/** Latest retained output and exit observation, with explicit configured truncation. */
			snapshot() {
				const outputIncomplete = this.#outputIncomplete || this.launch.process.outputIncomplete === true;
				return {
					...this.#diagnosticTruncated || outputIncomplete ? { diagnosticTruncated: true } : {},
					stdout: this.#stdout.snapshot(this.#stdoutObservedBytes),
					stderr: this.#stderr.snapshot(this.#stderrObservedBytes),
					exitCode: this.#exitObservation?.code,
					signal: this.#exitObservation?.signal,
					...this.launch.process.memoryLimitReached === true ? { memoryLimitReached: true } : {},
					...this.#stopRequested ? { stopRequested: true } : {},
					...outputIncomplete ? { outputIncomplete: true } : {}
				};
			}
			/** Mark the current raw-byte position without copying or retaining output. */
			checkpointOutput() {
				const checkpoint = Object.freeze({});
				outputCheckpoints.set(checkpoint, {
					owner: this,
					epoch: this.#outputEpoch,
					stdout: this.#stdoutObservedBytes,
					stderr: this.#stderrObservedBytes
				});
				return checkpoint;
			}
			/** Snapshot only bytes produced after a valid checkpoint on this supervisor. */
			snapshotOutputSince(checkpoint) {
				const position = typeof checkpoint === "object" && checkpoint !== null ? outputCheckpoints.get(checkpoint) : undefined;
				if (position === undefined || position.owner !== this || position.epoch !== this.#outputEpoch) return {
					snapshot: {
						stdout: {
							text: "",
							bytes: 0,
							observedBytes: 0
						},
						stderr: {
							text: "",
							bytes: 0,
							observedBytes: 0
						},
						exitCode: this.#exitObservation?.code,
						signal: this.#exitObservation?.signal,
						outputIncomplete: true,
						diagnosticTruncated: true
					},
					complete: false
				};
				const stdout = this.#stdout.snapshotRange(position.stdout, this.#stdoutObservedBytes);
				const stderr = this.#stderr.snapshotRange(position.stderr, this.#stderrObservedBytes);
				const incomplete = stdout.complete === false || stderr.complete === false || this.#outputIncomplete || this.launch.process.outputIncomplete === true;
				return {
					snapshot: {
						...incomplete ? { diagnosticTruncated: true } : {},
						stdout: stdout.stream,
						stderr: stderr.stream,
						exitCode: this.#exitObservation?.code,
						signal: this.#exitObservation?.signal,
						...this.launch.process.memoryLimitReached === true ? { memoryLimitReached: true } : {},
						...incomplete ? { outputIncomplete: true } : {}
					},
					complete: !incomplete,
					...this.#markersWithin(position)
				};
			}
			#markersWithin(position) {
				const stdout = this.#stdoutMarker?.latestWithin(position.stdout, this.#stdoutObservedBytes);
				const stderr = this.#stderrMarker?.latestWithin(position.stderr, this.#stderrObservedBytes);
				const markers = [...stdout === undefined ? [] : [{
					stream: "stdout",
					...stdout
				}], ...stderr === undefined ? [] : [{
					stream: "stderr",
					...stderr
				}]];
				return markers.length === 0 ? {} : { markers };
			}
			#resetMarkers() {
				const marker = this.#options.outputToken;
				this.#stdoutMarker = marker === undefined ? undefined : new ProcessOutputTokenScanner(marker);
				this.#stderrMarker = marker === undefined ? undefined : new ProcessOutputTokenScanner(marker);
			}
			/** Begin a new observation on a retained process without retaining earlier output. */
			resetOutput() {
				this.#outputEpoch += 1;
				this.#stdout.reset();
				this.#stderr.reset();
				this.#stdoutObservedBytes = 0;
				this.#stderrObservedBytes = 0;
				this.#diagnosticTruncated = false;
				this.#resetMarkers();
			}
			/** Wait for process exit up to a caller-owned bounded interval. */
			async waitForExit(timeoutMs) {
				return waitForProcessEvent(this.#exitObservation !== undefined, this.#exit.promise, timeoutMs);
			}
			/** Wait until output streams close; omit the timeout to await physical completion.
			* WindowsOwnedProcess closes only after its whole Job Object settles.
			*/
			async waitForOutputClose(timeoutMs, signal) {
				return waitForProcessEvent(this.#outputClosed, this.#outputClose.promise, timeoutMs, signal);
			}
			/** Bound additional retained bytes while still draining all later output. */
			limitAdditionalOutputBytes(maxBytes) {
				if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) throw new RangeError("Additional output limit must be a non-negative safe integer.");
				const retained = this.#stdout.bytes + this.#stderr.bytes;
				const requestedLimit = Math.min(Number.MAX_SAFE_INTEGER, retained + maxBytes);
				this.#maxAggregateDiagnosticBytes = this.#maxAggregateDiagnosticBytes === undefined ? requestedLimit : Math.min(this.#maxAggregateDiagnosticBytes, requestedLimit);
			}
			/** Unreference inherited output pipes without closing streams shared with descendants. */
			unrefOutputStreams() {
				for (const stream of [this.launch.process.stdout, this.launch.process.stderr]) {
					const unref = stream?.unref;
					unref?.call(stream);
				}
			}
			/** Share each stop attempt; incomplete cleanup retains ownership and permits retry. */
			stop(options = {}) {
				this.#stopRequested = true;
				this.#stopPromise ??= this.#stop(options).then((result) => {
					if (result.status === "incomplete") this.#stopPromise = undefined;
					return result;
				});
				return this.#stopPromise;
			}
			/** Detach capture and process listeners after an adapter releases ownership. */
			dispose() {
				if (this.#disposed) return;
				if (!this.#outputClosed) this.#outputIncomplete = true;
				this.#disposed = true;
				this.launch.process.stdout?.off("data", this.#onStdout);
				this.launch.process.stdout?.off("error", this.#onStdoutError);
				this.launch.process.stdout?.off("end", this.#onStdoutEnd);
				this.launch.process.stderr?.off("data", this.#onStderr);
				this.launch.process.stderr?.off("error", this.#onStderrError);
				this.launch.process.stderr?.off("end", this.#onStderrEnd);
				this.launch.process.off("exit", this.#onExit);
				this.launch.process.off("close", this.#onClose);
				this.launch.process.off("error", this.#onError);
			}
			/** Release event-loop references so incomplete cleanup does not prevent host exit. */
			unref() {
				const process = this.launch.process;
				process.unref?.();
				process.stdin?.unref?.();
				process.stdout?.unref?.();
				process.stderr?.unref?.();
			}
			/** Restore event-loop references when retrying supervised process cleanup. */
			ref() {
				const process = this.launch.process;
				process.ref?.();
				process.stdin?.ref?.();
				process.stdout?.ref?.();
				process.stderr?.ref?.();
			}
			async #stop(options) {
				if (this.launch.ownsProcessLifetime) {
					this.ref();
					this.limitAdditionalOutputBytes(MAX_LATE_OUTPUT_BYTES);
				}
				let completed = false;
				try {
					const result = await this.#stopWithin(options);
					completed = result.status !== "incomplete";
					if (completed && result.status !== "not-owned" && !this.#outputClosed) {
						if (!await this.waitForOutputClose(OUTPUT_CLOSE_GRACE_MS)) {
							this.#outputIncomplete = true;
							this.unref();
						}
					}
					if (!completed) this.unref();
					return result;
				} finally {
					if (completed) this.dispose();
				}
			}
			async #stopWithin(options) {
				try {
					if (!this.launch.ownsProcessLifetime) return { status: "not-owned" };
					if (this.launch.cleanup !== undefined) {
						const graceMs = options.killGraceMs ?? DEFAULT_KILL_GRACE_MS;
						const exitObservedBeforeCleanup = this.#exitObservation !== undefined;
						const cleanup = await this.#ownedCleanup(options.cleanupResult);
						if (!cleanup.cleaned) {
							if (exitObservedBeforeCleanup || !await this.waitForExit(graceMs)) return incompleteCleanup(cleanup);
							const settled = await this.launch.cleanup();
							return settled.cleaned ? { status: "verified-cleanup" } : incompleteCleanup(settled);
						}
						if (await this.waitForExit(graceMs)) return { status: "verified-cleanup" };
						const retried = await this.launch.cleanup();
						if (!retried.cleaned) return incompleteCleanup(retried);
						if (await this.waitForExit(graceMs)) return { status: "verified-cleanup" };
						return {
							status: "incomplete",
							reason: "verified process-group cleanup did not stop the launcher"
						};
					}
					if (this.#exitObservation !== undefined) return { status: "already-exited" };
					this.#signal("SIGTERM");
					if (await this.waitForExit(options.terminationGraceMs ?? DEFAULT_TERMINATION_GRACE_MS)) return { status: "terminated" };
					this.#signal("SIGKILL");
					if (await this.waitForExit(options.killGraceMs ?? DEFAULT_KILL_GRACE_MS)) return { status: "killed" };
					return {
						status: "incomplete",
						reason: "owned provider process did not exit after SIGKILL"
					};
				} catch (cause) {
					return {
						status: "incomplete",
						reason: cause instanceof Error ? cause.message : "owned provider process cleanup failed"
					};
				}
			}
			#ownedCleanup(supplied) {
				if (supplied !== undefined) return Promise.resolve(supplied);
				const cleanup = this.launch.cleanup;
				return cleanup === undefined ? Promise.resolve({
					cleaned: false,
					reason: "owned provider process has no cleanup capability"
				}) : cleanup();
			}
			#signal(signal) {
				if (this.#exitObservation !== undefined) return;
				this.launch.process.kill(signal);
			}
			#attach(stream, name) {
				if (name === "stdout") {
					stream?.on("data", this.#onStdout);
					stream?.on("error", this.#onStdoutError);
					stream?.on("end", this.#onStdoutEnd);
				} else {
					stream?.on("data", this.#onStderr);
					stream?.on("error", this.#onStderrError);
					stream?.on("end", this.#onStderrEnd);
				}
			}
			#recordStreamError(stream, cause) {
				this.#outputIncomplete = true;
				this.#options.onDiagnostic?.({
					type: "error",
					message: `${stream} stream failed: ${cause.message}`,
					cause
				});
			}
			#capture(stream, capture, chunk) {
				const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
				if (stream === "stdout") {
					this.#stdoutMarker?.scan(bytes, this.#stdoutObservedBytes);
					this.#stdoutObservedBytes += bytes.byteLength;
				} else {
					this.#stderrMarker?.scan(bytes, this.#stderrObservedBytes);
					this.#stderrObservedBytes += bytes.byteLength;
				}
				const aggregateRemaining = this.#maxAggregateDiagnosticBytes === undefined ? bytes.byteLength : Math.max(0, this.#maxAggregateDiagnosticBytes - this.#stdout.bytes - this.#stderr.bytes);
				const streamLimit = this.#maxStreamDiagnosticBytes?.[stream];
				const streamRemaining = streamLimit === undefined ? bytes.byteLength : Math.max(0, streamLimit - capture.bytes);
				const retained = Math.min(bytes.byteLength, aggregateRemaining, streamRemaining);
				if (retained < bytes.byteLength) this.#diagnosticTruncated = true;
				if (retained > 0) capture.append(bytes.subarray(0, retained));
				this.#options.onDiagnostic?.({
					type: "output",
					stream,
					bytes: bytes.byteLength,
					totalBytes: stream === "stdout" ? this.#stdoutObservedBytes : this.#stderrObservedBytes,
					...retained < bytes.byteLength ? { truncated: true } : {}
				});
			}
			#recordExit(code, signal) {
				if (this.#exitObservation !== undefined) return;
				this.#exitObservation = {
					code,
					signal
				};
				this.#exit.resolve(this.#exitObservation);
				this.#options.onDiagnostic?.({
					type: "exit",
					code,
					signal,
					snapshot: this.snapshot()
				});
			}
		};
		ProcessOutputCapture = class {
			#chunks = [];
			#bytes = 0;
			get bytes() {
				return this.#bytes;
			}
			reset() {
				this.#chunks.length = 0;
				this.#bytes = 0;
			}
			append(chunk) {
				this.#bytes += chunk.byteLength;
				this.#chunks.push(Buffer.from(chunk));
			}
			snapshot(observedBytes) {
				return this.#snapshotBuffer(Buffer.concat(this.#chunks, this.#bytes), observedBytes);
			}
			snapshotRange(start, end) {
				const availableEnd = Math.min(end, this.#bytes);
				const availableStart = Math.min(start, availableEnd);
				const chunks = [];
				let offset = 0;
				for (const chunk of this.#chunks) {
					const chunkEnd = offset + chunk.byteLength;
					const from = Math.max(availableStart, offset);
					const to = Math.min(availableEnd, chunkEnd);
					if (to > from) chunks.push(chunk.subarray(from - offset, to - offset));
					offset = chunkEnd;
					if (offset >= availableEnd) break;
				}
				const buffer = Buffer.concat(chunks, availableEnd - availableStart);
				return {
					stream: this.#snapshotBuffer(buffer, Math.max(0, end - start)),
					complete: start === end || start <= this.#bytes && end <= this.#bytes
				};
			}
			#snapshotBuffer(buffer, observedBytes) {
				const text = buffer.toString("utf8");
				let invalidUtf8 = false;
				try {
					new TextDecoder("utf-8", { fatal: true }).decode(buffer);
				} catch {
					invalidUtf8 = true;
				}
				return {
					text,
					bytes: buffer.byteLength,
					observedBytes,
					...invalidUtf8 ? { invalidUtf8: true } : {}
				};
			}
		};
		deferred = () => {
			let resolver;
			const promise = new Promise((resolve) => {
				resolver = resolve;
			});
			return {
				promise,
				resolve: (value) => {
					resolver?.(value);
				}
			};
		};
		waitForSpawn = (child) => new Promise((resolve, reject) => {
			const onSpawn = () => {
				child.off("error", onError);
				resolve();
			};
			const onError = (cause) => {
				child.off("spawn", onSpawn);
				reject(cause);
			};
			child.once("spawn", onSpawn);
			child.once("error", onError);
		});
		waitForProcessEvent = async (observed, event, timeoutMs, signal) => {
			if (observed) return true;
			if (signal?.aborted === true) return false;
			let timer;
			let onAbort;
			try {
				return await Promise.race([event.then(() => true), new Promise((resolve) => {
					if (timeoutMs !== undefined) timer = setTimeout(() => resolve(false), Math.max(0, timeoutMs));
					if (signal !== undefined) {
						onAbort = () => resolve(false);
						signal.addEventListener("abort", onAbort, { once: true });
					}
				})]);
			} finally {
				if (timer !== undefined) clearTimeout(timer);
				if (onAbort !== undefined) signal?.removeEventListener("abort", onAbort);
			}
		};
	})))();
}

//#endregion
export { ProviderProcessSupervisor, init_ProviderProcess, spawnOwnedProviderProcess };