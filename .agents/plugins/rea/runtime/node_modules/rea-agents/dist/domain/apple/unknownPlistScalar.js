/** An XML plist scalar whose value cannot be established without guessing. */
export class UnknownPlistScalar {
    element;
    rawLiteral;
    reason;
    constructor(element, rawLiteral, reason) {
        this.element = element;
        this.rawLiteral = rawLiteral;
        this.reason = reason;
    }
}
