import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { err, init_result, ok } from "./jsonLines-Gf10X4s1.js";

//#region dist/domain/apple/jvmClassFile.js
var MAX_JVM_CLASS_IDENTITY_BYTES, JVM_CLASS_IDENTITY_LIMIT_REASON, ClassFileCursor, readConstantPool, readConstant, poolHasTag, hasValidPoolReferences, validMethodHandle, readAttributes, readMembers, isJvmClassFile;
function init_jvmClassFile() {
	return (init_jvmClassFile = __esmMin((() => {
		MAX_JVM_CLASS_IDENTITY_BYTES = 16 * 1024 * 1024;
		JVM_CLASS_IDENTITY_LIMIT_REASON = "FAT/JVM identity is unresolved because the class identity scan exceeds the 16 MiB limit";
		ClassFileCursor = class {
			bytes;
			offset = 0;
			view;
			constructor(bytes) {
				this.bytes = bytes;
				this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
			}
			get atEnd() {
				return this.offset === this.bytes.byteLength;
			}
			u1() {
				if (!this.has(1)) return null;
				return this.bytes[this.offset++];
			}
			u2() {
				if (!this.has(2)) return null;
				const value = this.view.getUint16(this.offset, false);
				this.offset += 2;
				return value;
			}
			u4() {
				if (!this.has(4)) return null;
				const value = this.view.getUint32(this.offset, false);
				this.offset += 4;
				return value;
			}
			skip(length) {
				if (!Number.isSafeInteger(length) || length < 0 || !this.has(length)) return false;
				this.offset += length;
				return true;
			}
			has(length) {
				return this.offset <= this.bytes.byteLength - length;
			}
		};
		readConstantPool = (cursor, count) => {
			const pool = {
				tags: Array.from({ length: count }, () => null),
				first: Array.from({ length: count }, () => null),
				second: Array.from({ length: count }, () => null)
			};
			for (let index = 1; index < count; index += 1) {
				const tag = cursor.u1();
				if (tag === null) return null;
				if (!readConstant(cursor, tag, index, pool)) return null;
				if (tag === 5 || tag === 6) index += 1;
			}
			return pool;
		};
		readConstant = (cursor, tag, index, pool) => {
			switch (tag) {
				case 1: {
					const length = cursor.u2();
					if (length === null || !cursor.skip(length)) return false;
					break;
				}
				case 3:
				case 4:
					if (cursor.u4() === null) return false;
					break;
				case 5:
				case 6:
					if (index + 1 >= pool.tags.length || !cursor.skip(8)) return false;
					break;
				case 7:
				case 8:
				case 16:
				case 19:
				case 20:
					pool.first[index] = cursor.u2();
					if (pool.first[index] === null) return false;
					break;
				case 9:
				case 10:
				case 11:
				case 12:
				case 17:
				case 18:
					pool.first[index] = cursor.u2();
					pool.second[index] = cursor.u2();
					if (pool.first[index] === null || pool.second[index] === null) return false;
					break;
				case 15:
					pool.first[index] = cursor.u1();
					pool.second[index] = cursor.u2();
					if (pool.first[index] === null || pool.second[index] === null) return false;
					break;
				default: return false;
			}
			pool.tags[index] = tag;
			return true;
		};
		poolHasTag = (pool, index, ...tags) => Number.isInteger(index) && index > 0 && tags.includes(pool.tags[index] ?? -1);
		hasValidPoolReferences = (pool, major) => {
			for (let index = 1; index < pool.tags.length; index += 1) {
				const tag = pool.tags[index] ?? null;
				const first = pool.first[index] ?? null;
				const second = pool.second[index] ?? null;
				if ([
					7,
					8,
					16,
					19,
					20
				].includes(tag ?? -1)) {
					if (first === null || !poolHasTag(pool, first, 1)) return false;
					if (tag === 16 && major < 51 || (tag === 19 || tag === 20) && major < 53) return false;
				} else if ([
					9,
					10,
					11
				].includes(tag ?? -1)) {
					if (first === null || second === null || !poolHasTag(pool, first, 7) || !poolHasTag(pool, second, 12)) return false;
				} else if (tag === 12) {
					if (first === null || second === null || !poolHasTag(pool, first, 1) || !poolHasTag(pool, second, 1)) return false;
				} else if (tag === 15 && !validMethodHandle(pool, first, second, major)) {
					return false;
				} else if (tag === 17 || tag === 18) {
					if (second === null || !poolHasTag(pool, second, 12) || major < (tag === 17 ? 55 : 51)) return false;
				}
			}
			return true;
		};
		validMethodHandle = (pool, kind, reference, major) => {
			if (kind === null || reference === null || kind < 1 || kind > 9 || major < 51) return false;
			if (kind <= 4) return poolHasTag(pool, reference, 9);
			if (kind === 5 || kind === 8) return poolHasTag(pool, reference, 10);
			if (kind === 6 || kind === 7) return poolHasTag(pool, reference, ...major >= 52 ? [10, 11] : [10]);
			return poolHasTag(pool, reference, 11);
		};
		readAttributes = (cursor, pool, count) => {
			for (let index = 0; index < count; index += 1) {
				const name = cursor.u2();
				const length = cursor.u4();
				if (name === null || !poolHasTag(pool, name, 1) || length === null || !cursor.skip(length)) return false;
			}
			return true;
		};
		readMembers = (cursor, pool) => {
			const count = cursor.u2();
			if (count === null) return false;
			for (let index = 0; index < count; index += 1) {
				if (cursor.u2() === null) return false;
				const name = cursor.u2();
				const descriptor = cursor.u2();
				const attributes = cursor.u2();
				if (name === null || descriptor === null || !poolHasTag(pool, name, 1) || !poolHasTag(pool, descriptor, 1) || attributes === null || !readAttributes(cursor, pool, attributes)) return false;
			}
			return true;
		};
		isJvmClassFile = (bytes) => {
			const cursor = new ClassFileCursor(bytes);
			if (cursor.u4() !== 3405691582) return false;
			const minor = cursor.u2();
			const major = cursor.u2();
			const poolCount = cursor.u2();
			if (minor === null || major === null || major < 45 || poolCount === null || poolCount === 0) return false;
			const pool = readConstantPool(cursor, poolCount);
			if (pool === null || !hasValidPoolReferences(pool, major)) return false;
			if (cursor.u2() === null) return false;
			const thisClass = cursor.u2();
			const superClass = cursor.u2();
			if (thisClass === null || !poolHasTag(pool, thisClass, 7) || superClass === null || superClass !== 0 && !poolHasTag(pool, superClass, 7)) return false;
			const interfaces = cursor.u2();
			if (interfaces === null || !cursor.skip(interfaces * 2)) return false;
			if (!readMembers(cursor, pool) || !readMembers(cursor, pool)) return false;
			const attributes = cursor.u2();
			return attributes !== null && readAttributes(cursor, pool, attributes) && cursor.atEnd;
		};
	})))();
}

