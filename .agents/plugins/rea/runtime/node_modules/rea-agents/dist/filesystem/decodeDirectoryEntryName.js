/** Decode POSIX directory-entry bytes without allowing replacement-character aliases. */
export const decodeDirectoryEntryName = (raw) => {
    if (typeof raw === "string")
        return { kind: "decoded", name: raw };
    const name = raw.toString("utf8");
    return Buffer.from(name, "utf8").equals(raw)
        ? { kind: "decoded", name }
        : { kind: "unrepresentable", rawHex: raw.toString("hex") };
};
