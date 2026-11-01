import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { err, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { decodePeMachine, init_elfFixedHeader, init_peMachine, readElfFixedHeader, readPeOptionalHeader } from "./peMachine-BoMBJgsB.js";
import { MachoLoadCommandCursor, classifyFatContainerIdentity, init_machoContainer, init_machoLoadCommands, readFatContainerHeader, readMachoHeaderPrefixFacts, readMachoLoadCommandTableHeader, validateFatSliceIdentity } from "./machoLoadCommands-CChRRK2_.js";

//#region dist/domain/dosMz.js
var dosMzImageByteLength, mzWindowsHeaderLayoutLimitation, observeMzWindowsHeader, windowsHeaderSignature, parseDosMzHeader, parseMzHeaderEvidence, validateRelocations;
function init_dosMz() {
	return (init_dosMz = __esmMin((() => {
		init_result();
		dosMzImageByteLength = (bytes) => {
			if (bytes.length < 28 || bytes.toString("latin1", 0, 2) !== "MZ") return err("invalid or truncated DOS MZ header");
			const lastPageBytes = bytes.readUInt16LE(2);
			const pages = bytes.readUInt16LE(4);
			if (pages === 0 || lastPageBytes > 511) return err("invalid DOS MZ page count or final-page size");
			return ok((pages - 1) * 512 + (lastPageBytes === 0 ? 512 : lastPageBytes));
		};
		mzWindowsHeaderLayoutLimitation = (header) => header.offset < 64 ? `Unsupported overlapping ${header.signature} header at file offset ${String(header.offset)}; this reader requires the Windows header outside the 64-byte DOS header` : undefined;
		observeMzWindowsHeader = (bytes, fileSize = bytes.length, signatureEvidence) => {
			if (bytes.length < 64) return fileSize >= 64 ? { state: "header-needed" } : { state: "absent" };
			const headerBytes = bytes.readUInt16LE(8) * 16;
			const relocationCount = bytes.readUInt16LE(6);
			const tableStart = bytes.readUInt16LE(24);
			const tableEnd = tableStart + relocationCount * 4;
			if (headerBytes !== 0 && relocationCount > 0 && tableStart < 64 && tableEnd > 60) return { state: "absent" };
			const offset = bytes.readUInt32LE(60);
			if (offset === 0) return { state: "absent" };
			const inlineSignature = offset < bytes.length ? bytes.subarray(offset, Math.min(offset + 4, bytes.length)) : undefined;
			const available = signatureEvidence?.offset === offset ? signatureEvidence.bytes : inlineSignature;
			const signature = windowsHeaderSignature(available);
			if (signature !== "other" && signature !== "unobserved") return {
				state: "declared",
				offset,
				signature
			};
			if (headerBytes >= 64 && relocationCount > 0 && tableEnd <= 60 && (signature === "other" || fileSize - offset < 2)) return { state: "absent" };
			if (headerBytes === 0 || headerBytes >= 64) {
				const remaining = fileSize - offset;
				const needsMore = available === undefined && remaining >= 2 || available !== undefined && available.length < 2 && remaining >= 2 || available !== undefined && available.length >= 2 && available.toString("latin1", 0, 2) === "PE" && available.length < 4 && remaining >= 4;
				if (needsMore && signatureEvidence?.offset !== offset) return {
					state: "signature-needed",
					offset
				};
				return {
					state: "candidate",
					offset,
					signature
				};
			}
			if (signature === "other") return { state: "absent" };
			const observedPePrefix = available !== undefined && available.length >= 2 && available.toString("latin1", 0, 2) === "PE";
			if (fileSize - offset < (observedPePrefix ? 4 : 2)) return { state: "absent" };
			return {
				state: "signature-needed",
				offset
			};
		};
		windowsHeaderSignature = (bytes) => {
			if (bytes === undefined || bytes.length < 2) return "unobserved";
			const first = bytes[0];
			const second = bytes[1];
			if (first === 78 && second === 69) return "NE";
			if (first === 76 && second === 69) return "LE";
			if (first === 76 && second === 88) return "LX";
			if (first !== 80 || second !== 69) return "other";
			if (bytes.length < 4) return "unobserved";
			return bytes[2] === 0 && bytes[3] === 0 ? "PE" : "other";
		};
		parseDosMzHeader = (bytes, fileSize = bytes.length) => {
			if (bytes.length < 28 || bytes.toString("latin1", 0, 2) !== "MZ") return err("invalid or truncated DOS MZ header");
			if (!Number.isSafeInteger(fileSize) || fileSize < bytes.length) return err("invalid DOS MZ file length");
			const extent = dosMzImageByteLength(bytes);
			if (!extent.ok) return extent;
			const imageBytes = extent.value;
			const headerBytes = bytes.readUInt16LE(8) * 16;
			if (headerBytes < 28 || headerBytes >= imageBytes) return err("invalid DOS MZ header size or empty load module");
			if (imageBytes > fileSize) return err("truncated DOS MZ load module");
			const relocationCount = bytes.readUInt16LE(6);
			const relocationTableOffset = bytes.readUInt16LE(24);
			const tableEnd = relocationTableOffset + relocationCount * 4;
			if (relocationCount > 0 && (relocationTableOffset < 28 || tableEnd > headerBytes)) return err("DOS MZ relocation table lies outside its header");
			if (relocationCount > 0 && tableEnd > bytes.length) return err("truncated DOS MZ relocation table");
			const moduleBytes = imageBytes - headerBytes;
			const relocations = validateRelocations(bytes, relocationTableOffset, relocationCount, moduleBytes);
			if (!relocations.ok) return relocations;
			const entryOffset = bytes.readUInt16LE(20);
			const entrySegment = bytes.readUInt16LE(22);
			if (entrySegment * 16 + entryOffset >= moduleBytes) return err("DOS MZ entry point lies outside its initialized load module");
			return ok({
				headerBytes,
				imageBytes,
				moduleBytes,
				overlayBytes: fileSize - imageBytes,
				relocationCount,
				relocationTableOffset,
				entrySegment,
				entryOffset
			});
		};
		parseMzHeaderEvidence = (bytes, fileSize = bytes.length, signatureEvidence) => ({
			dos: parseDosMzHeader(bytes, fileSize),
			windowsHeader: observeMzWindowsHeader(bytes, fileSize, signatureEvidence)
		});
		validateRelocations = (bytes, relocationTableOffset, relocationCount, moduleBytes) => {
			for (let index = 0; index < relocationCount; index += 1) {
				const record = relocationTableOffset + index * 4;
				const offset = bytes.readUInt16LE(record);
				const segment = bytes.readUInt16LE(record + 2);
				if (segment * 16 + offset + 2 > moduleBytes) return err(`DOS MZ relocation ${index} points outside its load module`);
			}
			return ok(undefined);
		};
	})))();
}

//#endregion
//#region dist/domain/binaryTarget.js
var claimsExecutableHeader, parseExecutableHeader, CPU_TYPE_ARM64_32, parseThinMachO, validatedFatDeclarations, declaredFamilies, readFatArchitectureFamilies, parseFatMachO, fatSliceIdentityError, fatHostArchitecture, fatIdentityError, parseElf, parseMz, parsePeRecord, parseCodeViewData, peDebugDirectoryEntry, peRvaToFileOffset, parsePeCodeViewFromBuffer, machArchitecture;
function init_binaryTarget() {
	return (init_binaryTarget = __esmMin((() => {
		init_result();
		init_elfFixedHeader();
		init_dosMz();
		init_peMachine();
		init_machoContainer();
		init_machoLoadCommands();
		claimsExecutableHeader = (bytes, fileSize = bytes.length) => bytes.length >= 4 && (bytes.subarray(0, 4).equals(Buffer.from([
			127,
			69,
			76,
			70
		])) || [
			4277009102,
			4277009103,
			3472551422,
			3489328638
		].includes(bytes.readUInt32BE(0))) || bytes.length >= 2 && bytes[0] === 77 && bytes[1] === 90 || readFatContainerHeader(bytes, fileSize).state !== "not-fat";
		parseExecutableHeader = (bytes, hostArchitecture, fileSize = bytes.length, mzWindowsHeaderSignature, fatEvidence) => {
			if (bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from([
				127,
				69,
				76,
				70
			]))) return parseElf(bytes, fileSize);
			if (bytes.length >= 2 && bytes[0] === 77 && bytes[1] === 90) return parseMz(bytes, fileSize, mzWindowsHeaderSignature);
			if (bytes.length < 8) return err("truncated or unsupported binary header");
			const magic = bytes.readUInt32BE(0);
			if ([
				4277009102,
				4277009103,
				3472551422,
				3489328638
			].includes(magic)) return parseThinMachO(bytes, fileSize);
			const fatHeader = fatEvidence?.header ?? readFatContainerHeader(bytes, fileSize);
			if (fatHeader.state !== "not-fat") return parseFatMachO(bytes, hostArchitecture, fatHeader, fatEvidence);
			return err("unsupported binary format");
		};
		CPU_TYPE_ARM64_32 = 33554444;
		parseThinMachO = (bytes, fileSize) => {
			const table = readMachoLoadCommandTableHeader(bytes, fileSize);
			if (!table.ok) return table;
			if (table.value === null) return err("unsupported binary format");
			const identity = readMachoHeaderPrefixFacts(bytes.subarray(0, 12)).identity;
			if (identity === null) return err("unsupported Mach-O architecture");
			const architecture = identity.cpuType === CPU_TYPE_ARM64_32 ? "arm64_32" : machArchitecture(identity.cpuType);
			if (architecture === undefined) return err("unsupported Mach-O architecture");
			const commands = new MachoLoadCommandCursor(table.value);
			while (commands.nextOffset !== null) {
				const offset = table.value.headerSize + commands.nextOffset;
				if (offset + 8 > bytes.length && commands.nextOffset + 8 <= table.value.commandBytes) break;
				const frame = commands.read(bytes.subarray(offset, offset + 8));
				if (!frame.ok) return frame;
			}
			if (commands.nextOffset === null) {
				const complete = commands.finish();
				if (!complete.ok) return complete;
			}
			if (architecture === "arm64_32") return ok({
				format: "mach-o",
				architecture,
				availableArchitectures: [architecture]
			});
			return ok({
				format: "mach-o",
				architecture,
				availableArchitectures: [architecture]
			});
		};
		validatedFatDeclarations = (bytes, header, fatEvidence) => {
			if (header.state === "needs-data") return err("truncated or invalid FAT architecture table");
			if (header.state === "malformed") return err(header.reason);
			const identityError = fatIdentityError(bytes, header, fatEvidence?.sliceHeadersByOffset);
			if (identityError !== null) return err(identityError);
			const sliceIdentityError = fatSliceIdentityError(bytes, header, fatEvidence?.sliceHeadersByOffset);
			if (sliceIdentityError !== null) return err(sliceIdentityError);
			return ok(header.slices.flatMap((declaration) => {
				const architecture = machArchitecture(declaration.cpuType);
				return architecture === undefined ? [] : [{
					architecture,
					offset: declaration.offset,
					size: declaration.size
				}];
			}));
		};
		declaredFamilies = (declarations) => [...new Set(declarations.map(({ architecture }) => architecture))];
		readFatArchitectureFamilies = (bytes, fileSize = bytes.length) => {
			const header = readFatContainerHeader(bytes, fileSize);
			if (header.state === "not-fat") return null;
			const declarations = validatedFatDeclarations(bytes, header);
			return declarations.ok ? ok(declaredFamilies(declarations.value)) : declarations;
		};
		parseFatMachO = (bytes, host, header, fatEvidence) => {
			const validated = validatedFatDeclarations(bytes, header, fatEvidence);
			if (!validated.ok) return validated;
			const declarations = validated.value;
			const preferred = fatHostArchitecture(host);
			const hostSlice = declarations.find(({ architecture }) => architecture === preferred);
			const unambiguous = declarations.filter(({ architecture }) => declarations.filter((other) => other.architecture === architecture).length === 1);
			const candidates = hostSlice === undefined ? unambiguous : [hostSlice];
			const selected = candidates.find(({ architecture, size }) => size >= (architecture === "arm64" || architecture === "x86_64" ? 32 : 28));
			if (selected === undefined) {
				const first = candidates[0];
				if (first !== undefined) return err(`FAT slice for ${first.architecture} is shorter than its Mach-O header`);
				return err(declarations.length === 0 ? "FAT binary declares no supported Mach-O architecture" : `FAT binary has no ${host} slice and no foreign architecture declared exactly once`);
			}
			return ok({
				format: "mach-o-universal",
				architecture: selected.architecture,
				availableArchitectures: declaredFamilies(declarations),
				universalSlice: {
					offset: selected.offset,
					size: selected.size
				}
			});
		};
		fatSliceIdentityError = (bytes, header, sliceHeadersByOffset) => {
			for (let index = 0; index < header.slices.length; index += 1) {
				const declaration = header.slices[index];
				if (declaration === undefined || header.rangeIssues[index] !== null) continue;
				let facts;
				if (sliceHeadersByOffset?.has(declaration.offset)) {
					facts = sliceHeadersByOffset.get(declaration.offset);
				} else if (declaration.size >= 12 && declaration.offset <= bytes.length - 12) {
					facts = readMachoHeaderPrefixFacts(bytes.subarray(declaration.offset, declaration.offset + 12));
				}
				const identity = facts?.identity;
				if (identity === null || identity === undefined) return `FAT architecture ${declaration.index} thin Mach-O CPU identity is outside the bounded header`;
				const identityError = validateFatSliceIdentity(declaration, identity);
				if (identityError !== null) return identityError;
			}
			return null;
		};
		fatHostArchitecture = (host) => {
			switch (host) {
				case "arm64": return "arm64";
				case "x64": return "x86_64";
				case "ia32": return "x86";
				case "arm": return "arm";
				default: return undefined;
			}
		};
		fatIdentityError = (bytes, header, sliceHeadersByOffset) => {
			const identity = classifyFatContainerIdentity(header, (offset) => {
				if (sliceHeadersByOffset?.has(offset)) return sliceHeadersByOffset.get(offset)?.magic;
				const slice = header.slices.find((candidate) => candidate.offset === offset);
				if (slice === undefined || offset >= bytes.length) return undefined;
				const available = Math.max(0, Math.min(slice.size, bytes.length - offset, 12));
				return readMachoHeaderPrefixFacts(bytes.subarray(offset, offset + available)).magic;
			});
			if (identity.state === "needs-slice-header") return "FAT slice identity is outside the bounded prefix";
			if (identity.state === "not-mach-o") return "unsupported binary format";
			if (identity.state === "malformed") return identity.reason;
			return null;
		};
		parseElf = (bytes, fileSize) => {
			const fixedHeader = readElfFixedHeader(bytes, fileSize);
			if (!fixedHeader.ok) return fixedHeader;
			const { elfClass, byteOrder, architecture } = fixedHeader.value;
			const little = byteOrder === "little";
			if (architecture === null) return err("unsupported ELF architecture");
			if (architecture === "mips" || architecture === "riscv" || architecture === "powerpc") {
				const flagsOffset = elfClass === 32 ? 36 : 48;
				const metadata = {
					elfClass,
					byteOrder: little ? "little" : "big",
					type: little ? bytes.readUInt16LE(16) : bytes.readUInt16BE(16),
					flags: little ? bytes.readUInt32LE(flagsOffset) : bytes.readUInt32BE(flagsOffset)
				};
				if (architecture === "powerpc") return ok({
					format: "elf",
					architecture,
					availableArchitectures: [architecture],
					powerpc: metadata
				});
				return architecture === "mips" ? ok({
					format: "elf",
					architecture,
					availableArchitectures: [architecture],
					mips: metadata
				}) : ok({
					format: "elf",
					architecture,
					availableArchitectures: [architecture],
					riscv: metadata
				});
			}
			if (architecture === "hexagon") return ok({
				format: "elf",
				architecture,
				availableArchitectures: [architecture]
			});
			return ok({
				format: "elf",
				architecture,
				availableArchitectures: [architecture]
			});
		};
		parseMz = (bytes, fileSize, signatureAtOffset) => {
			const evidence = parseMzHeaderEvidence(bytes, fileSize, signatureAtOffset);
			const { windowsHeader } = evidence;
			if (windowsHeader.state === "header-needed" || windowsHeader.state === "signature-needed") return err("Windows new-header pointer or signature is outside the bounded prefix");
			if (windowsHeader.state === "candidate") return err("MZ Windows new-header candidate is unresolved");
			if (windowsHeader.state === "declared") {
				const { offset } = windowsHeader;
				const limitation = mzWindowsHeaderLayoutLimitation(windowsHeader);
				if (limitation !== undefined) return err(limitation);
				if (offset > bytes.length - 24) return err("invalid or truncated Windows executable header in MZ image");
				if ([
					"NE",
					"LE",
					"LX"
				].includes(windowsHeader.signature)) return err(`unsupported ${windowsHeader.signature} executable in MZ image`);
				if (windowsHeader.signature !== "PE") return err("invalid or truncated Windows executable header in MZ image");
				const codeView = parsePeCodeViewFromBuffer(bytes, offset);
				return parsePeRecord(bytes.subarray(offset), codeView);
			}
			const parsed = evidence.dos;
			return parsed.ok ? ok({
				format: "dos-mz",
				architecture: "x86",
				availableArchitectures: ["x86"]
			}) : parsed;
		};
		parsePeRecord = (record, codeView) => {
			if (record.length < 24 || record.toString("binary", 0, 4) !== "PE\0\0") return err("invalid or truncated PE header");
			const machineType = record.readUInt16LE(4);
			const machine = decodePeMachine(machineType);
			if (machine === undefined) return err(`unsupported PE architecture (COFF machine 0x${machineType.toString(16).padStart(4, "0")})`);
			const optionalHeaderSize = record.readUInt16LE(20);
			if (optionalHeaderSize > 4096 || record.length < 24 + optionalHeaderSize) return err("invalid or truncated PE optional header");
			const optionalHeader = record.subarray(24, 24 + optionalHeaderSize);
			const facts = readPeOptionalHeader(optionalHeader, machineType);
			if (!facts.ok) return err(facts.error.message);
			if (facts.value.machine === null) return err("unsupported PE architecture");
			const { architecture } = facts.value.machine;
			const characteristics = record.readUInt16LE(22);
			return ok({
				format: "pe",
				peMachine: machineType,
				architecture,
				availableArchitectures: [architecture],
				executableRole: (characteristics & 2) === 0 ? "non-executable" : (characteristics & 8192) === 0 ? "application" : "shared-library",
				managed: facts.value.managed,
				...codeView !== undefined ? { codeView } : {}
			});
		};
		parseCodeViewData = (buffer, sizeOfData) => {
			if (sizeOfData < 16 || buffer.length < 16) return undefined;
			const magic = buffer.subarray(0, 4).toString("binary");
			const pathOffset = magic === "RSDS" ? 24 : magic === "NB10" ? 16 : undefined;
			if (pathOffset === undefined || sizeOfData <= pathOffset || buffer.length <= pathOffset) return undefined;
			const end = buffer.indexOf(0, pathOffset);
			if (end <= pathOffset || end >= sizeOfData) return undefined;
			const pdbPath = buffer.toString("utf8", pathOffset, end);
			const pdbFileName = pdbPath.split(/[/\\]/u).pop() ?? pdbPath;
			if (magic === "RSDS" && sizeOfData >= 24 && buffer.length >= 24) {
				const part1 = buffer.readUInt32LE(4).toString(16).padStart(8, "0");
				const part2 = buffer.readUInt16LE(8).toString(16).padStart(4, "0");
				const part3 = buffer.readUInt16LE(10).toString(16).padStart(4, "0");
				const part4 = buffer.subarray(12, 14).toString("hex");
				const part5 = buffer.subarray(14, 20).toString("hex");
				const guid = `${part1}-${part2}-${part3}-${part4}-${part5}`;
				const age = buffer.readUInt32LE(20);
				return {
					pdbPath,
					pdbFileName,
					guid,
					age
				};
			}
			if (magic === "NB10") {
				const age = buffer.readUInt32LE(12);
				return {
					pdbPath,
					pdbFileName,
					guid: null,
					age
				};
			}
			return undefined;
		};
		peDebugDirectoryEntry = (optionalHeader) => {
			if (optionalHeader.length < 2) return undefined;
			const magic = optionalHeader.readUInt16LE(0);
			if (magic !== 267 && magic !== 523) return undefined;
			const directoryOffset = magic === 523 ? 112 : 96;
			const directoryCountOffset = directoryOffset - 4;
			if (optionalHeader.length < directoryCountOffset + 4) return undefined;
			const directoryCount = optionalHeader.readUInt32LE(directoryCountOffset);
			if (directoryCount <= 6) return undefined;
			const debugEntryOffset = directoryOffset + 6 * 8;
			if (optionalHeader.length < debugEntryOffset + 8) return undefined;
			const debugRva = optionalHeader.readUInt32LE(debugEntryOffset);
			const debugSize = optionalHeader.readUInt32LE(debugEntryOffset + 4);
			if (debugRva === 0 || debugSize < 28) return undefined;
			return {
				debugRva,
				debugSize,
				sizeOfHeaders: optionalHeader.readUInt32LE(60)
			};
		};
		peRvaToFileOffset = (rva, sectionTable, numberOfSections, sizeOfHeaders, size = 1) => {
			if (rva < sizeOfHeaders && size <= sizeOfHeaders - rva) return rva;
			for (let i = 0; i < numberOfSections; i++) {
				const offset = i * 40;
				if (sectionTable.length < offset + 40) break;
				const virtualAddress = sectionTable.readUInt32LE(offset + 12);
				const sizeOfRawData = sectionTable.readUInt32LE(offset + 16);
				const pointerToRawData = sectionTable.readUInt32LE(offset + 20);
				if (pointerToRawData > 0 && rva >= virtualAddress && rva - virtualAddress < sizeOfRawData && size <= sizeOfRawData - (rva - virtualAddress)) {
					return pointerToRawData + (rva - virtualAddress);
				}
			}
			return undefined;
		};
		parsePeCodeViewFromBuffer = (fileBytes, peOffset) => {
			if (fileBytes.length < peOffset + 24) return undefined;
			const numberOfSections = fileBytes.readUInt16LE(peOffset + 6);
			const optionalHeaderSize = fileBytes.readUInt16LE(peOffset + 20);
			if (optionalHeaderSize > 4096 || fileBytes.length < peOffset + 24 + optionalHeaderSize) return undefined;
			const optionalHeader = fileBytes.subarray(peOffset + 24, peOffset + 24 + optionalHeaderSize);
			const debugDir = peDebugDirectoryEntry(optionalHeader);
			if (debugDir === undefined) return undefined;
			const sectionTableOffset = peOffset + 24 + optionalHeaderSize;
			const sectionTableSize = numberOfSections * 40;
			if (fileBytes.length < sectionTableOffset + sectionTableSize) return undefined;
			const sectionTable = fileBytes.subarray(sectionTableOffset, sectionTableOffset + sectionTableSize);
			const debugFileOffset = peRvaToFileOffset(debugDir.debugRva, sectionTable, numberOfSections, debugDir.sizeOfHeaders, Math.min(debugDir.debugSize, 4096));
			if (debugFileOffset === undefined || fileBytes.length < debugFileOffset + 28) return undefined;
			const maxDebugBytes = Math.min(debugDir.debugSize, fileBytes.length - debugFileOffset);
			const numEntries = Math.floor(maxDebugBytes / 28);
			for (let j = 0; j < numEntries; j++) {
				const entryOffset = debugFileOffset + j * 28;
				const type = fileBytes.readUInt32LE(entryOffset + 12);
				if (type !== 2) continue;
				const sizeOfData = fileBytes.readUInt32LE(entryOffset + 16);
				let pointerToRawData = fileBytes.readUInt32LE(entryOffset + 24);
				if (pointerToRawData === 0) {
					const addressOfRawData = fileBytes.readUInt32LE(entryOffset + 20);
					const mapped = peRvaToFileOffset(addressOfRawData, sectionTable, numberOfSections, debugDir.sizeOfHeaders, Math.min(sizeOfData, 4096));
					if (mapped === undefined) continue;
					pointerToRawData = mapped;
				}
				if (sizeOfData < 16 || fileBytes.length < pointerToRawData + Math.min(sizeOfData, 24)) continue;
				const codeViewData = fileBytes.subarray(pointerToRawData, Math.min(fileBytes.length, pointerToRawData + sizeOfData));
				const parsed = parseCodeViewData(codeViewData, sizeOfData);
				if (parsed !== undefined) return parsed;
			}
			return undefined;
		};
		machArchitecture = (cpu) => {
			switch (cpu) {
				case 7: return "x86";
				case 16777223: return "x86_64";
				case 12: return "arm";
				case 16777228: return "arm64";
			}
			return undefined;
		};
	})))();
}

//#endregion
//#region dist/domain/godotPckFormat.js
var GODOT_PCK_MAGIC, hasGodotPckHeader;
function init_godotPckFormat() {
	return (init_godotPckFormat = __esmMin((() => {
		GODOT_PCK_MAGIC = 1129333831;
		hasGodotPckHeader = (bytes) => bytes.length >= 4 && bytes[0] === 71 && bytes[1] === 68 && bytes[2] === 80 && bytes[3] === 67;
	})))();
}

//#endregion
export { GODOT_PCK_MAGIC, claimsExecutableHeader, dosMzImageByteLength, hasGodotPckHeader, init_binaryTarget, init_dosMz, init_godotPckFormat, mzWindowsHeaderLayoutLimitation, observeMzWindowsHeader, parseCodeViewData, parseExecutableHeader, parseMzHeaderEvidence, parsePeRecord, peDebugDirectoryEntry, peRvaToFileOffset, readFatArchitectureFamilies };