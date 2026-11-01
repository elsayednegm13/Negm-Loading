import { createHash } from "node:crypto";
import { chmod, mkdir, open, rm, rmdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { createConnection, createServer, } from "node:net";
import { join } from "node:path";
import { safeParseJson } from "../domain/safeJson.js";
/**
 * Hold one named lease for as long as this process keeps it.
 *
 * The lease is a listening local socket, so the operating system ends it when
 * the owning process exits. A crashed owner leaves a socket that refuses
 * connections; recovery replaces only that stale socket. A live owner answers
 * with its own identity, which is reported instead of a PID guess.
 */
export const acquireOwnedLease = async (input) => {
    const produced = new WeakSet();
    const fail = (failure, cause) => {
        const error = input.failure(failure, cause);
        produced.add(error);
        return error;
    };
    const key = createHash("sha256")
        .update(JSON.stringify(input.identity))
        .digest("hex")
        .slice(0, 32);
    const owner = { runId: input.runId, processId: process.pid };
    if (process.platform === "win32") {
        // A named pipe disappears with its last handle, so no stale pipe needs
        // recovery. A pipe that vanished between bind and owner lookup is retried.
        const pipePath = `\\\\.\\pipe\\rea-lease-${key}`;
        for (let attempt = 0; attempt < 2; attempt += 1) {
            const acquisition = await tryAcquireLease(pipePath, owner, fail, false);
            if (typeof acquisition !== "string")
                return acquisition;
        }
        throw fail({ kind: "unrecoverable" });
    }
    await ensureLeaseDirectory(input.directory, fail, produced);
    const socketPath = join(input.directory, `${key}.sock`);
    const acquisition = await tryAcquireLease(socketPath, owner, fail, true);
    if (typeof acquisition !== "string")
        return acquisition;
    // Serialize stale cleanup through the replacement bind: otherwise two
    // recoverers can unlink the socket that one of them has just acquired.
    const recoveryPath = `${socketPath}.recovery`;
    await reserveRecovery(recoveryPath, fail);
    let recovered;
    try {
        recovered = await tryAcquireLease(socketPath, owner, fail, true);
        if (recovered === "stale")
            await rm(socketPath, { force: true });
        if (typeof recovered === "string")
            recovered = await tryAcquireLease(socketPath, owner, fail, true);
        if (typeof recovered !== "string")
            return recovered;
        throw fail({ kind: "unrecoverable" });
    }
    finally {
        try {
            await rmdir(recoveryPath);
        }
        catch (cause) {
            if (typeof recovered !== "string" && recovered?.acquired)
                await recovered.lease.release();
            throw fail({ kind: "recovery_remove", path: recoveryPath }, cause);
        }
    }
};
const reserveRecovery = async (recoveryPath, fail) => {
    try {
        await mkdir(recoveryPath, { mode: 0o700 });
    }
    catch (cause) {
        const busy = typeof cause === "object" &&
            cause !== null &&
            Reflect.get(cause, "code") === "EEXIST";
        throw fail(busy
            ? { kind: "recovery_busy", path: recoveryPath }
            : { kind: "recovery_create", path: recoveryPath }, cause);
    }
};
const tryAcquireLease = async (socketPath, owner, fail, securePath) => {
    const server = createServer((socket) => sendOwner(socket, owner));
    // The lease lives exactly as long as its owning process. A lease retained
    // after unconfirmed cleanup must not keep a completed one-shot command
    // alive; process exit leaves a stale socket that later acquirers recover.
    server.unref();
    if (!(await bind(server, socketPath))) {
        const existingOwner = await readOwner(socketPath, fail);
        return typeof existingOwner === "string"
            ? existingOwner
            : { acquired: false, owner: existingOwner };
    }
    if (securePath)
        try {
            await chmod(socketPath, 0o600);
        }
        catch (cause) {
            await closeServer(server);
            throw cause;
        }
    let released = false;
    return {
        acquired: true,
        lease: {
            socketPath,
            release: async () => {
                if (released)
                    return;
                // Node removes a bound Unix socket on close. A second unlink here
                // could remove a new owner's socket bound after that close.
                await closeServer(server);
                released = true;
            },
        },
    };
};
const ensureLeaseDirectory = async (directory, fail, produced) => {
    try {
        await mkdir(directory, { recursive: true, mode: 0o700 });
    }
    catch (cause) {
        throw fail({ kind: "directory_create" }, cause);
    }
    // Use O_DIRECTORY|O_NOFOLLOW to open the directory without following symlinks,
    // then inspect and secure that descriptor. Later socket operations still use
    // the path and are not made atomic by this directory validation.
    let handle;
    try {
        handle = await open(directory, fsConstants.O_RDONLY |
            (fsConstants.O_DIRECTORY ?? 0) |
            (fsConstants.O_NOFOLLOW ?? 0));
        const directoryStat = await handle.stat();
        if (directoryStat.isSymbolicLink() ||
            directoryStat.isDirectory() === false ||
            (process.getuid !== undefined && directoryStat.uid !== process.getuid()))
            throw fail({ kind: "directory_not_private" });
        // POSIX permission hardening: chmod on the already-opened descriptor avoids
        // a second TOCTOU window where the directory could be swapped between check
        // and permission fix.
        const posixPermissionsApply = process.getuid !== undefined;
        if (posixPermissionsApply && (directoryStat.mode & 0o077) !== 0) {
            await handle.chmod(0o700);
            // Re-verify permissions on the same opened directory.
            const afterChmod = await handle.stat();
            if (afterChmod.isSymbolicLink() ||
                afterChmod.isDirectory() === false ||
                (afterChmod.mode & 0o077) !== 0)
                throw fail({ kind: "directory_permissions" });
        }
    }
    catch (cause) {
        if (cause instanceof Error && produced.has(cause))
            throw cause;
        const accessDenied = process.getuid !== undefined &&
            cause instanceof Error &&
            "code" in cause &&
            cause.code === "EACCES";
        throw fail(accessDenied
            ? { kind: "directory_access_denied", directory }
            : { kind: "directory_inspect" }, cause);
    }
    finally {
        await handle?.close();
    }
};
const bind = (server, socketPath) => new Promise((resolveBind, reject) => {
    const onError = (error) => {
        server.removeListener("listening", onListening);
        if (error.code === "EADDRINUSE")
            resolveBind(false);
        else
            reject(error);
    };
    const onListening = () => {
        server.removeListener("error", onError);
        resolveBind(true);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(socketPath);
});
const sendOwner = (socket, owner) => {
    socket.end(`${JSON.stringify(owner)}\n`);
};
const readOwner = (socketPath, fail) => new Promise((resolveOwner, rejectOwner) => {
    const socket = createConnection(socketPath);
    socket.setEncoding("utf8");
    let response = "";
    let settled = false;
    const reject = (reason, cause) => {
        if (settled)
            return;
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        rejectOwner(fail({ kind: "owner_unverified", reason }, cause));
    };
    const timer = setTimeout(() => reject("owner response timed out"), 250);
    const finish = (owner) => {
        if (settled)
            return;
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        resolveOwner(owner);
    };
    socket.on("data", (chunk) => {
        response += chunk;
        const newline = response.indexOf("\n");
        if (newline < 0)
            return;
        const parsed = safeParseJson(response.slice(0, newline));
        if (!parsed.ok) {
            reject("malformed owner response");
            return;
        }
        const value = parsed.value;
        const runId = typeof value === "object" && value !== null
            ? Reflect.get(value, "runId")
            : undefined;
        const processId = typeof value === "object" && value !== null
            ? Reflect.get(value, "processId")
            : undefined;
        if (typeof runId === "string" &&
            runId.length > 0 &&
            typeof processId === "number" &&
            Number.isSafeInteger(processId) &&
            processId > 0)
            finish({ runId, processId });
        else
            reject("invalid owner identity");
    });
    socket.on("error", (cause) => {
        if (cause.code === "ENOENT")
            finish("missing");
        else if (cause.code === "ECONNREFUSED")
            finish("stale");
        else
            reject(cause.code ?? "owner connection failed", cause);
    });
    socket.on("end", () => reject("owner closed without a complete response"));
});
const closeServer = (server) => new Promise((resolveClose, reject) => {
    if (!server.listening) {
        resolveClose();
        return;
    }
    server.close((error) => (error ? reject(error) : resolveClose()));
});
