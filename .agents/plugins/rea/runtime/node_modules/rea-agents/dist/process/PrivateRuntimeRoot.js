import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WindowsPrivateRuntime } from "../windows/WindowsPrivateRuntime.js";
import { PrivateRuntimeRootUnavailableError } from "./PrivateRuntimeRootUnavailableError.js";
import { windowsNativeCapabilities, } from "./WindowsAuthority.js";
/** Report whether this process can establish a private runtime root. */
export const privateRuntimeRootCapability = (platform = process.platform) => platform === "win32"
    ? windowsNativeCapabilities(platform).private_runtime_dacl
    : { available: true, reason: null, proof: "posix-mkdtemp-owner-only" };
/**
 * Owns a private temporary runtime root and removes it idempotently.
 *
 * Protocol adapters decide what belongs inside the directory; this primitive
 * establishes a private filesystem boundary on POSIX and deterministic cleanup.
 * Windows privacy requires the separately verified native DACL boundary.
 */
export class PrivateRuntimeRoot {
    path;
    windowsRuntime;
    #closePromise;
    constructor(path, windowsRuntime) {
        this.path = path;
        this.windowsRuntime = windowsRuntime;
    }
    /** Allocate a new private runtime root without performing protocol work. */
    static async create(options = {}) {
        const platform = options.platform ?? process.platform;
        const capability = privateRuntimeRootCapability(platform);
        if (!capability.available)
            throw new PrivateRuntimeRootUnavailableError(capability.reason, {
                retryable: capability.retryable === true,
            });
        if (platform === "win32") {
            const runtime = WindowsPrivateRuntime.create(options.parent ?? tmpdir(), options.prefix ?? "rea-provider-");
            return new PrivateRuntimeRoot(runtime.observation.path, runtime);
        }
        const path = await mkdtemp(join(options.parent ?? tmpdir(), options.prefix ?? "rea-provider-"));
        // POSIX mkdtemp establishes owner-only access atomically. Return its owner
        // without a fallible permission rewrite and rollback after allocation.
        return new PrivateRuntimeRoot(path);
    }
    /**
     * Remove the runtime root; concurrent callers share one attempt. A failed
     * attempt is not cached, so a later close retries the removal.
     */
    close() {
        this.#closePromise ??= (this.windowsRuntime === undefined
            ? rm(this.path, { recursive: true, force: true })
            : Promise.resolve().then(() => this.windowsRuntime?.close())).catch((cause) => {
            this.#closePromise = undefined;
            throw cause;
        });
        return this.#closePromise;
    }
}
