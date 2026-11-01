/** Distinguish corrupt recognized IPS files from unsupported bug types. */
export class AppleIpsFormatFailure extends Error {
    kind;
    constructor(kind, message) {
        super(message);
        this.kind = kind;
        this.name = "AppleIpsFormatFailure";
    }
}
/** Resource boundary exceeded while walking an IPS crash report. */
export class AppleIpsResourceFailure extends Error {
    boundary;
    maximum;
    constructor(boundary, maximum, message) {
        super(message);
        this.boundary = boundary;
        this.maximum = maximum;
        this.name = "AppleIpsResourceFailure";
    }
}
