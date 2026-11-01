import { nativeCallEventSchema } from "../domain/native/nativeCallObservation.js";
/** Maximum journal size enforced by the LLDB bridge. */
export const LLDB_OBSERVATION_JOURNAL_MAX_BYTES = 8 * 1024 * 1024;
const MAX_CAPTURE_BYTES = 1024 * 1024;
/** Join safely retained journal and process evidence into its failure contract. */
export const projectLldbPartialObservation = (input) => ({
    kind: "native-call-observation",
    target: input.target,
    process: {
        pid: input.pid ?? null,
        stdout: input.stdout,
        stderr: input.stderr,
        other_stops: input.journal.otherStops,
    },
    debugger: { version: input.version },
    events: input.journal.events,
    coverage: { status: "partial", reason: input.reason },
    limitations: [
        "The LLDB run did not produce a complete native call observation result.",
        "The target SHA-256 identifies the selected artifact; LLDB did not verify the bytes loaded into the process.",
        "Captured output byte counts are observed lower bounds because LLDB did not report final stream counters.",
        ...input.journal.limitations,
        ...(input.journalLimitations ?? []),
        ...(input.limitations ?? []),
        ...(input.pid === undefined ? ["The target PID was unavailable."] : []),
        ...(input.stdout === null
            ? ["The target stdout capture was unavailable."]
            : []),
        ...(input.stderr === null
            ? ["The target stderr capture was unavailable."]
            : []),
    ],
});
/** Parse completed JSONL records while retaining valid records around bad ones. */
export const parseLldbObservationJournal = (bytes) => {
    const hasTornTail = bytes.length > 0 && bytes[bytes.length - 1] !== 0x0a;
    const events = [];
    const otherStops = [];
    const limitations = [];
    const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
    let malformedCount = 0;
    let firstMalformedRow;
    let start = 0;
    let rowNumber = 0;
    while (start < bytes.length) {
        const end = bytes.indexOf(0x0a, start);
        if (end < 0)
            break;
        const line = bytes.subarray(start, end);
        start = end + 1;
        if (line.length === 0)
            continue;
        rowNumber += 1;
        const markMalformed = () => {
            malformedCount += 1;
            firstMalformedRow ??= rowNumber;
        };
        let row;
        try {
            row = JSON.parse(decoder.decode(line));
        }
        catch {
            markMalformed();
            continue;
        }
        if (typeof row !== "object" ||
            row === null ||
            !("kind" in row) ||
            typeof row.kind !== "string") {
            markMalformed();
            continue;
        }
        if (row.kind === "event" && "event" in row) {
            const event = nativeCallEventSchema.safeParse(row.event);
            if (event.success)
                events.push(event.data);
            else
                markMalformed();
        }
        else if (row.kind === "other-stop" &&
            "reason" in row &&
            typeof row.reason === "string") {
            otherStops.push(row.reason);
        }
        else {
            markMalformed();
        }
    }
    if (malformedCount > 0)
        limitations.push(`${malformedCount} observation journal row(s) were malformed or invalid and ignored (first at row ${String(firstMalformedRow)}).`);
    if (hasTornTail)
        limitations.push("The final observation journal record was incomplete and was ignored.");
    return { events, otherStops, limitations };
};
/** Keep reading a bounded prefix across short reads until EOF or the bound. */
export const readBoundedPrefix = async (requestedBytes, readChunk) => {
    const buffer = Buffer.alloc(requestedBytes);
    let bytesRead = 0;
    while (bytesRead < requestedBytes) {
        let count;
        try {
            count = await readChunk(buffer, bytesRead, requestedBytes - bytesRead, bytesRead);
        }
        catch (cause) {
            return { status: "read-failure", buffer, bytesRead, cause };
        }
        if (count === 0)
            break;
        if (count > requestedBytes - bytesRead)
            throw new Error("The bounded read returned more bytes than requested");
        bytesRead += count;
    }
    return {
        status: bytesRead < requestedBytes ? "eof" : "complete",
        buffer,
        bytesRead,
    };
};
const readPrefix = (handle, requestedBytes) => readBoundedPrefix(requestedBytes, async (buffer, offset, length, position) => (await handle.read(buffer, offset, length, position)).bytesRead);
/** Read at most the bridge's journal bound, checking size before allocation. */
export const readLldbObservationJournal = (path, files) => files.read(path, async (handle) => {
    const { size } = await handle.stat();
    const length = Math.min(size, LLDB_OBSERVATION_JOURNAL_MAX_BYTES);
    const read = await readPrefix(handle, length);
    const { buffer, bytesRead } = read;
    if (read.status === "read-failure" && bytesRead === 0)
        throw read.cause;
    const value = {
        parsed: parseLldbObservationJournal(buffer.subarray(0, bytesRead)),
        limitations: [
            ...(size > LLDB_OBSERVATION_JOURNAL_MAX_BYTES
                ? [
                    "The observation journal exceeded 8388608 bytes (8 MiB); only its bounded prefix was read. This release has no runtime override.",
                ]
                : []),
            ...(read.status === "eof"
                ? [
                    "The observation journal became shorter while being read; the available prefix was parsed.",
                ]
                : []),
            ...(read.status === "read-failure"
                ? [
                    `The observation journal read failed after ${String(bytesRead)} bytes: ${errorReason(read.cause)}`,
                ]
                : []),
        ],
    };
    return read.status === "read-failure"
        ? { ...value, status: read.status, readFailure: read.cause }
        : { ...value, status: read.status };
});
/** Retain an available output prefix without claiming an unreported total. */
export const readPartialCapture = (path, files) => files.read(path, async (handle) => {
    const { size } = await handle.stat();
    const length = Math.min(size, MAX_CAPTURE_BYTES);
    const read = await readPrefix(handle, length);
    const { buffer, bytesRead } = read;
    if (read.status === "read-failure" && bytesRead === 0)
        throw read.cause;
    const value = {
        capture: {
            text: buffer.subarray(0, bytesRead).toString("utf8"),
            bytes: Math.max(size, bytesRead),
            truncated: true,
            complete: false,
        },
        limitations: [
            ...(read.status === "eof"
                ? [
                    "A target output capture became shorter while being read; its retained prefix may be incomplete.",
                ]
                : []),
            ...(read.status === "read-failure"
                ? [
                    `A target output capture read failed after ${String(bytesRead)} bytes: ${errorReason(read.cause)}`,
                ]
                : []),
        ],
    };
    return read.status === "read-failure"
        ? { ...value, status: read.status, readFailure: read.cause }
        : { ...value, status: read.status };
});
const errorReason = (cause) => cause instanceof Error ? cause.message : String(cause);
