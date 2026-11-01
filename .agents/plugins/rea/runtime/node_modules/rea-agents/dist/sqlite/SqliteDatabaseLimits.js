/** Bound frozen input, retained JSON and worker allocation before parsing untrusted files. */
export const SQLITE_DATABASE_LIMITS = {
    concurrentInspections: 2,
    inputBytes: 256 * 1024 * 1024,
    outputBytes: 16 * 1024 * 1024,
    diagnosticBytes: 1024 * 1024,
};
/** Internal rejection retains the failed boundary without returning partial success. */
export class SqliteInspectionFailure extends Error {
    reason;
    constructor(reason, message) {
        super(message);
        this.reason = reason;
    }
}
/** Selected generated cells the private connection cannot compute; the database stays readable. */
export class SqliteColumnEvaluationFailure extends SqliteInspectionFailure {
    readableColumns;
    constructor(message, 
    /** Selected or stored columns that remain readable without the failed expressions. */
    readableColumns) {
        super("column-evaluation", message);
        this.readableColumns = readableColumns;
    }
}
/** A projection above this connection's result-column capacity; the database stays readable. */
export class SqliteColumnLimitFailure extends SqliteInspectionFailure {
    selectedColumns;
    engineColumnLimit;
    constructor(message, selectedColumns, engineColumnLimit) {
        super("column-limit", message);
        this.selectedColumns = selectedColumns;
        this.engineColumnLimit = engineColumnLimit;
    }
}
/** SQLite's primary result code for a native node:sqlite failure, if it carries one. */
export const sqlitePrimaryResultCode = (cause) => cause instanceof Error &&
    "errcode" in cause &&
    typeof cause.errcode === "number"
    ? cause.errcode & 0xff
    : undefined;
