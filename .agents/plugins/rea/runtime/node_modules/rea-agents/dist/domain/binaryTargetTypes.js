/** Provider-neutral CPU families detected from headers or explicitly selected raw loads. */
export const BINARY_ARCHITECTURES = [
    "x86",
    "x86_64",
    "arm",
    "arm64",
    "arm64_32",
    "mips",
    "6502",
    "riscv",
    "powerpc",
    "m68k",
    "hexagon",
];
/**
 * Families admitted only by explicit raw-binary selection. Header detection
 * never yields them, so detected targets and Evidence subjects exclude them.
 */
export const RAW_ONLY_ARCHITECTURES = [
    "6502",
    "m68k",
];
/** Families whose parsed target variant carries `ElfFamilyMetadata`. */
export const ELF_METADATA_ARCHITECTURES = [
    "mips",
    "riscv",
    "powerpc",
];
/** Families whose ISA and ABI need a separate ELF declaration to be admitted. */
export const isElfMetadataArchitecture = (architecture) => ELF_METADATA_ARCHITECTURES.includes(architecture);
/** Whether an executable target contains a thin or universal Mach-O image. */
export const isMachOFormat = (format) => format === "mach-o" || format === "mach-o-universal";
