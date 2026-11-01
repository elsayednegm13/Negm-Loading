import { noRuntimeOverrideSentence, selectedCdpCommandTimeoutMs, } from "../domain/browserDeadline.js";
import { WEB_RUNTIME_LIMITS } from "../domain/webRuntime.js";
import { ProviderStartupDeadline } from "../process/ProviderDeadline.js";
const MIB = 1024 * 1024;
export const CDP_SCRIPT_SOURCE_BYTES_OMISSION_REASON = `script source was omitted because the aggregate ${String(WEB_RUNTIME_LIMITS.sourceBytes)}-byte (${String(WEB_RUNTIME_LIMITS.sourceBytes / MIB)} MiB) source budget was exhausted. ${noRuntimeOverrideSentence("That source budget stays fixed.", "command_timeout_ms")}`;
/** Name command_timeout_ms on a passive script-source collection miss. */
export const cdpScriptSourceDeadlineOmissionReason = (timeoutMs) => `script source was omitted because the ${String(timeoutMs)} ms command_timeout_ms source collection deadline elapsed (deadlineExpired). This is not the caller observation window. ${noRuntimeOverrideSentence(`The ${String(WEB_RUNTIME_LIMITS.sourceBytes)}-byte source budget stays fixed.`, "command_timeout_ms")}`;
/** Shared admission for source text retained from passive CDP script reads. */
export class CdpScriptSourceBudget {
    #deadline;
    commandTimeoutMs;
    #retainedBytes = 0;
    constructor(signal, commandTimeoutMs = selectedCdpCommandTimeoutMs(undefined)) {
        this.commandTimeoutMs = commandTimeoutMs;
        this.#deadline = new ProviderStartupDeadline(commandTimeoutMs, signal);
    }
    get signal() {
        return this.#deadline.signal;
    }
    get timedOut() {
        return this.#deadline.interruption === "timeout";
    }
    /** Admit exact UTF-8 source bytes before building or retaining its artifact. */
    admit(text) {
        const bytes = Buffer.byteLength(text, "utf8");
        if (bytes > WEB_RUNTIME_LIMITS.sourceBytes - this.#retainedBytes)
            return false;
        this.#retainedBytes += bytes;
        return true;
    }
    dispose() {
        this.#deadline.dispose();
    }
}
