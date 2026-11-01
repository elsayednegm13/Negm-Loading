import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { createFunctionCoordinateContext } from "../domain/native/functionCoordinateContext.js";
import { createAnalysisProfile } from "../domain/analysisProfile.js";
import { isMachOFormat, isElfMetadataArchitecture, } from "../domain/binaryTargetTypes.js";
import { AnalysisCancelledError, AnalysisCapabilityUnavailableError, } from "../domain/analysisErrorCore.js";
import { BinaryTargetError } from "../domain/configurationErrors.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { machoTargetSelectionSchema, } from "../domain/apple/machoTargetSelection.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { err, ok } from "../domain/result.js";
import { resolveHopperMachOImage, } from "./HopperMachOImage.js";
/** Resolve Hopper open semantics without placing its CLI flags in BinaryTarget. */
export const resolveHopperAnalysisProfile = async (target, options) => {
    try {
        return await options.resourceScope.run(() => resolveHopperAnalysisProfileInScope(target, options));
    }
    catch (cause) {
        return err(cause instanceof AnalysisError
            ? cause
            : new ProviderAdapterError("hopper", "resolve_analysis_profile", {
                cause,
            }));
    }
};
const resolveHopperAnalysisProfileInScope = async (target, options) => {
    if (target.kind !== "executable" && target.kind !== "database")
        return ok({ profile: null });
    let machoContainer;
    if (target.kind === "executable" && isMachOFormat(target.format)) {
        const header = await readMachoMagic(target.path, options.signal);
        if (!header.ok)
            return header;
        machoContainer = [0xcafebabf, 0xbfbafeca].includes(header.value)
            ? "fat64"
            : [0xcafebabe, 0xbebafeca].includes(header.value)
                ? "fat32"
                : "thin";
    }
    let preparedImage;
    if (target.kind === "executable" &&
        machoContainer !== undefined &&
        options.loaderArgsOverride.length === 0) {
        const resolved = await resolveHopperMachOImage(target, {
            resourceScope: options.resourceScope,
            ...(options.signal === undefined ? {} : { signal: options.signal }),
            ...(options.imageFileSystem === undefined
                ? {}
                : { fileSystem: options.imageFileSystem }),
        });
        if (!resolved.ok)
            return resolved;
        preparedImage = resolved.value;
    }
    let targetSelection;
    if (preparedImage?.method === "thin_verified_copy") {
        targetSelection = machoTargetSelectionSchema.parse({
            kind: "macho-selected-image-v1",
            container: "thin",
            offset: 0,
            byte_length: preparedImage.byte_length,
            cpu_type: preparedImage.cpu_type,
            cpu_subtype: preparedImage.cpu_subtype,
            container_table_sha256: null,
        });
    }
    else if (preparedImage !== undefined) {
        targetSelection = machoTargetSelectionSchema.parse({
            kind: "macho-selected-image-v1",
            container: "fat",
            offset: preparedImage.source_offset,
            byte_length: preparedImage.byte_length,
            cpu_type: preparedImage.cpu_type,
            cpu_subtype: preparedImage.cpu_subtype,
            container_table_sha256: preparedImage.container_table_sha256,
        });
    }
    const derived = hopperLoaderArgsForTarget(target, preparedImage === undefined ? machoContainer : "thin");
    if (!derived.ok)
        return derived;
    const loaderArgs = options.loaderArgsOverride.length === 0
        ? derived.value
        : [...options.loaderArgsOverride];
    const launcherDigest = await sha256File(options.launcherPath, options.signal);
    if (!launcherDigest.ok)
        return launcherDigest;
    const provider = {
        id: options.provider.id,
        name: options.provider.name,
        version: `launcher-sha256:${launcherDigest.value}`,
    };
    return ok({
        profile: createAnalysisProfile(provider, {
            ...(target.kind === "executable" &&
                options.loaderArgsOverride.length === 0 &&
                (machoContainer === undefined || targetSelection !== undefined)
                ? {
                    function_coordinate_context: createFunctionCoordinateContext({ loader_arguments: [...loaderArgs] }, targetSelection ?? null),
                }
                : {}),
            target_kind: target.kind,
            target_format: target.format,
            function_dossier_coverage: "observed-facets-and-call-relationships-v1",
            architecture: target.architecture ?? null,
            available_architectures: [
                ...(target.availableArchitectures ?? []),
            ].sort(),
            ...(machoContainer === undefined
                ? {}
                : { macho_container: machoContainer }),
            ...(preparedImage === undefined
                ? {}
                : { prepared_image: { ...preparedImage } }),
            ...(targetSelection === undefined
                ? {}
                : { target_selection: targetSelection }),
            loader: {
                source: options.loaderArgsOverride.length === 0
                    ? "derived"
                    : "configured_override",
                arguments: [...loaderArgs],
            },
        }),
    });
};
/** Ghidra owns these lanes; Hopper names the family it declines rather than guessing. */
const HOPPER_DECLINED_ARCHITECTURE_LABELS = {
    mips: "MIPS",
    riscv: "RISC-V",
    powerpc: "PowerPC",
    hexagon: "Hexagon",
};
export const isHopperDeclinedArchitecture = (architecture) => isElfMetadataArchitecture(architecture) ||
    architecture === "hexagon" ||
    architecture === "arm64_32";
