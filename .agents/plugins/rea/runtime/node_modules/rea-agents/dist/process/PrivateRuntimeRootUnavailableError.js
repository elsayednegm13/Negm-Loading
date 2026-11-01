import { RuntimeControlUnavailableError } from "./RuntimeControlUnavailableError.js";
/** Expected failure when a runtime root's privacy boundary is unavailable. */
export class PrivateRuntimeRootUnavailableError extends RuntimeControlUnavailableError {
    code = "private-runtime-root-authority-unavailable";
    constructor(message, options) {
        super(message, options);
        this.name = "PrivateRuntimeRootUnavailableError";
    }
}