//#endregion
//#region dist/domain/apple/machoContainer.js
var machoLoadCommandAlignment, readMachoHeaderPrefixFacts, FAT_MAGIC, FAT_MAGIC_64, FAT_CIGAM, FAT_CIGAM_64, MAX_FAT_ARCHITECTURES, KNOWN_MACHO_CPU_TYPES, MACHO_HEADER_MAGICS, readFatContainerHeader, readFatContainerTable, hasFatMagic, classifyFatContainerIdentity, readFatSliceDeclarations, findOverlappingFatSlices, validateFatSlice, inspectFatSliceRange, validateFatSliceIdentity, safeNumber;
function init_machoContainer() {
	return (init_machoContainer = __esmMin((() => {
		init_jvmClassFile();
		machoLoadCommandAlignment = (wide) => wide ? 8 : 4;
		readMachoHeaderPrefixFacts = (bytes) => {
			if (bytes.byteLength < 4) return {
				magic: null,
				identity: null
			};
			const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
			const magic = view.getUint32(0, false);
			if (bytes.byteLength < 12 || !MACHO_HEADER_MAGICS.includes(magic)) return {
				magic,
				identity: null
			};
			const littleEndian = magic === 3472551422 || magic === 3489328638;
			return {
				magic,
				identity: {
					cpuType: view.getUint32(4, littleEndian),
					cpuSubtype: view.getUint32(8, littleEndian)
				}
			};
		};
		FAT_MAGIC = 3405691582;
		FAT_MAGIC_64 = 3405691583;
		FAT_CIGAM = 3199925962;
		FAT_CIGAM_64 = 3216703178;
		MAX_FAT_ARCHITECTURES = 128;
		KNOWN_MACHO_CPU_TYPES = [
			7,
			16777223,
			12,
			16777228,
			33554444,
			18,
			16777234
		];
		MACHO_HEADER_MAGICS = [
			4277009102,
			4277009103,
			3472551422,
			3489328638
		];
		readFatContainerHeader = (bytes, fileSize) => {
			if (!hasFatMagic(bytes)) return { state: "not-fat" };
			if (!Number.isSafeInteger(fileSize) || fileSize < bytes.byteLength) return {
				state: "malformed",
				reason: "FAT file size is invalid or contradicts retained bytes"
			};
			const table = readFatContainerTable(bytes);
			if (table.state !== "parsed") {
				if (table.state === "needs-data" && table.requiredBytes > fileSize) {
					return table.requiredBytes === 8 && fileSize < 8 ? {
						state: "malformed",
						reason: "FAT header is truncated"
					} : { state: "not-fat" };
				}
				return table;
			}
			if (bytes.byteLength === fileSize && isJvmClassFile(bytes)) return { state: "not-fat" };
			if (table.tableEnd > fileSize) return { state: "not-fat" };
			return {
				...table,
				rangeIssues: table.slices.map((slice) => inspectFatSliceRange(slice, fileSize, table.tableEnd))
			};
		};
		readFatContainerTable = (bytes) => {
			if (!hasFatMagic(bytes)) return { state: "not-fat" };
			const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
			const magic = view.getUint32(0, false);
			if (bytes.byteLength < 8) {
				return {
					state: "needs-data",
					requiredBytes: 8
				};
			}
			const littleEndian = magic === FAT_CIGAM || magic === FAT_CIGAM_64;
			const wide = magic === FAT_MAGIC_64 || magic === FAT_CIGAM_64;
			const count = view.getUint32(4, littleEndian);
			if (count === 0) return {
				state: "malformed",
				reason: "FAT header declares no architectures"
			};
			if (count > MAX_FAT_ARCHITECTURES) return { state: "not-fat" };
			const tableEnd = 8 + count * (wide ? 32 : 20);
			if (tableEnd > bytes.byteLength) return {
				state: "needs-data",
				requiredBytes: tableEnd
			};
			const declarations = readFatSliceDeclarations(bytes.subarray(8, tableEnd), {
				count,
				wide,
				littleEndian
			});
			return declarations.status === "parsed" ? {
				state: "parsed",
				magic,
				count,
				wide,
				littleEndian,
				tableEnd,
				slices: declarations.slices
			} : {
				state: "malformed",
				reason: declarations.reason
			};
		};
		hasFatMagic = (bytes) => {
			if (bytes.byteLength < 4) return false;
			const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
			return [
				FAT_MAGIC,
				FAT_MAGIC_64,
				FAT_CIGAM,
				FAT_CIGAM_64
			].includes(view.getUint32(0, false));
		};
		classifyFatContainerIdentity = (header, sliceHeaderAt) => {
			const hasKnownCpu = header.slices.some(({ cpuType }) => KNOWN_MACHO_CPU_TYPES.includes(cpuType));
			const invalidRange = header.rangeIssues.find((issue) => issue !== null);
			if (hasKnownCpu && invalidRange !== undefined) return {
				state: "malformed",
				...invalidRange
			};
			const validRanges = header.slices.filter((_slice, index) => header.rangeIssues[index] === null);
			const missingHeaders = [];
			let observedMachO = false;
			let observedNonMachO = false;
			for (const slice of validRanges) {
				if (slice.size < 4) {
					observedNonMachO = true;
					continue;
				}
				const magic = sliceHeaderAt(slice.offset);
				if (magic === undefined || magic === null) missingHeaders.push(slice.offset);
				else if (MACHO_HEADER_MAGICS.includes(magic)) observedMachO = true;
				else observedNonMachO = true;
			}
			if (observedNonMachO) return { state: "not-mach-o" };
			if (missingHeaders.length > 0) return {
				state: "needs-slice-header",
				offsets: missingHeaders
			};
			if (observedMachO) return invalidRange === undefined ? { state: "mach-o" } : {
				state: "malformed",
				...invalidRange
			};
			return { state: "not-mach-o" };
		};
		readFatSliceDeclarations = (tableBytes, options) => {
			const { count, wide, littleEndian } = options;
			const entrySize = wide ? 32 : 20;
			if (tableBytes.byteLength < count * entrySize) return {
				status: "malformed",
				reason: "FAT table is truncated"
			};
			const view = new DataView(tableBytes.buffer, tableBytes.byteOffset, tableBytes.byteLength);
			const slices = [];
			for (let index = 0; index < count; index++) {
				const base = index * entrySize;
				const offset = wide ? safeNumber(view.getBigUint64(base + 8, littleEndian)) : view.getUint32(base + 8, littleEndian);
				const size = wide ? safeNumber(view.getBigUint64(base + 16, littleEndian)) : view.getUint32(base + 12, littleEndian);
				if (offset === null || size === null) return {
					status: "malformed",
					reason: "FAT offset or size exceeds the safe range"
				};
				slices.push({
					index,
					offset,
					size,
					alignmentExponent: view.getUint32(base + (wide ? 24 : 16), littleEndian),
					cpuType: view.getUint32(base, littleEndian),
					cpuSubtype: view.getUint32(base + 4, littleEndian),
					reserved: wide ? view.getUint32(base + 28, littleEndian) : null
				});
			}
			return {
				status: "parsed",
				slices
			};
		};
		findOverlappingFatSlices = (declarations) => {
			const ranges = [...declarations].sort((a, b) => a.offset - b.offset);
			for (let index = 1; index < ranges.length; index++) {
				const previous = ranges[index - 1];
				const current = ranges[index];
				if (previous !== undefined && current !== undefined && current.offset < previous.offset + previous.size) return [previous, current];
			}
			return null;
		};
		validateFatSlice = (declaration, containerSize, tableEnd, embedded) => {
			const rangeIssue = inspectFatSliceRange(declaration, containerSize, tableEnd);
			if (rangeIssue !== null) return rangeIssue.reason;
			return embedded === undefined ? null : validateFatSliceIdentity(declaration, embedded);
		};
		inspectFatSliceRange = (declaration, containerSize, tableEnd) => {
			const { index, offset, size, alignmentExponent } = declaration;
			if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(size) || size <= 0 || offset < tableEnd) return {
				category: "malformed",
				reason: `FAT architecture ${index} has an invalid slice range`
			};
			if (offset > containerSize || size > containerSize - offset) return {
				category: "malformed",
				reason: `FAT architecture ${index} slice range extends beyond the file`
			};
			if (!Number.isInteger(alignmentExponent) || alignmentExponent < 0 || alignmentExponent > 52) return {
				category: "unsupported",
				reason: `FAT architecture ${index} alignment exponent ${alignmentExponent} is unsupported`
			};
			if (offset % 2 ** alignmentExponent !== 0) return {
				category: "malformed",
				reason: `FAT architecture ${index} offset is not aligned to 2^${alignmentExponent}`
			};
			return null;
		};
		validateFatSliceIdentity = (declaration, embedded) => embedded.cpuType === declaration.cpuType && embedded.cpuSubtype === declaration.cpuSubtype ? null : `FAT architecture ${declaration.index} CPU type/subtype disagrees with its Mach-O header`;
		safeNumber = (value) => value > BigInt(Number.MAX_SAFE_INTEGER) ? null : Number(value);
	})))();
}

