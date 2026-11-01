import { createPefileReadCompatibility } from "./PefileReadCompatibility.js";
import { setImmediate } from "node:timers/promises";
import { assertArtifactReadActive } from "../../artifacts/ArtifactFileOperation.js";
import { BinaryFormatFailure, BinaryMappingFailure, BinaryReader, BinaryResourceFailure, createFileMappingIndex, imageFileMappings, } from "../metadata/BinaryContainer.js";
import { readPeImage } from "../metadata/PeImage.js";
import { MAX_INSPECT_PE_IMPORT_RETAINED_TEXT_BYTES, } from "../../domain/native/peImports.js";
import { IMPORT_DESCRIPTOR_BYTES, PEFILE_MAX_IMPORT_SYMBOLS, pefileImphash, } from "./pefileImphash.js";
const PE_IMPORT_DIRECTORY = 1;
const PE_DELAY_IMPORT_DIRECTORY = 13;
const DELAY_DESCRIPTOR_BYTES = 32;
const MAXIMUM_NAME_BYTES = 4096;
/** Table entries decoded between event-loop yields and cancellation checks. */
const ENTRIES_PER_YIELD = 1024;
const ORDINAL_FLAG32 = 0x80000000n;
const ORDINAL_FLAG64 = 0x8000000000000000n;
const PE_RVA_END = 0x100000000;
/** PE32+ keeps 32-bit RVAs even though preferred virtual addresses are 64-bit. */
const fitsRva = (rva, size) => Number.isSafeInteger(rva) &&
    rva >= 0 &&
    Number.isSafeInteger(size) &&
    size > 0 &&
    rva <= PE_RVA_END - size;
const requireRva = (rva, size) => {
    if (!fitsRva(rva, size))
        throw new BinaryFormatFailure("malformed", `PE RVA ${hex(rva)} span of ${String(size)} bytes extends beyond the 32-bit RVA space`);
};
const PE_LIMITATIONS = [
    "Rows reproduce the PE import and delay-load directories; they do not establish that an import is bound, forwarded or reachable at runtime.",
    "Bound import snapshots, the import address table as loaded, and export-forward resolution in another DLL remain unobserved.",
];
/** Structured parser allowance refusal; consumers branch on `limit`, never on prose. */
export class PeImportLimitFailure extends BinaryResourceFailure {
    limit;
    allowance;
    constructor(limit, allowance, message) {
        super("structure", allowance, message);
        this.limit = limit;
        this.allowance = allowance;
        this.name = "PeImportLimitFailure";
    }
}
const hex = (value) => `0x${value.toString(16)}`;
const dllBudget = (count, max) => {
    if (count > max)
        throw new PeImportLimitFailure("dlls", max, `Import inventory declares ${String(count)} descriptors, above the ${String(max)}-entry DLL allowance`);
};
const functionBudget = (count, max) => {
    if (count > max)
        throw new PeImportLimitFailure("functions", max, `Import inventory declares ${String(count)} functions, above the ${String(max)}-entry function allowance`);
};
const createRetention = () => {
    let text = 0;
    return (value) => {
        text += value.length;
        if (text > MAX_INSPECT_PE_IMPORT_RETAINED_TEXT_BYTES)
            throw new PeImportLimitFailure("retained_text", MAX_INSPECT_PE_IMPORT_RETAINED_TEXT_BYTES, `Import names exceed the fixed ${String(MAX_INSPECT_PE_IMPORT_RETAINED_TEXT_BYTES)}-byte retained-text allowance`);
    };
};
const failureMessage = (cause) => {
    if (cause instanceof BinaryFormatFailure)
        return cause.message;
    throw cause;
};
/** Append one consumed file span, merging it into the previous span when contiguous. */
const consume = (spans, offset, bytes) => {
    const last = spans.at(-1);
    if (last !== undefined && last.offset + last.bytes === offset)
        last.bytes += bytes;
    else
        spans.push({ offset, bytes });
};
const coverage = (issues, examinedDlls, imports, delayImports) => issues.length === 0
    ? {
        status: "complete",
        reason: null,
        examined_dlls: examinedDlls,
        imports,
        delay_imports: delayImports,
    }
    : {
        status: "partial",
        reason: `${String(issues.length)} import table issue(s) affect reported rows or metadata; see issues`,
        examined_dlls: examinedDlls,
        imports,
        delay_imports: delayImports,
    };
/**
 * Read PE import and delay-load directories without executing the image.
 * Yields to the event loop and honors cancellation every
 * `ENTRIES_PER_YIELD` descriptors or thunks.
 */
