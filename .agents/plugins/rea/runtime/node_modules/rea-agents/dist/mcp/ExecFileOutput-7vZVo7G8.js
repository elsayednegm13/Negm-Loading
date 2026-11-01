import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { d as MAX_PROVIDER_STARTUP_TIMEOUT_MS, f as init_analysisResourceLimits, u as MAX_GHIDRA_DECOMPILE_TIMEOUT_SECONDS } from "./analysisResourceLimits-21fD6Kv8.js";
import { z } from "zod";
import { execFile } from "node:child_process";

//#region dist/config/providerStartupTimeout.js
var DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS, ghidraDecompileTimeoutSchema, providerStartupTimeoutSchema;
function init_providerStartupTimeout() {
	return (init_providerStartupTimeout = __esmMin((() => {
		init_analysisResourceLimits();
		DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS = 12e4;
		ghidraDecompileTimeoutSchema = z.string().regex(/^[1-9]\d*$/u, "must be a positive decimal integer").transform(Number).pipe(z.number().int().min(1).max(MAX_GHIDRA_DECOMPILE_TIMEOUT_SECONDS));
		providerStartupTimeoutSchema = z.string().regex(/^[1-9]\d*$/u, "must be a positive decimal integer").transform(Number).pipe(z.int().min(1).max(MAX_PROVIDER_STARTUP_TIMEOUT_MS));
	})))();
}

//#endregion
//#region dist/process/ExecFileOutput.js
var STOP_GRACE_MS, ExecFileOutputCancelledError, timeoutError, invalidTimeout, execFileOutputFailure, execFileFailureCapturedOutput, execFileBytes, execFileOutput;
function init_ExecFileOutput() {
	return (init_ExecFileOutput = __esmMin((() => {
		STOP_GRACE_MS = 5e3;
		ExecFileOutputCancelledError = class extends Error {
			_tag = "ExecFileOutputCancelledError";
			code = "ABORT_ERR";
			constructor(reason) {
				super("The operation was aborted", { cause: reason });
				this.name = "AbortError";
			}
		};
		timeoutError = (command, timeout, exit) => {
			const error = new Error(`Command timed out after ${String(timeout)} ms: ${command}`, exit === null ? undefined : { cause: exit });
			Reflect.set(error, "code", "ETIMEDOUT");
			Reflect.set(error, "killed", true);
			Reflect.set(error, "signal", exit === null ? null : Reflect.get(exit, "signal") ?? null);
			return error;
		};
		invalidTimeout = (timeout) => {
			if (Number.isSafeInteger(timeout) && timeout >= 0) return undefined;
			const error = new RangeError(`The value of "timeout" is out of range. It must be an unsigned integer. Received ${String(timeout)}`);
			Reflect.set(error, "code", "ERR_OUT_OF_RANGE");
			return error;
		};
		execFileOutputFailure = (cause) => {
			if (!(cause instanceof Error)) return undefined;
			const stdout = Reflect.get(cause, "stdout");
			const stderr = Reflect.get(cause, "stderr");
			const code = Reflect.get(cause, "code");
			const signal = Reflect.get(cause, "signal");
			const killed = Reflect.get(cause, "killed");
			const outputTruncated = Reflect.get(cause, "outputTruncated");
			const stdoutBytes = Reflect.get(cause, "stdoutBytes");
			const stderrBytes = Reflect.get(cause, "stderrBytes");
			const collectionFailure = Reflect.get(cause, "collectionFailure");
			if (typeof stdout !== "string" || typeof stderr !== "string") return undefined;
			return {
				stdout,
				stderr,
				...typeof stdoutBytes === "number" && Number.isSafeInteger(stdoutBytes) && stdoutBytes >= 0 ? { stdoutBytes } : {},
				...typeof stderrBytes === "number" && Number.isSafeInteger(stderrBytes) && stderrBytes >= 0 ? { stderrBytes } : {},
				code: typeof code === "string" || typeof code === "number" ? code : null,
				signal: typeof signal === "string" ? signal : null,
				killed: killed === true,
				outputTruncated: outputTruncated === true || code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER",
				...collectionFailure === true ? { collectionFailure: true } : {}
			};
		};
		execFileFailureCapturedOutput = (failure) => ({
			stdout: failure.stdout,
			stderr: failure.stderr,
			...failure.stdoutBytes === undefined ? {} : { stdout_bytes: failure.stdoutBytes },
			...failure.stderrBytes === undefined ? {} : { stderr_bytes: failure.stderrBytes },
			exit_code: typeof failure.code === "number" ? failure.code : null,
			signal: failure.signal,
			truncated: failure.outputTruncated
		});
		execFileBytes = (command, arguments_, options = {}) => new Promise((resolve, reject) => {
			const { stopSignal, signal, timeout, ...execOptions } = options;
			const invalid = timeout === undefined ? undefined : invalidTimeout(timeout);
			if (invalid !== undefined) {
				reject(invalid);
				return;
			}
			if (stopSignal !== undefined && signal?.aborted === true) {
				reject(new ExecFileOutputCancelledError(signal.reason));
				return;
			}
			let stopped;
			let deadline;
			let grace;
			const child = execFile(command, [...arguments_], {
				...execOptions,
				...stopSignal === undefined ? {
					...signal === undefined ? {} : { signal },
					...timeout === undefined ? {} : { timeout }
				} : { killSignal: stopSignal },
				encoding: "buffer",
				maxBuffer: options.maxBuffer ?? Number.POSITIVE_INFINITY
			}, (error, stdout, stderr) => {
				signal?.removeEventListener("abort", onAbort);
				clearTimeout(deadline);
				clearTimeout(grace);
				const failure = stopped === "abort" && signal !== undefined ? new ExecFileOutputCancelledError(signal.reason) : stopped === "timeout" && timeout !== undefined ? timeoutError(command, timeout, error) : error?.name === "AbortError" && error.code === "ABORT_ERR" ? new ExecFileOutputCancelledError(error.cause) : error;
				if (failure !== null) {
					Reflect.set(failure, "stdout", stdout.toString("utf8"));
					Reflect.set(failure, "stderr", stderr.toString("utf8"));
					Reflect.set(failure, "stdoutBytes", stdout.byteLength);
					Reflect.set(failure, "stderrBytes", stderr.byteLength);
					reject(failure);
					return;
				}
				resolve({
					stdout,
					stderr
				});
			});
			const stop = (reason) => {
				if (stopped !== undefined) return;
				stopped = reason;
				child.kill(stopSignal);
				grace = setTimeout(() => child.kill("SIGKILL"), STOP_GRACE_MS);
			};
			const onAbort = () => {
				stop("abort");
			};
			if (stopSignal === undefined) return;
			signal?.addEventListener("abort", onAbort, { once: true });
			if (timeout !== undefined && timeout > 0) deadline = setTimeout(() => {
				stop("timeout");
			}, timeout);
		});
		execFileOutput = (command, arguments_, options = {}) => execFileBytes(command, arguments_, options).then(({ stdout, stderr }) => ({
			stdout: stdout.toString("utf8"),
			stderr: stderr.toString("utf8"),
			stdoutBytes: stdout.byteLength,
			stderrBytes: stderr.byteLength
		}));
	})))();
}

//#endregion
export { execFileOutputFailure as a, ghidraDecompileTimeoutSchema as c, execFileOutput as i, init_providerStartupTimeout as l, execFileBytes as n, init_ExecFileOutput as o, execFileFailureCapturedOutput as r, DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS as s, ExecFileOutputCancelledError as t, providerStartupTimeoutSchema as u };