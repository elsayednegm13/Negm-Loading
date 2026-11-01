/** Expected malformed, unsupported or oversized producer data at a historical decoder boundary. */
export class CaptureFormatError extends Error {
    reason;
    pointer;
    constructor(reason, message, pointer = "", cause) {
        super(message, cause === undefined ? undefined : { cause });
        this.reason = reason;
        this.pointer = pointer;
    }
}
