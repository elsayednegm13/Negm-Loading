import { AnalysisError, } from "./analysisErrorBase.js";
/** Runtime configuration could not be parsed safely. */
export class ConfigurationError extends AnalysisError {
    _tag = "ConfigurationError";
    settings;
    constructor(message, options) {
        super(message, options);
        this.settings = (options?.settings ?? []).map(({ setting, constraint }) => ({ setting, constraint }));
    }
}
/** No app or binary session exists for an analysis request. */
export class NoBinaryOpenError extends AnalysisError {
    _tag = "NoBinaryOpenError";
    constructor() {
        super("No app is open. Ask the user which app to investigate, then call open_binary with its local path.");
    }
}
/** A supplied target path could not be safely opened as a supported app or binary. */
export class BinaryTargetError extends AnalysisError {
    path;
    reason;
    _tag = "BinaryTargetError";
    constraint;
    /** The OS read-permission code of the cause, when the host denied access. */
    systemCode;
    constructor(path, reason, options) {
        super(`Cannot open artifact: ${reason}`, options);
        this.path = path;
        this.reason = reason;
        this.constraint = options?.constraint;
        this.systemCode = readPermissionCode(options?.cause);
    }
}
const readPermissionCode = (cause) => {
    const code = cause instanceof Error ? Reflect.get(cause, "code") : undefined;
    return code === "EACCES" || code === "EPERM" ? code : undefined;
};
