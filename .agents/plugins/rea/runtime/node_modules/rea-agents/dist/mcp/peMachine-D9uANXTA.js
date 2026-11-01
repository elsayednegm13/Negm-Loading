import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_result, r as ok, t as err } from "./result-Dbqc_peo.js";

//#region dist/domain/elfFixedHeader.js
var readElfFixedHeader, elfArchitecture;
function init_elfFixedHeader() {
	return (init_elfFixedHeader = __esmMin((() => {
		init_result();
		readElfFixedHeader = (bytes, totalBytes = bytes.length) => {
			if (bytes.length >= 4 && bytes.toString("hex", 0, 4) !== "7f454c46") return err("not an ELF image");
			if (bytes.length < 16) return err("ELF identification is truncated");
			const classByte = bytes[4];
			if (classByte !== 1 && classByte !== 2) return err("unsupported ELF class");
			const dataByte = bytes[5];
			if (dataByte !== 1 && dataByte !== 2) return err("unsupported ELF endianness");
			if (bytes[6] !== 1) return err("unsupported ELF identification version");
			const elfClass = classByte === 1 ? 32 : 64;
			const minimumSize = elfClass === 32 ? 52 : 64;
			if (!Number.isSafeInteger(totalBytes) || totalBytes < bytes.length || totalBytes < minimumSize || bytes.length < minimumSize) return err(`truncated ELF header: an ELF${elfClass} header needs ${minimumSize} bytes; the file has ${totalBytes}`);
			const littleEndian = dataByte === 1;
			const readU16 = (offset) => littleEndian ? bytes.readUInt16LE(offset) : bytes.readUInt16BE(offset);
			const readU32 = (offset) => littleEndian ? bytes.readUInt32LE(offset) : bytes.readUInt32BE(offset);
			const machine = readU16(18);
			if (readU32(20) !== 1 && !(machine === 190 && bytes[7] === 51)) return err("unsupported ELF header version");
			const headerSize = readU16(elfClass === 32 ? 40 : 52);
			if (headerSize < minimumSize || headerSize > totalBytes) return err("invalid ELF header size");
			return ok({
				elfClass,
				byteOrder: littleEndian ? "little" : "big",
				headerSize,
				machine,
				osAbi: bytes[7],
				architecture: elfArchitecture(machine) ?? null
			});
		};
		elfArchitecture = (machine) => {
			switch (machine) {
				case 3: return "x86";
				case 62: return "x86_64";
				case 8: return "mips";
				case 20: return "powerpc";
				case 40: return "arm";
				case 164: return "hexagon";
				case 183: return "arm64";
				case 243: return "riscv";
			}
			return undefined;
		};
	})))();
}

//#endregion
//#region dist/domain/peOptionalHeader.js
var readPeOptionalHeaderStructure;
function init_peOptionalHeader() {
	return (init_peOptionalHeader = __esmMin((() => {
		init_result();
		readPeOptionalHeaderStructure = (bytes) => {
			if (bytes.byteLength < 2) return err({
				kind: "malformed",
				reason: "truncated-magic",
				message: "truncated PE optional header"
			});
			const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
			const magic = view.getUint16(0, true);
			if (magic !== 267 && magic !== 523) return err({
				kind: "unsupported",
				reason: "unsupported-magic",
				message: "Only PE32 and PE32+ image optional headers are supported"
			});
			const bits = magic === 523 ? 64 : 32;
			const directoryOffset = bits === 64 ? 112 : 96;
			if (bytes.byteLength < directoryOffset) return err({
				kind: "malformed",
				reason: "truncated-fixed-fields",
				message: "truncated PE optional header"
			});
			const directoryCount = view.getUint32(directoryOffset - 4, true);
			if (directoryCount > Math.floor((bytes.byteLength - directoryOffset) / 8)) return err({
				kind: "malformed",
				reason: "truncated-directory-table",
				message: "truncated PE data-directory table"
			});
			const dataDirectories = Array.from({ length: directoryCount }, (_, index) => {
				const offset = directoryOffset + index * 8;
				return {
					address: view.getUint32(offset, true),
					size: view.getUint32(offset + 4, true),
					offset
				};
			});
			return ok({
				magic,
				bits,
				format: bits === 64 ? "pe32-plus" : "pe32",
				sizeOfHeaders: view.getUint32(60, true),
				directoryOffset,
				directoryCount,
				dataDirectories
			});
		};
	})))();
}

//#endregion
//#region dist/domain/peMachine.js
var architectureForMachine, peOptionalHeaderMagic, NATIVE_OS_OVERRIDES, decodePeMachine, peSubjectArchitecture, readPeOptionalHeader;
function init_peMachine() {
	return (init_peMachine = __esmMin((() => {
		init_peOptionalHeader();
		init_result();
		architectureForMachine = (machine) => {
			switch (machine) {
				case 332: return "x86";
				case 34404: return "x86_64";
				case 448:
				case 450:
				case 452: return "arm";
				case 43620: return "arm64";
			}
			return undefined;
		};
		peOptionalHeaderMagic = (architecture) => architecture === "x86_64" || architecture === "arm64" ? 523 : 267;
		NATIVE_OS_OVERRIDES = [
			17988,
			44484,
			44485,
			31609,
			6547,
			6546
		];
		decodePeMachine = (machine) => {
			const direct = architectureForMachine(machine);
			if (direct !== undefined) return {
				architecture: direct,
				nativeOsOverride: false
			};
			for (const override of NATIVE_OS_OVERRIDES) {
				const architecture = architectureForMachine(machine ^ override);
				if (architecture !== undefined) return {
					architecture,
					nativeOsOverride: true
				};
			}
			return undefined;
		};
		peSubjectArchitecture = (machineType, format) => {
			const machine = decodePeMachine(machineType);
			if (machine === undefined || machine.nativeOsOverride) return undefined;
			const magic = format === "pe32-plus" ? 523 : 267;
			return magic === peOptionalHeaderMagic(machine.architecture) ? machine.architecture : undefined;
		};
		readPeOptionalHeader = (optionalHeader, machineType) => {
			const parsed = readPeOptionalHeaderStructure(optionalHeader);
			if (!parsed.ok) return err({
				kind: parsed.error.kind,
				message: parsed.error.message
			});
			const facts = parsed.value;
			const cli = facts.dataDirectories[14];
			const managed = cli !== undefined && (cli.address !== 0 || cli.size !== 0);
			const decoded = decodePeMachine(machineType);
			const machine = decoded?.nativeOsOverride && !managed ? null : decoded ?? null;
			if (machine !== null && facts.magic !== peOptionalHeaderMagic(machine.architecture)) return err({
				kind: "malformed",
				message: "PE optional-header magic does not match its architecture"
			});
			return ok({
				...facts,
				machine,
				managed
			});
		};
	})))();
}

//#endregion
export { init_peOptionalHeader as a, init_elfFixedHeader as c, readPeOptionalHeader as i, readElfFixedHeader as l, init_peMachine as n, readPeOptionalHeaderStructure as o, peSubjectArchitecture as r, elfArchitecture as s, decodePeMachine as t };