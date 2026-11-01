import { BINARY_ARCHITECTURES } from "../binaryTargetTypes.js";
import { createEvidence } from "../evidence.js";
/** Preserve the same validated fuse facts on success and incomplete finalization. */
export const createElectronFuseEvidence = (input, value, provider) => {
    const architecture = subjectArchitecture(value);
    return createEvidence({
        path: value.artifact.resolved_path,
        sha256: value.artifact.sha256,
        format: value.artifact.format,
        ...(architecture === undefined ? {} : { architecture }),
    }, provider, {
        operation: "inspect_electron_fuses",
        parameters: input,
        result: value,
        confidence: "observed",
        limitations: value.limitations,
        locations: locationsFor(value),
    });
};
const subjectArchitecture = (report) => {
    if (report.artifact.format === "mach-o-universal")
        return undefined;
    if (report.slices.length !== 1)
        return undefined;
    const name = report.slices[0]?.architecture;
    return BINARY_ARCHITECTURES.find((supported) => supported === name);
};
const locationsFor = (report) => [
    { kind: "artifact-path", path: report.artifact.selected_path },
    ...(report.artifact.resolved_path === report.artifact.selected_path
        ? []
        : [
            {
                kind: "artifact-path",
                path: report.artifact.resolved_path,
            },
        ]),
    ...report.slices.flatMap((slice) => slice.sentinels.map((sentinel) => ({
        kind: "file-offset",
        offset: sentinel.sentinel_offset,
    }))),
];
