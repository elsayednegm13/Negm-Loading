/** Distinguish corrupt recognized pycs from magics outside parser coverage. */
export class PythonPycFormatFailure extends Error {
    kind;
    constructor(kind, message) {
        super(message);
        this.kind = kind;
        this.name = "PythonPycFormatFailure";
    }
}
/** Resource boundary exceeded while walking marshal objects. */
export class PythonPycResourceFailure extends Error {
    boundary;
    reported_limits;
    constructor(boundary, reported_limits, message) {
        super(message);
        this.boundary = boundary;
        this.reported_limits = reported_limits;
        this.name = "PythonPycResourceFailure";
    }
}