export const parsePeImports = async (bytes, artifact, input, signal) => {
    assertArtifactReadActive(signal);
    const image = readPeImage(bytes);
    const bits = image.bits;
    const base = image.image_base;
    const reader = new BinaryReader(bytes, true);
    const lookup = createFileMappingIndex(imageFileMappings(image), image.zero_fills);
    const compatibleRead = createPefileReadCompatibility(image, bytes.length);
    let mappingCompatibility = true;
    const map = (rva, size) => {
        requireRva(rva, size);
        const offset = lookup.offset(base + BigInt(rva), size);
        mappingCompatibility &&= compatibleRead(rva, size, offset);
        return offset;
    };
    const format = bits === 64 ? "pe32-plus" : "pe32";
    const result = {
        artifact,
        format,
        machine: image.pe_machine,
        bits,
        architecture: image.architecture,
    };
    const issues = [];
    const admitRva = (rva, size, label) => {
        if (fitsRva(rva, size))
            return true;
        issues.push({
            code: "malformed_entry",
            location: hex(rva),
            message: `${label} span of ${String(size)} bytes extends beyond the 32-bit RVA space`,
        });
        return false;
    };
    const mapDescriptor = (rva, size, label) => {
        if (!admitRva(rva, size, label))
            return null;
        try {
            return map(rva, size);
        }
        catch (cause) {
            if (!(cause instanceof BinaryMappingFailure))
                throw cause;
            issues.push({
                code: "descriptor_unreadable",
                location: hex(rva),
                message: `${label}: ${cause.message}`,
            });
            return null;
        }
    };
    const retain = createRetention();
    let examinedDlls = 0;
    let examinedFunctions = 0;
    let entries = 0;
    const checkpoint = async () => {
        entries += 1;
        if (entries % ENTRIES_PER_YIELD !== 0)
            return;
        await setImmediate();
        assertArtifactReadActive(signal);
    };
    const cString = (rva) => {
        requireRva(rva, 1);
        const raw = lookup.readCString(bytes, base + BigInt(rva), Math.min(MAXIMUM_NAME_BYTES, PE_RVA_END - rva - 1));
        if (raw.length === 0)
            throw new BinaryFormatFailure("malformed", `Import name at RVA ${hex(rva)} is empty`);
        // CString decoding may span physically discontiguous sections. A pefile
        // hash is only justified when its single-section read sees the whole name.
        if (mappingCompatibility) {
            try {
                const size = raw.length + 1;
                const offset = lookup.offset(base + BigInt(rva), size);
                mappingCompatibility = compatibleRead(rva, size, offset);
            }
            catch (cause) {
                if (!(cause instanceof BinaryFormatFailure))
                    throw cause;
                mappingCompatibility = false;
            }
        }
        return raw.toString("latin1");
    };
    const readName = (rva, label) => {
        try {
            const name = cString(rva);
            retain(name);
            return name;
        }
        catch (cause) {
            issues.push({
                code: "name_unreadable",
                location: hex(rva),
                message: `${label}: ${failureMessage(cause)}`,
            });
            return null;
        }
    };
    const readFunctions = async (nameTableRva, addressTableRva) => {
        const thunkWidth = bits === 64 ? 8 : 4;
        const ordinalFlag = bits === 64 ? ORDINAL_FLAG64 : ORDINAL_FLAG32;
        const functions = [];
        for (let index = 0;; index++) {
            await checkpoint();
            const nameRva = nameTableRva + index * thunkWidth;
            const iatRva = addressTableRva + index * thunkWidth;
            if (!admitRva(nameRva, thunkWidth, "Import lookup table"))
                break;
            let thunk;
            try {
                thunk = reader.word(map(nameRva, thunkWidth), bits);
            }
            catch (cause) {
                issues.push({
                    code: "thunk_unreadable",
                    location: hex(nameRva),
                    message: failureMessage(cause),
                });
                break;
            }
            if (thunk === 0n)
                break;
            if (!admitRva(iatRva, thunkWidth, "Import address table"))
                break;
            examinedFunctions += 1;
            functionBudget(examinedFunctions, input.max_functions);
            const thunkHex = thunk.toString(16);
            if ((thunk & ordinalFlag) !== 0n) {
                functions.push({
                    hint: null,
                    name: null,
                    ordinal: Number(thunk & 0xffffn),
                    ilt_rva: nameTableRva === addressTableRva ? null : nameRva,
                    iat_rva: iatRva,
                    thunk_hex: thunkHex,
                });
                continue;
            }
            if (thunk > 0x7fffffffn) {
                issues.push({
                    code: "malformed_entry",
                    location: `0x${thunkHex}`,
                    message: "A named import thunk uses bits outside its 31-bit hint/name RVA",
                });
                continue;
            }
            const hintNameRva = Number(thunk);
            try {
                const hintAt = map(hintNameRva, 3);
                const hint = reader.u16(hintAt);
                const name = cString(hintNameRva + 2);
                retain(name);
                functions.push({
                    hint,
                    name,
                    ordinal: null,
                    ilt_rva: nameTableRva === addressTableRva ? null : nameRva,
                    iat_rva: iatRva,
                    thunk_hex: thunkHex,
                });
            }
            catch (cause) {
                issues.push({
                    code: "name_unreadable",
                    location: hex(hintNameRva),
                    message: failureMessage(cause),
                });
            }
        }
        return functions;
    };
    // pefile counts every ILT and IAT thunk iteration against one image-wide cap
    // and silently truncates tables past it. Replay that count (reading IAT
    // entries only until the cap) to know when its import hash covers a prefix.
    let pefileThunkReads = 0;
    let pefileTruncatedDescriptor = null;
    const pefileTableWalk = (rva, entries) => {
        const width = bits === 64 ? 8 : 4;
        let processed = 0;
        for (let index = 0;; index++) {
            if (pefileThunkReads > PEFILE_MAX_IMPORT_SYMBOLS)
                break;
            pefileThunkReads += 1;
            if (entries !== null) {
                if (index === entries)
                    break;
            }
            else {
                let word;
                try {
                    word = reader.word(map(rva + index * width, width), bits);
                }
                catch (cause) {
                    if (!(cause instanceof BinaryFormatFailure))
                        throw cause;
                    break;
                }
                if (word === 0n)
                    break;
            }
            processed += 1;
        }
        return processed;
    };
    const replayPefileSymbolCap = (index, originalFirstThunk, firstThunk, entries) => {
        const table = originalFirstThunk === 0
            ? pefileTableWalk(firstThunk, entries)
            : pefileTableWalk(originalFirstThunk, entries);
        if (originalFirstThunk !== 0)
            pefileTableWalk(firstThunk, null);
        if (table < entries)
            pefileTruncatedDescriptor ??= index;
    };
    const missingTable = (descriptorRva, message) => {
        issues.push({
            code: "malformed_entry",
            location: hex(descriptorRva),
            message,
        });
        return [];
    };
    const importDirectory = image.pe_data_directories?.[PE_IMPORT_DIRECTORY];
    const delayDirectory = image.pe_data_directories?.[PE_DELAY_IMPORT_DIRECTORY];
    const imports = [];
    let importDirectoryResult = null;
    if (importDirectory !== undefined && importDirectory.address !== 0) {
        const spans = [];
        for (let index = 0;; index++) {
            await checkpoint();
            const descriptorRva = importDirectory.address + index * IMPORT_DESCRIPTOR_BYTES;
            const descriptor = mapDescriptor(descriptorRva, IMPORT_DESCRIPTOR_BYTES, "Import descriptor");
            if (descriptor === null)
                break;
            consume(spans, descriptor, IMPORT_DESCRIPTOR_BYTES);
            const originalFirstThunk = reader.u32(descriptor);
            const timeDateStamp = reader.u32(descriptor + 4);
            const forwarderChain = reader.u32(descriptor + 8);
            const nameRva = reader.u32(descriptor + 12);
            const firstThunk = reader.u32(descriptor + 16);
            if (originalFirstThunk === 0 &&
                timeDateStamp === 0 &&
                forwarderChain === 0 &&
                nameRva === 0 &&
                firstThunk === 0)
                break;
            examinedDlls += 1;
            dllBudget(examinedDlls, input.max_dlls);
            const name = readName(nameRva, "Import descriptor DLL name");
            const functions = firstThunk === 0
                ? missingTable(descriptorRva, originalFirstThunk === 0
                    ? "Import descriptor declares neither a lookup table nor an import address table (FirstThunk is zero); its functions are unknown"
                    : `Import descriptor has a zero FirstThunk (import address table RVA); its lookup table at ${hex(originalFirstThunk)} is not decoded`)
                : await readFunctions(originalFirstThunk === 0 ? firstThunk : originalFirstThunk, firstThunk);
            if (firstThunk !== 0)
                replayPefileSymbolCap(index, originalFirstThunk, firstThunk, functions.length);
            imports.push({
                index,
                name,
                name_rva: nameRva,
                original_first_thunk_rva: originalFirstThunk,
                first_thunk_rva: firstThunk,
                time_date_stamp: timeDateStamp,
                forwarder_chain: forwarderChain,
                location: {
                    offset: descriptor,
                    bytes: IMPORT_DESCRIPTOR_BYTES,
                },
                functions,
            });
        }
        importDirectoryResult = {
            rva: importDirectory.address,
            size: importDirectory.size,
            locations: spans,
        };
    }
    const standardIssues = issues.length;
    const standardMappingCompatibility = mappingCompatibility;
    const delayImports = [];
    let delayDirectoryResult = null;
    if (delayDirectory !== undefined && delayDirectory.address !== 0) {
        const spans = [];
        for (let index = 0;; index++) {
            await checkpoint();
            const descriptorRva = delayDirectory.address + index * DELAY_DESCRIPTOR_BYTES;
            const descriptor = mapDescriptor(descriptorRva, DELAY_DESCRIPTOR_BYTES, "Delay-load descriptor");
            if (descriptor === null)
                break;
            consume(spans, descriptor, DELAY_DESCRIPTOR_BYTES);
            const attributes = reader.u32(descriptor);
            const nameRva = reader.u32(descriptor + 4);
            const moduleHandleRva = reader.u32(descriptor + 8);
            const importAddressTableRva = reader.u32(descriptor + 12);
            const importNameTableRva = reader.u32(descriptor + 16);
            const boundImportRva = reader.u32(descriptor + 20);
            const unloadInformationTableRva = reader.u32(descriptor + 24);
            const timeDateStamp = reader.u32(descriptor + 28);
            if (attributes === 0 &&
                nameRva === 0 &&
                moduleHandleRva === 0 &&
                importAddressTableRva === 0 &&
                importNameTableRva === 0 &&
                boundImportRva === 0 &&
                unloadInformationTableRva === 0 &&
                timeDateStamp === 0)
                break;
            examinedDlls += 1;
            dllBudget(examinedDlls, input.max_dlls);
            if ((attributes & 1) === 0) {
                issues.push({
                    code: "unsupported_form",
                    location: hex(descriptorRva),
                    message: "Delay-load descriptor uses virtual addresses rather than RVAs; those entries are not decoded",
                });
                continue;
            }
            const name = readName(nameRva, "Delay-load DLL name");
            delayImports.push({
                index,
                name,
                name_rva: nameRva,
                attributes,
                import_address_table_rva: importAddressTableRva,
                import_name_table_rva: importNameTableRva,
                bound_import_rva: boundImportRva,
                unload_information_table_rva: unloadInformationTableRva,
                module_handle_rva: moduleHandleRva,
                time_date_stamp: timeDateStamp,
                location: { offset: descriptor, bytes: DELAY_DESCRIPTOR_BYTES },
                functions: importAddressTableRva === 0
                    ? missingTable(descriptorRva, "Delay-load descriptor has a zero import address table RVA; its functions are not decoded")
                    : importNameTableRva === 0
                        ? missingTable(descriptorRva, "Delay-load descriptor has a zero import name table RVA; its address table holds loader thunks rather than names, so its functions are not decoded")
                        : await readFunctions(importNameTableRva, importAddressTableRva),
            });
        }
        delayDirectoryResult = {
            rva: delayDirectory.address,
            size: delayDirectory.size,
            locations: spans,
        };
    }
    const limitations = importDirectoryResult === null
        ? [
            "IMAGE_DIRECTORY_ENTRY_IMPORT is absent. That is not proof the image never imported APIs through another table or overlay.",
            ...PE_LIMITATIONS,
        ]
        : PE_LIMITATIONS;
    return {
        ...result,
        import_directory: importDirectoryResult,
        delay_import_directory: delayDirectoryResult,
        imports,
        delay_imports: delayImports,
        imphash: pefileImphash(imports, {
            standardIssues,
            mappingCompatibility: standardMappingCompatibility,
            truncatedDescriptor: pefileTruncatedDescriptor,
            bits,
            directoryRva: importDirectory?.address ?? 0,
            fileBytes: bytes.length,
        }),
        coverage: coverage(issues, examinedDlls, imports.reduce((count, dll) => count + dll.functions.length, 0), delayImports.reduce((count, dll) => count + dll.functions.length, 0)),
        issues,
        limitations,
    };
};
