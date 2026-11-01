export const failure = (code, message) => ({
    tag: "reference-source-reader",
    code,
    message,
});
export const cancelled = () => failure("cancelled", "Reference source traversal cancelled");
/** Project resource failures into the reference-source error contract. */
export const referenceSourceResourceFailure = (cause) => ({
    tag: "reference-source-reader",
    code: cause.reason === "cancelled" ? "cancelled" : "io",
    message: cause.message,
    ...(cause.cleanup === undefined ? {} : { cleanup: cause.cleanup }),
    cause,
});
export const safeSize = (size) => {
    const value = Number(size);
    return Number.isSafeInteger(value) && value >= 0 ? value : undefined;
};
const FILESYSTEM_ERROR_CODES = new Set([
    "EACCES",
    "EBADF",
    "EEXIST",
    "EIO",
    "EISDIR",
    "ELOOP",
    "EMFILE",
    // A traversed child can exceed the platform's absolute path limit even
    // though the selected root and every component are valid.
    "ENAMETOOLONG",
    "ENFILE",
    "ENOENT",
    "ENOTDIR",
    "ENOSPC",
    "EPERM",
    "EROFS",
]);
/** Parse known filesystem failures once, separating semantics from host presentation. */
export const filesystemFailureDetail = (cause, operation) => {
    if (!(cause instanceof Error))
        return undefined;
    const code = Reflect.get(cause, "code");
    if (typeof code !== "string" || !FILESYSTEM_ERROR_CODES.has(code))
        return undefined;
    const message = code === "ENAMETOOLONG"
        ? `${operation}: ENAMETOOLONG (entry path exceeds the operating system path limit)`
        : `${operation}: ${code}`;
    const localDiagnostic = `${operation}: ${cause.message}`;
    return {
        message,
        ...(localDiagnostic === message ? {} : { localDiagnostic }),
    };
};
/** Preserve root I/O detail while separating bad selections from access failures. */
export const rootFilesystemFailure = (cause, operation) => {
    if (!(cause instanceof Error))
        return undefined;
    const code = Reflect.get(cause, "code");
    if (typeof code !== "string" || !FILESYSTEM_ERROR_CODES.has(code))
        return undefined;
    return {
        code: code === "ENOENT" || code === "ENOTDIR" ? "invalid-root" : "io",
        message: `${operation}: ${cause.message}`,
    };
};
export const entryFailure = (...[path, kind, code, message, size, localDiagnostic]) => ({
    status: "failed",
    kind,
    path,
    code,
    message,
    ...(size === undefined ? {} : { size }),
    ...(localDiagnostic === undefined ? {} : { localDiagnostic }),
});