//#endregion
//#region dist/domain/apple/machoLoadCommands.js
var readMachoLoadCommandTableHeader, MachoLoadCommandCursor;
function init_machoLoadCommands() {
	return (init_machoLoadCommands = __esmMin((() => {
		init_result();
		init_machoContainer();
		readMachoLoadCommandTableHeader = (bytes, fileSize) => {
			if (bytes.byteLength < 4) return ok(null);
			const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
			const magic = view.getUint32(0, false);
			if (![
				4277009102,
				4277009103,
				3472551422,
				3489328638
			].includes(magic)) return ok(null);
			const wide = magic === 4277009103 || magic === 3489328638;
			const headerSize = wide ? 32 : 28;
			if (bytes.byteLength < headerSize) return err(`truncated Mach-O header: a ${wide ? 64 : 32}-bit header needs ${headerSize} bytes; the file has ${fileSize}`);
			const littleEndian = magic === 3472551422 || magic === 3489328638;
			const commandBytes = view.getUint32(20, littleEndian);
			if (commandBytes > fileSize - headerSize) return err(`truncated Mach-O load commands: the header declares ${commandBytes} bytes after its ${headerSize}-byte header; the file has ${fileSize}`);
			return ok({
				headerSize,
				wide,
				littleEndian,
				commandCount: view.getUint32(16, littleEndian),
				commandBytes
			});
		};
		MachoLoadCommandCursor = class {
			table;
			#index = 0;
			#offset = 0;
			constructor(table) {
				this.table = table;
			}
			/** Offset relative to the command table; null when every declared row was read. */
			get nextOffset() {
				return this.#index < this.table.commandCount ? this.#offset : null;
			}
			/** Consume exactly one command's eight-byte header, leaving its payload to callers. */
			read(bytes) {
				const { commandBytes, littleEndian, wide } = this.table;
				if (this.#offset + 8 > commandBytes || bytes.byteLength < 8) return err(`load command ${this.#index} starts beyond sizeofcmds`);
				const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
				const size = view.getUint32(4, littleEndian);
				if (size < 8 || size % machoLoadCommandAlignment(wide) !== 0 || size > commandBytes - this.#offset) return err(`load command ${this.#index} at offset ${this.#offset} has invalid cmdsize ${size}`);
				const frame = {
					index: this.#index,
					offset: this.#offset,
					command: view.getUint32(0, littleEndian),
					size
				};
				this.#index += 1;
				this.#offset += size;
				return ok(frame);
			}
			/** A successful walk must exhaust both ncmds and sizeofcmds. */
			finish() {
				return this.#index === this.table.commandCount && this.#offset === this.table.commandBytes ? ok(null) : err(`load commands declare ${this.table.commandCount} commands but sizeofcmds holds ${this.table.commandBytes} bytes`);
			}
		};
	})))();
}

//#endregion
export { JVM_CLASS_IDENTITY_LIMIT_REASON, MAX_JVM_CLASS_IDENTITY_BYTES, MachoLoadCommandCursor, classifyFatContainerIdentity, findOverlappingFatSlices, init_jvmClassFile, init_machoContainer, init_machoLoadCommands, isJvmClassFile, readFatContainerHeader, readFatContainerTable, readFatSliceDeclarations, readMachoHeaderPrefixFacts, readMachoLoadCommandTableHeader, validateFatSlice, validateFatSliceIdentity };