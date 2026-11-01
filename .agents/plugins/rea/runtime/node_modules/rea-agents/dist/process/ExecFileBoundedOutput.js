import { spawn } from "node:child_process";
/** Drain both streams while retaining bounded head and tail evidence. */
export const execFileBoundedOutput = (executable, args, options) => new Promise((resolve) => {
    const child = spawn(executable, [...args], {
        env: options.env,
        stdio: ["ignore", "pipe", "pipe"],
    });
    const headLimit = Math.ceil(options.limit / 2);
    const tailLimit = options.limit - headLimit;
    const stdout = { head: Buffer.alloc(0), tail: Buffer.alloc(0), total: 0 };
    const stderr = { head: Buffer.alloc(0), tail: Buffer.alloc(0), total: 0 };
    let outputTruncated = false;
    const capture = (stream) => (chunk) => {
        stream.total += chunk.length;
        const headCount = Math.min(chunk.length, Math.max(0, headLimit - stream.head.length));
        if (headCount > 0)
            stream.head = Buffer.concat([
                stream.head,
                chunk.subarray(0, headCount),
            ]);
        const rest = chunk.subarray(headCount);
        if (rest.length > 0 && tailLimit > 0)
            stream.tail = Buffer.concat([stream.tail, rest]).subarray(-tailLimit);
        if (stream.total > options.limit)
            outputTruncated = true;
    };
    child.stdout.on("data", capture(stdout));
    child.stderr.on("data", capture(stderr));
    let spawnError;
    child.on("error", (error) => {
        spawnError = error;
    });
    child.on("close", (code, signal) => {
        resolve({
            exitCode: spawnError?.code ?? code ?? signal,
            stdout: retainedOutput(stdout, options.limit),
            stderr: retainedOutput(stderr, options.limit),
            outputTruncated,
        });
    });
});
const retainedOutput = (stream, limit) => stream.total > limit
    ? `${stream.head.toString("utf8")} … [output omitted] … ${stream.tail.toString("utf8")}`
    : Buffer.concat([stream.head, stream.tail]).toString("utf8");
