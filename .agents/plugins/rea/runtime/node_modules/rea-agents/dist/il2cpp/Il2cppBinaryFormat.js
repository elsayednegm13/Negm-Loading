export const IL2CPP_BINARY_FAILURE_REASONS = {
    unsupported: [
        "unsupported-container",
        "slice-selection-required",
        "slice-not-found",
        "ambiguous-slice-selection",
        "unsupported-pointer-encoding",
        "unsupported-type-kind",
        "generic-methods-unsupported",
    ],
    capacity: [
        "native-index-capacity",
        "type-nesting-capacity",
        "native-type-text-capacity",
    ],
    malformed: [
        "malformed-container",
        "code-gen-modules-not-found",
        "ambiguous-code-gen-module",
        "code-registration-not-found",
        "invalid-method-pointer",
        "invalid-method-token",
        "metadata-registration-not-found",
        "invalid-type",
        "generic-method-registration-not-found",
        "ambiguous-generic-method-registration",
    ],
};
/** A native image REA cannot link, either outside coverage or inconsistent with the metadata. */
export class Il2cppBinaryFormatFailure extends Error {
    reason;
    kind;
    constructor(reason, message) {
        super(`${reason}: ${message}`);
        this.reason = reason;
        this.name = "Il2cppBinaryFormatFailure";
        this.kind = IL2CPP_BINARY_FAILURE_REASONS.unsupported.includes(reason)
            ? "unsupported"
            : IL2CPP_BINARY_FAILURE_REASONS.capacity.includes(reason)
                ? "capacity"
                : "malformed";
    }
}
