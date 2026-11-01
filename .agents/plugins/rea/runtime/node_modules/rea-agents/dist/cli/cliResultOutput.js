import { constants } from "node:buffer";
import { Filter } from "incur";
import { estimateTokenCount } from "tokenx";
import { cliOperationFailureIdentity, cliOperationFailurePayload, } from "../cliLogging.js";
import { AnalysisResourceConstraintError } from "../domain/analysisErrorCore.js";
import { sliceTextByTokenWindow } from "./tokenWindow.js";
import { projectAnalysisError, } from "../domain/analysisErrorProjection.js";
import { formatCliOutput } from "./cliOutputFormatter.js";
import { jsonLinesErrorRecord } from "./jsonLines.js";
import { writeCliJsonLines } from "./jsonLinesOutput.js";
import { jsonOutputParts, isTerminalOutput, writeJsonOutput, writeOutputText, } from "./jsonOutput.js";
import { visitRegisteredCommands, } from "./visitRegisteredCommands.js";
/** Install formatting once, after registration, for every ordinary CLI result. */
export const streamCliCommandResults = (cli, output) => {
    visitRegisteredCommands(cli, (command, path, inheritedPolicy) => wrapCommand(command, path, output, inheritedPolicy));
};
const wrapCommand = (command, name, output, inheritedPolicy) => {
    const run = command.run;
    command.run = (context) => {
        const started = performance.now();
        const result = run(context);
        // Generator results and Incur's sentinel responses retain their own protocol.
        if (typeof result === "object" &&
            result !== null &&
            Symbol.asyncIterator in result) {
            output.delegateStreaming();
            return result;
        }
        return Promise.resolve(result).then(async (value) => {
            if (typeof value === "object" &&
                value !== null &&
                Symbol.for("incur.sentinel") in value)
                return value;
            if (!(await output.write(value, {
                command: name,
                format: context.format,
                renderOutput: context.agent || inheritedPolicy !== "agent-only",
                duration: `${Math.round(performance.now() - started)}ms`,
            })))
                return value;
            if (output.error !== undefined)
                return context.error({
                    code: output.error.code,
                    message: output.error.message,
                });
            return undefined;
        });
    };
};
/** Preserve Incur output controls and stream JSON while framing failures. */
export const createCliResultOutput = (initialOptions, destination) => {
    let options = initialOptions;
    if (!options.validation.ok)
        return undefined;
    let format = options.format;
    let handled = false;
    let failed = false;
    let error;
    let streaming = false;
    const sdkParts = [];
    let sdkCompletion;
    let completed;
    const recoverFormattingFailure = async (cause) => {
        // A rejected command never reaches write(). Destination failures retain
        // handled ownership. Only a completed, unwritten result can be replaced.
        if (completed === undefined ||
            handled ||
            !(cause instanceof RangeError) ||
            cause.message !== "Invalid string length")
            return false;
        const { originalFailure } = completed;
        error = projectAnalysisError(new AnalysisResourceConstraintError(completed.metadata.command, "memory", `The ${format} result could not fit in a runtime string. The original result was not written.`, {
            format,
            formatted_characters: null,
            max_string_characters: constants.MAX_STRING_LENGTH,
            ...(originalFailure === undefined
                ? {}
                : { original_failure: originalFailure }),
        }, {
            cause,
            retryable: false,
            remediationAction: "Use --format json to stream the complete result, or narrow it with --filter-output. Token limits are applied after formatting and cannot avoid this constraint.",
        }));
        const document = options.fullOutput
            ? {
                ok: false,
                error,
                meta: {
                    command: completed.metadata.command,
                    duration: completed.metadata.duration,
                },
            }
            : error;
        // Recovery must remain actionable even when a token window/count was
        // requested. Do not apply those controls to this small typed failure.
        const text = formatCliOutput(format === "jsonl" ? jsonLinesErrorRecord(document) : document, format);
        handled = true;
        try {
            await writeOutputText(destination, `${text}\n`);
        }
        catch (writeFailure) {
            failed = true;
            throw writeFailure;
        }
        return true;
    };
    const write = async (value, metadata) => {
        completed = undefined;
        if (metadata.format !== format)
            return false;
        try {
            return await writeResult(value, metadata);
        }
        catch (cause) {
            if (await recoverFormattingFailure(cause))
                return true;
            throw cause;
        }
    };
    return {
        get handled() {
            return handled;
        },
        get failed() {
            return failed;
        },
        get error() {
            return error;
        },
        begin(nextOptions) {
            options = nextOptions;
            format = options.format;
            handled = false;
            failed = false;
            error = undefined;
            completed = undefined;
            streaming = false;
            sdkParts.length = 0;
            sdkCompletion = undefined;
        },
        delegateStreaming() {
            streaming = true;
        },
        captureSdkOutput(text) {
            if (format !== "jsonl" || streaming || handled)
                return false;
            // Incur already materializes one-shot documents. Retain references only;
            // generator events bypass this buffer and remain incremental.
            if (text.length > 0)
                sdkParts.push(text);
            return true;
        },
        finishSdkOutput(exitCode) {
            return (sdkCompletion ??= (async () => {
                const parts = sdkParts.splice(0);
                try {
                    if (parts.length === 0) {
                        // SDK writes outside the JSONL buffer still share this destination.
                        // A write callback runs after earlier queued writes have completed,
                        // so the launcher's explicit exit cannot discard a pending pipe tail.
                        await writeOutputText(destination, "");
                        return;
                    }
                    if (exitCode === 0) {
                        for (const part of parts)
                            await writeOutputText(destination, part);
                    }
                    else {
                        const text = parts.join("");
                        let result = text;
                        try {
                            result = JSON.parse(text);
                        }
                        catch {
                            /* Preserve non-JSON SDK diagnostics verbatim. */
                        }
                        await writeJsonOutput(jsonLinesErrorRecord(result), destination, "jsonl");
                    }
                }
                catch (cause) {
                    handled = true;
                    failed = true;
                    throw cause;
                }
            })());
        },
        write,
        recoverFormattingFailure,
    };
    async function writeResult(value, metadata) {
        completed = {
            metadata,
            originalFailure: cliOperationFailureIdentity(value),
        };
        const filterPaths = options.filterOutput
            ? Filter.parse(options.filterOutput)
            : undefined;
        const operationFailure = format === "jsonl" || options.fullOutput || filterPaths !== undefined
            ? cliOperationFailurePayload(value)
            : undefined;
        const failure = options.fullOutput ? operationFailure : undefined;
        const ownsFilteredOutput = operationFailure === undefined &&
            filterPaths !== undefined &&
            filterPaths.length > 0;
        // Incur owns suppressed human presentation, but a filter must never erase
        // the typed failure that this boundary already owns.
        if (operationFailure === undefined &&
            metadata.renderOutput === false &&
            format !== "jsonl" &&
            !options.fullOutput &&
            !options.tokenCount)
            return false;
        const selected = operationFailure ??
            (filterPaths === undefined
                ? value
                : applyCliOutputFilter(value, filterPaths));
        const filtered = (format === "json" || format === "jsonl") &&
            ownsFilteredOutput &&
            Array.isArray(selected)
            ? normalizeJsonArrayValues(selected)
            : selected;
        const ownsSuccessfulTokenWindow = operationFailure === undefined &&
            options.tokenWindow &&
            !options.tokenCount &&
            format !== "json" &&
            format !== "jsonl";
        // Delegate other human formats to Incur. Markdown stays here so admission
        // and emitted table text use the same safe formatter.
        if (format !== "md" &&
            format !== "json" &&
            format !== "jsonl" &&
            operationFailure === undefined &&
            !ownsFilteredOutput &&
            !ownsSuccessfulTokenWindow)
            return false;
        if (format === "jsonl") {
            handled = true;
            try {
                error = await writeCliJsonLines({
                    ...options,
                    source: value,
                    selected: filtered,
                    operationFailure,
                    command: metadata.command,
                    duration: metadata.duration,
                }, destination);
            }
            catch (cause) {
                failed = true;
                throw cause;
            }
            return true;
        }
        const meta = {
            command: metadata.command,
            duration: metadata.duration,
        };
        const errorDocument = options.fullOutput && failure !== undefined
            ? fullFailureEnvelope(failure, meta, format, options.tokenLimit, options.tokenOffset)
            : undefined;
        const document = options.fullOutput
            ? failure !== undefined
                ? errorDocument
                : filtered === undefined
                    ? { ok: true, meta }
                    : { ok: true, data: filtered, meta }
            : // A selected null is a value; only a selection with no JSON value
                // falls back to the empty document.
                filtered === undefined ||
                    typeof filtered === "function" ||
                    typeof filtered === "symbol"
                    ? {}
                    : filtered;
        if (options.tokenCount) {
            // Incur/tokenx materialize JSON. Measure its UTF-16 expansion before
            // allowing that allocation, independently of UTF-8 bytes. Other formats
            // retain Incur's materializing behavior.
            const tokenValue = document;
            let characters = 0;
            if (tokenValue !== undefined &&
                tokenValue !== null &&
                typeof tokenValue !== "function" &&
                typeof tokenValue !== "symbol") {
                if (format === "json") {
                    for (const part of jsonOutputParts(tokenValue, format, isTerminalOutput(destination)))
                        characters += part.length;
                }
            }
            if (characters <= constants.MAX_STRING_LENGTH) {
                let formatted;
                if (format === "json") {
                    // Reuse the writer's exact representation after its capacity admission.
                    // tokenx requires one string; retain only this bounded formatted value.
                    formatted = "";
                    for (const part of jsonOutputParts(tokenValue, format, isTerminalOutput(destination)))
                        formatted += part;
                }
                else
                    formatted = formatCliOutput(tokenValue, format);
                const count = estimateTokenCount(formatted);
                handled = true;
                try {
                    await writeOutputText(destination, `${count}\n`);
                    return true;
                }
                catch (cause) {
                    failed = true;
                    throw cause;
                }
            }
            error = projectAnalysisError(new AnalysisResourceConstraintError(metadata.command, "memory", "Token counting requires a formatted string larger than the runtime permits.", {
                formatted_characters: characters,
                max_string_characters: constants.MAX_STRING_LENGTH,
            }, {
                remediationAction: "Remove --token-count to stream the complete JSON result, or narrow it with --filter-output.",
            }));
        }
        if (ownsSuccessfulTokenWindow) {
            const formatted = formatCliOutput(filtered, format);
            const window = sliceTextByTokenWindow(formatted, options.tokenOffset ?? 0, options.tokenLimit);
            // Keep Incur's empty human/agent presentation semantics. Nonempty text
            // already belongs to this formatter, even when the whole result fits.
            if (!window.truncated && !options.fullOutput && formatted === "")
                return false;
            const sliced = window.truncated
                ? `${window.text}\n[truncated: showing tokens ${window.start}–${window.end} of ${window.total}]`
                : formatted;
            const outputDocument = options.fullOutput
                ? formatCliOutput(window.truncated
                    ? {
                        ok: true,
                        data: sliced,
                        meta: {
                            command: metadata.command,
                            duration: metadata.duration,
                            ...(window.end < window.total
                                ? { nextOffset: window.end }
                                : {}),
                        },
                    }
                    : { ok: true, data: filtered, meta }, format)
                : sliced;
            handled = true;
            try {
                await writeOutputText(destination, outputDocument.endsWith("\n")
                    ? outputDocument
                    : `${outputDocument}\n`);
            }
            catch (cause) {
                failed = true;
                throw cause;
            }
            return true;
        }
        // Once writing starts, a failed destination must not receive a second
        // document from Incur's error formatter.
        const formattedText = format === "md" ||
            ((operationFailure !== undefined || ownsFilteredOutput) &&
                format !== "json")
            ? formatCliOutput(document, format)
            : undefined;
        if (format === "md" &&
            formattedText === "" &&
            !options.fullOutput &&
            !ownsFilteredOutput &&
            operationFailure === undefined)
            return false;
        handled = true;
        try {
            if (formattedText !== undefined) {
                // Incur's error sentinel only carries code/message/retryable. Render
                // the owned projection or caller-visible failure at this boundary.
                await writeOutputText(destination, `${formattedText}\n`);
            }
            else {
                await writeJsonOutput(error === undefined
                    ? document
                    : options.fullOutput
                        ? { ok: false, error, meta }
                        : error, destination, format);
            }
        }
        catch (cause) {
            failed = true;
            throw cause;
        }
        return true;
    }
};
const fullFailureEnvelope = (failure, meta, format, tokenLimit, tokenOffset) => {
    if (tokenLimit === undefined && tokenOffset === undefined)
        return { ok: false, error: failure, meta };
    const formatted = formatCliOutput(failure, format);
    const offset = tokenOffset ?? 0;
    const window = sliceTextByTokenWindow(formatted, offset, tokenLimit);
    if (!window.truncated)
        return { ok: false, error: failure, meta };
    const nextOffset = window.end < window.total ? window.end : undefined;
    return {
        ok: false,
        error: `${window.text}\n[truncated: showing tokens ${window.start}–${window.end} of ${window.total}]`,
        meta: { ...meta, ...(nextOffset === undefined ? {} : { nextOffset }) },
    };
};
/** Apply Incur's parsed path grammar while merging sibling array selections. */
const applyCliOutputFilter = (value, paths) => {
    if (paths.length === 0)
        return value;
    if (Array.isArray(value))
        return value.map((item) => applyCliOutputFilter(item, paths));
    if (paths.length === 1 &&
        paths[0]?.length === 1 &&
        paths[0][0] !== undefined &&
        "key" in paths[0][0]) {
        const key = paths[0][0].key;
        if (typeof value !== "object" ||
            value === null ||
            !Object.hasOwn(value, key))
            return undefined;
        const selected = value[key];
        return typeof selected !== "object" || selected === null
            ? selected
            : { [key]: selected };
    }
    return projectObjectPaths(value, paths);
};
/** Build a fresh object projection; a path ending at a key selects its subtree. */
const projectObjectPaths = (value, paths) => {
    if (typeof value !== "object" || value === null)
        return {};
    const byKey = new Map();
    for (const path of paths) {
        const [segment, ...tail] = path;
        if (segment === undefined || !("key" in segment))
            continue;
        const siblings = byKey.get(segment.key) ?? [];
        siblings.push(tail);
        byKey.set(segment.key, siblings);
    }
    const result = new Map();
    for (const key of [...byKey.keys()].sort()) {
        const siblings = byKey.get(key);
        if (!Object.hasOwn(value, key))
            continue;
        const child = value[key];
        if (child === undefined)
            continue;
        // Selecting a parent retains its complete original subtree and dominates
        // any narrower selections below it, independent of path order.
        if (siblings.some((path) => path.length === 0)) {
            result.set(key, child);
            continue;
        }
        const slicePaths = siblings.filter((path) => path[0] !== undefined && "start" in path[0]);
        if (slicePaths.length > 0 && Array.isArray(child)) {
            result.set(key, projectArraySlices(child, slicePaths));
            continue;
        }
        const objectPaths = siblings.filter((path) => path[0] !== undefined && "key" in path[0]);
        if (objectPaths.length > 0 && typeof child === "object" && child !== null)
            result.set(key, projectObjectPaths(child, objectPaths));
    }
    return Object.fromEntries(result);
};
/** Union sliced rows by their original index, then emit them in source order. */
const projectArraySlices = (source, paths) => {
    const selected = new Map();
    for (const path of paths) {
        const [slice, ...tail] = path;
        if (slice === undefined || !("start" in slice))
            continue;
        const start = normalizeSliceIndex(slice.start, source.length);
        const end = normalizeSliceIndex(slice.end, source.length);
        for (let index = start; index < end; index += 1) {
            const siblings = selected.get(index) ?? [];
            siblings.push(tail);
            selected.set(index, siblings);
        }
    }
    return [...selected.keys()]
        .sort((left, right) => left - right)
        .map((index) => {
        const siblings = selected.get(index);
        const item = source[index];
        if (siblings.some((path) => path.length === 0))
            return item;
        return projectObjectPaths(item, siblings);
    });
};
const normalizeSliceIndex = (index, length) => {
    const integer = Number.isNaN(index) ? 0 : Math.trunc(index);
    return integer < 0
        ? Math.max(length + integer, 0)
        : Math.min(integer, length);
};
/**
 * The streaming JSON writer requires JSON values in arrays. Copy only array
 * branches that need normalization so a parent selection never mutates its
 * source value.
 */
const normalizeJsonArrayValues = (source) => {
    let result;
    for (let index = 0; index < source.length; index += 1) {
        const value = source[index];
        const normalized = value === undefined ||
            typeof value === "function" ||
            typeof value === "symbol"
            ? null
            : Array.isArray(value)
                ? normalizeJsonArrayValues(value)
                : value;
        if (normalized !== value) {
            result ??= source.slice();
            result[index] = normalized;
        }
    }
    return result ?? source;
};
