/** Preserve the admitted target interpretation in public lifecycle results. */
export const binaryTargetSummary = (target) => ({
    path: target.path,
    format: target.format,
    kind: target.kind,
    sha256: target.sha256,
    architecture: target.architecture ?? null,
    ...(target.format === "raw-binary" || target.format === "gamecube-dol"
        ? { entry_point: target.entryPoint }
        : {}),
});
