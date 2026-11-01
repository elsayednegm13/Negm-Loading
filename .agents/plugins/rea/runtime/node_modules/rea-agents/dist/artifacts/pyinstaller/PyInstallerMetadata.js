import { pythonVersionForMagic } from "./PythonBytecode.js";
const pythonVersion = (value) => value >= 100
    ? { major: Math.floor(value / 100), minor: value % 100 }
    : value >= 20
        ? { major: Math.floor(value / 10), minor: value % 10 }
        : undefined;
export const cookieMetadata = (cookie, entries, encryptionMarker) => {
    const version = pythonVersion(cookie.pythonVersion);
    return {
        kind: "pyinstaller",
        layout_version: cookie.layout,
        archive_start: cookie.archiveStart,
        archive_size: cookie.packageLength,
        cookie_offset: cookie.cookieOffset,
        toc_offset: cookie.tocOffset,
        toc_size: cookie.tocLength,
        entry_count: entries.length,
        runtime_option_count: entries.filter((entry) => entry.typeCode === "o")
            .length,
        external_dependency_count: entries.filter((entry) => entry.typeCode === "d")
            .length,
        python_version_raw: cookie.pythonVersion,
        python_major: version?.major ?? null,
        python_minor: version?.minor ?? null,
        python_library: cookie.pythonLibrary,
        encryption_marker_present: encryptionMarker,
    };
};
/** A sibling PYZ header is usable for scripts only when every image and the cookie agree. */
export const scriptPythonMagic = (cookie, archives) => {
    const version = pythonVersion(cookie.pythonVersion);
    if (version === undefined)
        return undefined;
    let selected;
    for (const archive of archives) {
        const magic = archive.pythonMagic;
        if (pythonVersionForMagic(magic) !==
            `${String(version.major)}.${String(version.minor)}` ||
            (selected !== undefined && !selected.equals(magic)))
            return undefined;
        selected = magic;
    }
    return selected;
};
const entryMetadata = (source, bytecode, header) => ({
    kind: "pyinstaller-entry",
    ...source,
    bytecode_header: bytecode
        ? header === undefined
            ? "unknown"
            : "derived"
        : "not-bytecode",
    bytecode_magic: header?.subarray(0, 4).toString("hex") ?? null,
    pyz_status: "not-pyz",
    directory_record_offset: null,
    directory_record_size: null,
    pyz_sha256: null,
    pyz_python_magic: null,
    pyz_python_version: null,
    pyz_entry_count: null,
    encryption_source: null,
});
export const cArchiveEntryMetadata = (entry, header, archive, encryptionMarker = false) => ({
    ...entryMetadata({
        container: "carchive",
        container_name: null,
        index: entry.index,
        source_name: entry.name,
        type_code: entry.typeCode,
        relative_offset: entry.offset,
        compression_flag: entry.compressionFlag === 1 ? 1 : 0,
    }, ["s", "m", "M"].includes(entry.typeCode), header),
    ...(entry.typeCode === "d" ? dependencyMetadata(entry.name) : {}),
    pyz_status: archive?.kind === "entries"
        ? "decoded"
        : archive === undefined
            ? "not-pyz"
            : "opaque",
    directory_record_offset: entry.tocRecordOffset,
    directory_record_size: entry.tocRecordLength,
    pyz_sha256: archive?.sha256 ?? null,
    pyz_python_magic: archive?.pythonMagic.toString("hex") ?? null,
    pyz_python_version: archive === undefined
        ? null
        : (pythonVersionForMagic(archive.pythonMagic) ?? null),
    pyz_entry_count: archive?.kind === "entries" ? archive.entries.length : null,
    encryption_source: archive !== undefined && encryptionMarker ? "carchive-marker" : null,
});
/** The bootloader splits at the first colon; neither part is a local read grant. */
const dependencyMetadata = (source) => {
    const colon = source.indexOf(":");
    const valid = colon > 0 && colon < source.length - 1;
    return {
        dependency_status: valid ? "unresolved" : "invalid-reference",
        dependency_archive: valid ? source.slice(0, colon) : null,
        dependency_member: valid ? source.slice(colon + 1) : null,
    };
};
/** Legacy writers encrypt nonempty namespace payloads as well as module payloads. */
export const pyzEntryEncrypted = (entry, encryptionMarker) => encryptionMarker && entry.length > 0;
export const pyzEntryMetadata = (container, entry, header, encryptionMarker) => ({
    ...entryMetadata({
        container: "pyz",
        container_name: container.name,
        index: entry.index,
        source_name: entry.name,
        type_code: entry.typeCode,
        relative_offset: entry.offset,
        compression_flag: entry.compressionFlag,
    }, entry.typeCode === 0 || entry.typeCode === 1, header),
    encryption_source: pyzEntryEncrypted(entry, encryptionMarker)
        ? "carchive-marker"
        : null,
});
