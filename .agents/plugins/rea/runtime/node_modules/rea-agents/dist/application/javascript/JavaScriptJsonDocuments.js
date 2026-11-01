import { compareUnicodeCodePoints } from "../../domain/unicodeCodePointOrder.js";
const PACKAGE_PROPERTIES = [
    "name",
    "version",
    "main",
    "module",
    "renderer",
    "browser",
    "exports",
    "imports",
];
/**
 * Lazy JSON facts shared by one analysis and its graph projection. Entries follow
 * the admitted source files' lifetime; changed identity, format or text replaces them.
 */
export class JavaScriptJsonDocuments {
    #byFile = new Map();
    read(file) {
        const cached = this.#byFile.get(file);
        if (cached !== undefined && sameSnapshot(cached.snapshot, file))
            return cached.facts;
        const snapshot = sourceSnapshot(file);
        const facts = parseDocument(snapshot);
        this.#byFile.set(file, { snapshot, facts });
        return facts;
    }
}
const sourceSnapshot = (file) => ({
    source: Object.freeze({
        path: file.path,
        container_sha256: file.container_sha256,
        sha256: file.sha256,
    }),
    kind: file.kind,
    text: { ...file.text },
});
const sameSnapshot = (left, right) => left.source.path === right.path &&
    left.source.container_sha256 === right.container_sha256 &&
    left.source.sha256 === right.sha256 &&
    left.kind === right.kind &&
    left.text.included === right.text.included &&
    (left.text.included
        ? right.text.included && left.text.value === right.text.value
        : !right.text.included && left.text.reason === right.text.reason);
const parseDocument = (snapshot) => {
    if (!snapshot.text.included)
        return Object.freeze({
            source: snapshot.source,
            status: "unavailable",
            packageFields: null,
            topLevelKeys: Object.freeze([]),
            reason: snapshot.text.reason,
        });
    let root;
    try {
        root = JSON.parse(snapshot.text.value);
    }
    catch (cause) {
        if (!(cause instanceof SyntaxError))
            throw cause;
        return Object.freeze({
            source: snapshot.source,
            status: "invalid",
            packageFields: null,
            topLevelKeys: Object.freeze([]),
            syntaxError: cause,
        });
    }
    if (typeof root !== "object" || root === null || Array.isArray(root))
        return Object.freeze({
            source: snapshot.source,
            status: "included",
            nextDependency: "unproven",
            packageFields: null,
            topLevelKeys: Object.freeze([]),
        });
    const record = root;
    const topLevelKeys = Object.freeze(Object.keys(record).sort(compareUnicodeCodePoints));
    // Absent source fields must stay absent when consumers read named properties.
    const packageFields = snapshot.kind === "package-json" ? Object.create(null) : null;
    if (packageFields !== null) {
        for (const key of PACKAGE_PROPERTIES)
            if (Object.hasOwn(record, key))
                packageFields[key] = Reflect.get(record, key);
        Object.freeze(packageFields);
    }
    const nextDeclared = snapshot.kind === "package-json" &&
        ["dependencies", "devDependencies", "peerDependencies"].some((key) => {
            const dependencies = record[key];
            if (typeof dependencies !== "object" ||
                dependencies === null ||
                Array.isArray(dependencies) ||
                !Object.hasOwn(dependencies, "next"))
                return false;
            const version = Reflect.get(dependencies, "next");
            return typeof version === "string" && version.length > 0;
        });
    return Object.freeze({
        source: snapshot.source,
        status: "included",
        nextDependency: nextDeclared ? "declared" : "unproven",
        packageFields,
        topLevelKeys,
    });
};
