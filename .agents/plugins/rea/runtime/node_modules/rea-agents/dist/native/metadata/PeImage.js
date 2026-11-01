import { readPeOptionalHeader } from "../../domain/peMachine.js";
import { readPeSectionHeader } from "./NativeSectionDirectory.js";
import { mzWindowsHeaderLayoutLimitation, parseMzHeaderEvidence, } from "../../domain/dosMz.js";
import { declaredFileRange, BinaryFormatFailure, BinaryReader, } from "./BinaryContainer.js";
const peHeaderOffset = (reader) => {
    const evidence = parseMzHeaderEvidence(reader.bytes);
    const { windowsHeader } = evidence;
    if (windowsHeader.state === "candidate")
        throw new BinaryFormatFailure("unsupported", "MZ Windows new-header candidate is unresolved");
    if (windowsHeader.state !== "declared") {
        const dos = evidence.dos;
        if (!dos.ok)
            throw new BinaryFormatFailure("malformed", dos.error);
        throw new BinaryFormatFailure("unsupported", "DOS MZ images are outside the supported ELF, PE and thin Mach-O formats");
    }
    const { offset: pe } = windowsHeader;
    const limitation = mzWindowsHeaderLayoutLimitation(windowsHeader);
    if (limitation !== undefined)
        throw new BinaryFormatFailure("unsupported", limitation);
    reader.range(pe, 24, "PE signature and COFF header");
    if (["NE", "LE", "LX"].includes(windowsHeader.signature))
        throw new BinaryFormatFailure("unsupported", `${windowsHeader.signature} images are outside the supported ELF, PE and thin Mach-O formats`);
    if (windowsHeader.signature !== "PE")
        throw new BinaryFormatFailure("malformed", "PE signature is invalid or overlaps the DOS header");
    return pe;
};
/** Read PE32/PE32+ native image mappings and section facts. */
export const readPeImage = (bytes) => {
    const reader = new BinaryReader(bytes, true);
    const pe = peHeaderOffset(reader);
    const optional = pe + 24;
    const optionalSize = reader.u16(pe + 20);
    const machine = reader.u16(pe + 4);
    const facts = readPeOptionalHeader(reader.range(optional, optionalSize, "PE optional header"), machine);
    if (!facts.ok)
        throw new BinaryFormatFailure(facts.error.kind, facts.error.message);
    const { bits, dataDirectories, sizeOfHeaders } = facts.value;
    const imageBase = reader.word(optional + (bits === 64 ? 24 : 28), bits);
    const fileAlignment = reader.u32(optional + 36);
    const headerMapping = {
        address: imageBase,
        offset: 0,
        size: Math.min(sizeOfHeaders, bytes.length),
    };
    const count = reader.u16(pe + 6);
    const start = reader.table(BigInt(optional + optionalSize), count, 40, "PE sections");
    const mappings = [];
    const executableMappings = [];
    const zeroFills = [];
    const sections = [];
    for (let index = 0; index < count; index++) {
        const entry = start + index * 40;
        const { name: sectionName, virtual_size: virtualSize, virtual_address: virtualAddress, raw_size: size, offset, characteristics, size: contentSize, } = readPeSectionHeader(reader.range(entry, 40, "PE section header"));
        sections.push(peImageSection({
            reader,
            name: sectionName,
            size: contentSize,
            offset,
            characteristics,
            virtualAddress,
            virtualSize,
            rawSize: size,
            fileAlignment,
        }));
        const address = imageBase + BigInt(virtualAddress);
        if (address + BigInt(Math.max(size, virtualSize)) > 1n << BigInt(bits))
            throw new BinaryFormatFailure("malformed", "PE section virtual address overflows its address width");
        const mapping = {
            ...(size === 0
                ? { offset: 0, size: 0 }
                : reader.fileRange(BigInt(offset), BigInt(size), "PE section")),
            address,
        };
        if (size !== 0) {
            mappings.push(mapping);
            if ((characteristics & 0x20000000) !== 0)
                executableMappings.push({ ...mapping, size: contentSize });
        }
        if (virtualSize > size)
            zeroFills.push({
                address: address + BigInt(size),
                size: BigInt(virtualSize - size),
            });
    }
    const architecture = facts.value.machine?.architecture;
    return {
        format: "pe",
        image_base: imageBase,
        pe_machine: machine,
        pe_section_alignment: reader.u32(optional + 32),
        pe_file_alignment: fileAlignment,
        pe_data_directories: dataDirectories,
        pe_header_mapping: headerMapping,
        architecture: architecture === "x86"
            ? "386"
            : architecture === "x86_64"
                ? "amd64"
                : (architecture ?? `pe-machine-${machine}`),
        bits,
        byte_order: "little",
        mappings,
        executable_mappings: executableMappings,
        zero_fills: zeroFills,
        sections,
    };
};
const peImageSection = ({ reader, name, size, offset, characteristics, virtualAddress, virtualSize, rawSize, fileAlignment, }) => {
    const range = declaredFileRange(reader.bytes.length, BigInt(offset), BigInt(size));
    const readOnly = range.file_backed &&
        (characteristics & 0x40000000) !== 0 &&
        (characteristics & 0x80000000) === 0 &&
        (characteristics & 0x20000000) === 0 &&
        (characteristics & 0x40) !== 0;
    return {
        format: "pe",
        name,
        virtual_address: virtualAddress,
        virtual_size: virtualSize,
        raw_size: rawSize,
        raw_offset: offset,
        file_alignment: fileAlignment,
        characteristics,
        ...range,
        read_only: readOnly,
        compressed: false,
    };
};
