import { isMachOFormat } from "../binaryTargetTypes.js";
/** Target prerequisites shared by artifact execution and session discovery. */
export const artifactTargetRefusal = (operation, target) => {
    const bundle = target.kind === "executable" && target.bundleInfoPlist !== undefined;
    const refuse = (reason) => ({
        code: "target_kind_unsupported",
        reason,
    });
    switch (operation) {
        case "decode_interface_builder":
        case "inspect_asset_catalog":
            return bundle
                ? undefined
                : refuse(`${operation} requires an active .app bundle target`);
        case "inspect_keyed_archive":
            return bundle || (target.kind === "artifact" && target.format === "plist")
                ? undefined
                : refuse("inspect_keyed_archive requires an active plist or .app bundle");
        case "trace_dylib_resolution":
            if (target.kind !== "executable")
                return refuse("trace_dylib_resolution requires an active Mach-O or .app bundle target");
            return isMachOFormat(target.format)
                ? undefined
                : {
                    code: "target_format_unsupported",
                    reason: "trace_dylib_resolution requires an active Mach-O or .app bundle target",
                };
        default:
            return undefined;
    }
};