export const hopperDeclinedArchitectureReason = (architecture) => architecture === "arm64_32"
    ? "REA's Hopper adapter has no verified arm64_32 lane."
    : `REA's Hopper adapter does not admit ${HOPPER_DECLINED_ARCHITECTURE_LABELS[architecture]} targets. Select a verified Ghidra ${HOPPER_DECLINED_ARCHITECTURE_LABELS[architecture]} profile instead.`;
/** Derive Hopper's complete non-interactive CLI loader selection. */
export const hopperLoaderArgsForTarget = (target, machoContainer) => {
    if (target.kind === "database")
        return ok([]);
    if (target.kind !== "executable")
        return err(new ProviderAdapterError("hopper", "resolve_analysis_profile"));
    if (target.format === "raw-binary")
        return err(new ProviderAdapterError("hopper", "resolve_analysis_profile"));
    const architecture = target.architecture;
    if (isHopperDeclinedArchitecture(architecture))
        return err(new AnalysisCapabilityUnavailableError("hopper", "resolve_analysis_profile", hopperDeclinedArchitectureReason(architecture)));
    const flag = hopperArchitectureFlag(architecture);
    if (isMachOFormat(target.format)) {
        if (machoContainer === undefined)
            return err(new AnalysisCapabilityUnavailableError("hopper", "resolve_analysis_profile", "Mach-O container kind is unknown; resolve the Hopper analysis profile before starting its client."));
        return ok(machoContainer === "fat32" || machoContainer === "fat64"
            ? ["-l", "FAT", flag, "-l", "Mach-O"]
            : ["-l", "Mach-O", flag]);
    }
    switch (target.format) {
        case "elf":
            return ok(["-l", "ELF", flag]);
        case "pe":
            return ok(["-l", "WinPE", flag]);
        case "dos-mz":
        case "dos-com":
        case "gamecube-dol":
            return err(new ProviderAdapterError("hopper", "resolve_analysis_profile"));
    }
};
const hopperArchitectureFlag = (architecture) => {
    switch (architecture) {
        case "x86":
            return "--intel-32";
        case "x86_64":
            return "--intel-64";
        case "arm":
            return "--armv7";
        case "arm64":
            return "--aarch64";
    }
};
const readMachoMagic = async (path, signal) => {
    if (signalIsAborted(signal))
        return err(new AnalysisCancelledError("open_binary", { cause: signal?.reason }));
    const stream = createReadStream(path, { start: 0, end: 3 });
    const abortError = new Error("Caller cancelled Mach-O header read");
    const onAbort = () => {
        stream.destroy(abortError);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted)
        onAbort();
    try {
        const chunks = [];
        for await (const chunk of stream)
            chunks.push(Buffer.from(chunk));
        if (signalIsAborted(signal))
            return err(new AnalysisCancelledError("open_binary", { cause: signal?.reason }));
        const bytes = Buffer.concat(chunks);
        return bytes.length === 4
            ? ok(bytes.readUInt32BE(0))
            : err(new BinaryTargetError(path, "Mach-O header became truncated before Hopper loader selection"));
    }
    catch (cause) {
        return cause === abortError
            ? err(new AnalysisCancelledError("open_binary", { cause: signal?.reason }))
            : err(new BinaryTargetError(path, `Cannot read the Mach-O container header: ${cause instanceof Error ? cause.message : String(cause)}`, { cause }));
    }
    finally {
        signal?.removeEventListener("abort", onAbort);
    }
};
const sha256File = async (path, signal) => {
    if (signalIsAborted(signal))
        return err(new AnalysisCancelledError("open_binary", { cause: signal?.reason }));
    const stream = createReadStream(path);
    const abortError = new Error("Caller cancelled launcher fingerprint read");
    const onAbort = () => {
        stream.destroy(abortError);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted)
        onAbort();
    try {
        const hash = createHash("sha256");
        for await (const chunk of stream)
            hash.update(chunk);
        return signalIsAborted(signal)
            ? err(new AnalysisCancelledError("open_binary", { cause: signal?.reason }))
            : ok(hash.digest("hex"));
    }
    catch (cause) {
        return cause === abortError
            ? err(new AnalysisCancelledError("open_binary", { cause: signal?.reason }))
            : err(new ProviderAdapterError("hopper", "resolve_analysis_profile", {
                cause,
                userMessage: `Cannot fingerprint the selected Hopper launcher ${path}: ${cause instanceof Error ? cause.message : String(cause)}`,
                remediationAction: "Restore read access to the selected Hopper launcher, then retry provider selection.",
                diagnostics: {
                    launcher_path: path,
                    system_code: cause instanceof Error &&
                        typeof Reflect.get(cause, "code") === "string"
                        ? Reflect.get(cause, "code")
                        : null,
                },
            }));
    }
    finally {
        signal?.removeEventListener("abort", onAbort);
    }
};
const signalIsAborted = (signal) => signal?.aborted === true;
