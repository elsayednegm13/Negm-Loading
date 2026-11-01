import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { init_machoCpuIdentity, machoArchitectureName } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { JVM_CLASS_IDENTITY_LIMIT_REASON, MAX_JVM_CLASS_IDENTITY_BYTES, MachoLoadCommandCursor, classifyFatContainerIdentity, init_jvmClassFile, init_machoContainer, init_machoLoadCommands, readFatContainerHeader, readFatSliceDeclarations, readMachoHeaderPrefixFacts, validateFatSlice, validateFatSliceIdentity } from "./machoLoadCommands-CChRRK2_.js";
import { init_machoPlatform, legacyMachoPlatform } from "./machoPlatform-BD3SQwix.js";

//#region dist/artifacts/apple/MachoLoadCommandReader.js
var MAX_LOAD_COMMAND_BYTES, MAX_LAZY_INFO_DEPENDENCIES, MAX_LAZY_INFO_SYMBOL_REFERENCES, MH_MAGIC, MH_MAGIC_64, MH_CIGAM, MH_CIGAM_64, FAT_MAGIC, FAT_MAGIC_64, FAT_CIGAM, FAT_CIGAM_64, LC_SEGMENT, LC_SEGMENT_64, LC_ID_DYLIB, LC_LOAD_DYLIB, LC_LOAD_WEAK_DYLIB, LC_REEXPORT_DYLIB, LC_LAZY_LOAD_DYLIB, LC_LAZY_LOAD_DYLIB_INFO, LC_LOAD_UPWARD_DYLIB, LC_RPATH, LC_DYLD_ENVIRONMENT, LC_CODE_SIGNATURE, LC_BUILD_VERSION, CPU_TYPE_ARM64, VERSION_MIN_PLATFORMS, DYLIB_USE_MARKER, LAZY_INFO_HEADER_BYTES, LAZY_INFO_MAY_BE_MISSING, LAZY_INFO_MIN_VM_OFFSET, DYLIB_USE_WEAK_LINK, DYLIB_USE_REEXPORT, DYLIB_USE_UPWARD, DYLIB_USE_DELAYED_INIT, DEPENDENCY_COMMANDS, MachoFormatIssue, hasMachoMagic, readMachoImage, readAppleHiddenArm64Slice, readFatSlices, readSlice, decodeCommands, maximumVmOffset, readSegmentSpan, containedPayload, appendDependencies, decodeCommand, decodeLazyLoadDylibInfoCommand, readLazyPayloadBytes, readLazyLoadDylibInfo, decodeLazyLoadDylibInfoPayload, chargeLazyString, payloadString, decodeDependency, commandString, readExact, fileTypeName, version, swap, viewOf;
function init_MachoLoadCommandReader() {
	return (init_MachoLoadCommandReader = __esmMin((() => {
		init_machoLoadCommands();
		init_jvmClassFile();
		init_machoCpuIdentity();
		init_machoPlatform();
		init_machoContainer();
		MAX_LOAD_COMMAND_BYTES = 16 * 1024 * 1024;
		MAX_LAZY_INFO_DEPENDENCIES = 1024;
		MAX_LAZY_INFO_SYMBOL_REFERENCES = 64 * 1024;
		MH_MAGIC = 4277009102;
		MH_MAGIC_64 = 4277009103;
		MH_CIGAM = 3472551422;
		MH_CIGAM_64 = 3489328638;
		FAT_MAGIC = 3405691582;
		FAT_MAGIC_64 = 3405691583;
		FAT_CIGAM = 3199925962;
		FAT_CIGAM_64 = 3216703178;
		LC_SEGMENT = 1;
		LC_SEGMENT_64 = 25;
		LC_ID_DYLIB = 13;
		LC_LOAD_DYLIB = 12;
		LC_LOAD_WEAK_DYLIB = 2147483672;
		LC_REEXPORT_DYLIB = 2147483679;
		LC_LAZY_LOAD_DYLIB = 32;
		LC_LAZY_LOAD_DYLIB_INFO = 58;
		LC_LOAD_UPWARD_DYLIB = 2147483683;
		LC_RPATH = 2147483676;
		LC_DYLD_ENVIRONMENT = 39;
		LC_CODE_SIGNATURE = 29;
		LC_BUILD_VERSION = 50;
		CPU_TYPE_ARM64 = 16777228;
		VERSION_MIN_PLATFORMS = new Map([
			[36, 1],
			[37, 2],
			[47, 3],
			[48, 4]
		]);
		DYLIB_USE_MARKER = 443815936;
		LAZY_INFO_HEADER_BYTES = 24;
		LAZY_INFO_MAY_BE_MISSING = 1;
		LAZY_INFO_MIN_VM_OFFSET = 16384n;
		DYLIB_USE_WEAK_LINK = 1;
		DYLIB_USE_REEXPORT = 2;
		DYLIB_USE_UPWARD = 4;
		DYLIB_USE_DELAYED_INIT = 8;
		DEPENDENCY_COMMANDS = new Map([
			[LC_LOAD_DYLIB, "LC_LOAD_DYLIB"],
			[LC_LOAD_WEAK_DYLIB, "LC_LOAD_WEAK_DYLIB"],
			[LC_REEXPORT_DYLIB, "LC_REEXPORT_DYLIB"],
			[LC_LAZY_LOAD_DYLIB, "LC_LAZY_LOAD_DYLIB"],
			[LC_LOAD_UPWARD_DYLIB, "LC_LOAD_UPWARD_DYLIB"]
		]);
		MachoFormatIssue = class extends Error {
			status;
			constructor(status, message) {
				super(message);
				this.status = status;
			}
		};
		hasMachoMagic = (head) => {
			if (head.byteLength < 4) return false;
			const magic = new DataView(head.buffer, head.byteOffset, head.byteLength).getUint32(0, false);
			return [
				MH_MAGIC,
				MH_MAGIC_64,
				MH_CIGAM,
				MH_CIGAM_64,
				FAT_MAGIC,
				FAT_MAGIC_64,
				FAT_CIGAM,
				FAT_CIGAM_64
			].includes(magic);
		};
		readMachoImage = async (readAt, size) => {
			try {
				const head = await readAt(0, Math.min(size, 8));
				if (head.byteLength < 8) return hasMachoMagic(head) ? {
					status: "malformed",
					reason: "Mach-O header is truncated"
				} : { status: "not-mach-o" };
				const view = viewOf(head);
				const magic = view.getUint32(0, false);
				let header;
				if (magic === FAT_MAGIC && size <= 16777216) {
					const complete = await readAt(0, size);
					header = complete.byteLength === size ? readFatContainerHeader(complete, size) : readFatContainerHeader(head, size);
				} else header = readFatContainerHeader(head, size);
				if (header.state !== "not-fat") {
					if (header.state === "needs-data") {
						header = readFatContainerHeader(await readAt(0, header.requiredBytes), size);
					}
					if (header.state === "not-fat") return { status: "not-mach-o" };
					if (header.state === "needs-data") throw new MachoFormatIssue("malformed", "FAT table is truncated");
					if (header.state === "malformed") throw new MachoFormatIssue("malformed", header.reason);
					let identity = classifyFatContainerIdentity(header, () => undefined);
					if (identity.state === "needs-slice-header") {
						const sliceHeaders = new Map();
						for (const offset of identity.offsets) {
							const bytes = await readAt(offset, 4);
							sliceHeaders.set(offset, bytes.byteLength < 4 ? null : viewOf(bytes).getUint32(0, false));
						}
						identity = classifyFatContainerIdentity(header, (offset) => sliceHeaders.get(offset));
					}
					if (identity.state === "not-mach-o") return { status: "not-mach-o" };
					if (identity.state === "malformed") {
						if (magic === FAT_MAGIC && size > 16777216) throw new MachoFormatIssue("unsupported", JVM_CLASS_IDENTITY_LIMIT_REASON);
						throw new MachoFormatIssue(identity.category, identity.reason);
					}
					if (identity.state === "needs-slice-header") return { status: "not-mach-o" };
					const hiddenSlice = await readAppleHiddenArm64Slice(readAt, size, header);
					return {
						status: "parsed",
						slices: await readFatSlices(readAt, header.slices),
						...hiddenSlice === null ? {} : { hiddenSlices: [hiddenSlice] }
					};
				}
				if (magic === MH_CIGAM || magic === MH_CIGAM_64) return {
					status: "parsed",
					slices: [await readSlice(readAt, 0, size)]
				};
				if (magic === MH_MAGIC || magic === MH_MAGIC_64) throw new MachoFormatIssue("unsupported", "big-endian Mach-O images are not supported");
				return { status: "not-mach-o" };
			} catch (cause) {
				if (cause instanceof MachoFormatIssue) return {
					status: cause.status,
					reason: cause.message
				};
				throw cause;
			}
		};
		readAppleHiddenArm64Slice = async (readAt, fileSize, header) => {
			if (header.wide) return null;
			const firstOffset = Math.min(...header.slices.map(({ offset }) => offset));
			const end = header.tableEnd + 20;
			if (end > fileSize || end > firstOffset) return null;
			const bytes = await readAt(header.tableEnd, 20);
			if (bytes.byteLength < 20) throw new MachoFormatIssue("malformed", "Hidden ARM64 FAT row is truncated");
			const row = readFatSliceDeclarations(bytes, {
				count: 1,
				wide: false,
				littleEndian: header.littleEndian
			});
			if (row.status !== "parsed") throw new MachoFormatIssue("malformed", row.reason);
			const declaration = {
				...row.slices[0],
				index: header.count
			};
			if (declaration.cpuType !== CPU_TYPE_ARM64) return null;
			const rangeIssue = validateFatSlice(declaration, fileSize, end);
			if (rangeIssue !== null) throw new MachoFormatIssue("malformed", rangeIssue);
			const slice = await readSlice(readAt, declaration.offset, declaration.size, {
				fatCpuType: declaration.cpuType,
				fatCpuSubtype: declaration.cpuSubtype,
				alignmentExponent: declaration.alignmentExponent
			});
			const identityIssue = validateFatSliceIdentity(declaration, {
				cpuType: slice.cpu_type,
				cpuSubtype: slice.cpu_subtype
			});
			if (identityIssue !== null) throw new MachoFormatIssue("malformed", identityIssue);
			return {
				...slice,
				hidden: true
			};
		};
		readFatSlices = async (readAt, declarations) => {
			const slices = [];
			let unsupported;
			for (const declaration of declarations) {
				const { offset, size: length, cpuType, cpuSubtype } = declaration;
				let slice;
				try {
					slice = await readSlice(readAt, offset, length, {
						fatCpuType: cpuType,
						fatCpuSubtype: cpuSubtype,
						alignmentExponent: declaration.alignmentExponent
					});
				} catch (cause) {
					if (!(cause instanceof MachoFormatIssue) || cause.status !== "unsupported") throw cause;
					unsupported ??= cause;
					continue;
				}
				const identityIssue = validateFatSliceIdentity(declaration, {
					cpuType: slice.cpu_type,
					cpuSubtype: slice.cpu_subtype
				});
				if (identityIssue !== null) throw new MachoFormatIssue("malformed", identityIssue);
				slices.push(slice);
			}
			if (unsupported !== undefined) throw unsupported;
			return slices;
		};
		readSlice = async (readAt, base, length, fat = null) => {
			const header = viewOf(await readExact(readAt, base, 28, "Mach-O header"));
			const headerBytes = new Uint8Array(header.buffer, header.byteOffset, header.byteLength);
			const identity = readMachoHeaderPrefixFacts(headerBytes).identity;
			const magic = header.getUint32(0, true);
			if (magic === MH_MAGIC_64 || magic === MH_MAGIC) {
				if (identity === null) throw new MachoFormatIssue("malformed", `slice at offset ${base} has no Mach-O header`);
				const wide = magic === MH_MAGIC_64;
				const headerSize = wide ? 32 : 28;
				const commandCount = header.getUint32(16, true);
				const commandBytes = header.getUint32(20, true);
				if (commandBytes > 16777216) throw new MachoFormatIssue("unsupported", `load commands occupy ${commandBytes} bytes, above the ${MAX_LOAD_COMMAND_BYTES}-byte limit`);
				if (headerSize + commandBytes > length) throw new MachoFormatIssue("malformed", "load commands extend beyond the Mach-O slice");
				const commands = await readExact(readAt, base + headerSize, commandBytes, "load commands");
				const decoded = decodeCommands(commands, {
					wide,
					cpuType: identity.cpuType,
					cpuSubtype: identity.cpuSubtype,
					fileType: header.getUint32(12, true),
					commandCount,
					sliceOffset: base,
					sliceSize: length,
					fatCpuType: fat?.fatCpuType ?? null,
					fatCpuSubtype: fat?.fatCpuSubtype ?? null,
					fatAlignmentExponent: fat?.alignmentExponent ?? null
				});
				const slice = decoded.slice;
				await appendDependencies(slice, decoded.dependencies, readAt, base, length, decoded.maxVmOffset);
				const distinctPlatforms = [...new Set(slice.platforms)];
				slice.platform = distinctPlatforms.length === 1 ? distinctPlatforms[0] ?? null : null;
				return slice;
			}
			throw new MachoFormatIssue(magic === swap(MH_MAGIC) || magic === swap(MH_MAGIC_64) ? "unsupported" : "malformed", magic === swap(MH_MAGIC) || magic === swap(MH_MAGIC_64) ? "big-endian Mach-O slices are not supported" : `slice at offset ${base} has no Mach-O header`);
		};
		decodeCommands = (bytes, header) => {
			const slice = {
				architecture: machoArchitectureName(header.cpuType, header.cpuSubtype),
				slice_offset: header.sliceOffset,
				slice_size: header.sliceSize,
				cpu_type: header.cpuType,
				cpu_subtype: header.cpuSubtype,
				fat_cpu_type: header.fatCpuType,
				fat_cpu_subtype: header.fatCpuSubtype,
				fat_alignment_exponent: header.fatAlignmentExponent,
				file_type: fileTypeName(header.fileType),
				file_type_code: header.fileType,
				platform: null,
				platforms: [],
				install_name: null,
				dependencies: [],
				rpaths: [],
				dyld_environment: [],
				code_signature_present: false
			};
			const dependencies = [];
			const segments = [];
			let unreadableSegment;
			let lazyInfo = false;
			let lazyInfoCount = 0;
			const commands = new MachoLoadCommandCursor({
				wide: header.wide,
				littleEndian: true,
				commandCount: header.commandCount,
				commandBytes: bytes.byteLength
			});
			while (commands.nextOffset !== null) {
				const offset = commands.nextOffset;
				const frame = commands.read(bytes.subarray(offset, offset + 8));
				if (!frame.ok) throw new MachoFormatIssue("malformed", frame.error);
				const { index, command, size } = frame.value;
				const body = bytes.subarray(offset, offset + size);
				if (command === LC_SEGMENT || command === LC_SEGMENT_64) {
					const span = readSegmentSpan(body, command === LC_SEGMENT_64);
					if (span === undefined) unreadableSegment ??= index;
					else segments.push(span);
				}
				if (command === LC_LAZY_LOAD_DYLIB_INFO) {
					lazyInfoCount += 1;
					if (lazyInfoCount > 1024) throw new MachoFormatIssue("unsupported", `LC_LAZY_LOAD_DYLIB_INFO commands exceed the ${MAX_LAZY_INFO_DEPENDENCIES}-dependency limit`);
					lazyInfo = true;
				}
				const decoded = decodeCommand(command, body, index, slice);
				if (decoded !== undefined) dependencies.push(decoded);
			}
			const complete = commands.finish();
			if (!complete.ok) throw new MachoFormatIssue("malformed", complete.error);
			if (lazyInfo && unreadableSegment !== undefined) throw new MachoFormatIssue("malformed", `load command ${unreadableSegment} is too short to establish the slice VM range for LC_LAZY_LOAD_DYLIB_INFO`);
			return {
				slice,
				dependencies,
				maxVmOffset: maximumVmOffset(segments)
			};
		};
		maximumVmOffset = (segments) => {
			let textVmAddr = 0n;
			for (const segment of segments) {
				if (segment.name === "__TEXT") {
					textVmAddr = segment.vmaddr;
					break;
				}
			}
			let max = LAZY_INFO_MIN_VM_OFFSET;
			for (const segment of segments) {
				if (segment.name === "__LINKEDIT") continue;
				const end = segment.vmaddr - textVmAddr + segment.vmsize;
				if (end > max) max = end;
			}
			return max;
		};
		readSegmentSpan = (body, wide) => {
			if (body.byteLength < (wide ? 72 : 56)) return undefined;
			const view = viewOf(body);
			const nameBytes = body.subarray(8, 24);
			const end = nameBytes.indexOf(0);
			return {
				name: new TextDecoder("utf-8", { fatal: false }).decode(end < 0 ? nameBytes : nameBytes.subarray(0, end)),
				vmaddr: wide ? view.getBigUint64(24, true) : BigInt(view.getUint32(24, true)),
				vmsize: wide ? view.getBigUint64(32, true) : BigInt(view.getUint32(28, true))
			};
		};
		containedPayload = (reads, fileOffset, size, work) => {
			for (const read of reads) {
				work.rangeChecks += 1;
				if (work.rangeChecks > 16777216) throw new MachoFormatIssue("unsupported", `LC_LAZY_LOAD_DYLIB_INFO payload range lookup exceeds the ${MAX_LOAD_COMMAND_BYTES}-check limit`);
				const start = fileOffset - read.fileOffset;
				if (start >= 0 && Number.isSafeInteger(start) && start + size <= read.bytes.byteLength) return read.bytes.subarray(start, start + size);
			}
			return undefined;
		};
		appendDependencies = async (slice, dependencies, readAt, base, length, maxVmOffset) => {
			const work = {
				dependencies: new Map(),
				reads: [],
				strings: new Map(),
				payloadBytes: 0,
				stringBytes: 0,
				symbolReferences: 0,
				rangeChecks: 0
			};
			for (const dependency of dependencies) {
				if (dependency.kind === "parsed") {
					slice.dependencies.push(dependency.value);
					continue;
				}
				const key = `${dependency.dataOffset}:${dependency.dataSize}`;
				const cached = work.dependencies.get(key);
				if (cached !== undefined) {
					slice.dependencies.push(cached);
					continue;
				}
				const value = await readLazyLoadDylibInfo(readAt, base, length, dependency, maxVmOffset, work);
				work.dependencies.set(key, value);
				slice.dependencies.push(value);
			}
		};
		decodeCommand = (command, body, index, slice) => {
			if (command === LC_ID_DYLIB) {
				slice.install_name = commandString(body, 24, index);
				return;
			}
			if (command === LC_RPATH) {
				slice.rpaths.push(commandString(body, 12, index));
				return;
			}
			if (command === LC_DYLD_ENVIRONMENT) {
				slice.dyld_environment.push(commandString(body, 12, index));
				return;
			}
			if (command === LC_CODE_SIGNATURE) {
				if (body.byteLength < 16) throw new MachoFormatIssue("malformed", `load command ${index} is too short for LC_CODE_SIGNATURE`);
				slice.code_signature_present = true;
				return;
			}
			if (command === LC_BUILD_VERSION) {
				if (body.byteLength < 24) throw new MachoFormatIssue("malformed", `load command ${index} is too short for LC_BUILD_VERSION`);
				const view = viewOf(body);
				const toolCount = view.getUint32(20, true);
				if (toolCount > Math.floor((body.byteLength - 24) / 8)) throw new MachoFormatIssue("malformed", `load command ${index} LC_BUILD_VERSION tool records exceed cmdsize`);
				const platform = view.getUint32(8, true);
				slice.platforms.push(platform);
				return;
			}
			const legacyPlatform = VERSION_MIN_PLATFORMS.get(command);
			if (legacyPlatform !== undefined) {
				if (body.byteLength < 16) throw new MachoFormatIssue("malformed", `load command ${index} is too short for a version-min command`);
				slice.platforms.push(legacyMachoPlatform(legacyPlatform, slice.cpu_type));
				return;
			}
			if (command === LC_LAZY_LOAD_DYLIB_INFO) return decodeLazyLoadDylibInfoCommand(body, index);
			const name = DEPENDENCY_COMMANDS.get(command);
			if (name !== undefined) return {
				kind: "parsed",
				value: decodeDependency(name, body, index)
			};
			return undefined;
		};
		decodeLazyLoadDylibInfoCommand = (body, index) => {
			if (body.byteLength < 16) throw new MachoFormatIssue("malformed", `load command ${index} is too short for LC_LAZY_LOAD_DYLIB_INFO`);
			const view = viewOf(body);
			const dataOffset = view.getUint32(8, true);
			const dataSize = view.getUint32(12, true);
			if (dataSize < LAZY_INFO_HEADER_BYTES) throw new MachoFormatIssue("malformed", `load command ${index} LC_LAZY_LOAD_DYLIB_INFO payload is shorter than its 24-byte header`);
			if (dataSize > 16777216) throw new MachoFormatIssue("unsupported", `LC_LAZY_LOAD_DYLIB_INFO payload occupies ${dataSize} bytes, above the ${MAX_LOAD_COMMAND_BYTES}-byte limit`);
			return {
				kind: "lazy-info",
				index,
				dataOffset,
				dataSize
			};
		};
		readLazyPayloadBytes = async (readAt, fileOffset, size, index, work) => {
			const covered = containedPayload(work.reads, fileOffset, size, work);
			if (covered !== undefined) return covered;
			work.payloadBytes += size;
			if (work.payloadBytes > 16777216) throw new MachoFormatIssue("unsupported", `LC_LAZY_LOAD_DYLIB_INFO payloads occupy ${work.payloadBytes} bytes, above the ${MAX_LOAD_COMMAND_BYTES}-byte aggregate limit`);
			const payload = await readExact(readAt, fileOffset, size, `load command ${index} LC_LAZY_LOAD_DYLIB_INFO payload`);
			work.reads.push({
				fileOffset,
				bytes: payload
			});
			return payload;
		};
		readLazyLoadDylibInfo = async (readAt, base, length, command, maxVmOffset, work) => {
			if (command.dataOffset > length || command.dataSize > length - command.dataOffset) throw new MachoFormatIssue("malformed", `load command ${command.index} LC_LAZY_LOAD_DYLIB_INFO payload extends beyond the Mach-O slice`);
			const fileOffset = base + command.dataOffset;
			if (!Number.isSafeInteger(fileOffset)) throw new MachoFormatIssue("malformed", `load command ${command.index} LC_LAZY_LOAD_DYLIB_INFO payload offset is not a safe integer`);
			const payload = await readLazyPayloadBytes(readAt, fileOffset, command.dataSize, command.index, work);
			return decodeLazyLoadDylibInfoPayload(payload, command.index, fileOffset, maxVmOffset, work);
		};
		decodeLazyLoadDylibInfoPayload = (payload, index, fileOffset, maxVmOffset, work) => {
			const view = viewOf(payload);
			const pathOffset = view.getUint32(0, true);
			const flagImageOffset = view.getUint32(4, true);
			const flags = view.getUint16(8, true);
			const chainStartImageOffset = view.getUint32(12, true);
			const symbolCount = view.getUint32(16, true);
			const symbolArrayOffset = view.getUint32(20, true);
			if (BigInt(flagImageOffset) > maxVmOffset) throw new MachoFormatIssue("malformed", `load command ${index} LC_LAZY_LOAD_DYLIB_INFO flag image offset 0x${flagImageOffset.toString(16)} is beyond the slice VM range 0x${maxVmOffset.toString(16)}`);
			if (BigInt(chainStartImageOffset) > maxVmOffset) throw new MachoFormatIssue("malformed", `load command ${index} LC_LAZY_LOAD_DYLIB_INFO chain start image offset 0x${chainStartImageOffset.toString(16)} is beyond the slice VM range 0x${maxVmOffset.toString(16)}`);
			if ((flags & ~LAZY_INFO_MAY_BE_MISSING) !== 0) throw new MachoFormatIssue("unsupported", `load command ${index} LC_LAZY_LOAD_DYLIB_INFO flags 0x${flags.toString(16)} include unrecognized bits`);
			if (symbolArrayOffset > payload.byteLength || symbolCount > (payload.byteLength - symbolArrayOffset) / 4) throw new MachoFormatIssue("malformed", `load command ${index} LC_LAZY_LOAD_DYLIB_INFO symbol table extends beyond the payload`);
			const installName = payloadString(payload, pathOffset, fileOffset, index, "load path", work, true);
			const symbolReferences = work.symbolReferences + symbolCount;
			if (symbolReferences > 65536) throw new MachoFormatIssue("unsupported", `LC_LAZY_LOAD_DYLIB_INFO symbol validation exceeds the ${MAX_LAZY_INFO_SYMBOL_REFERENCES}-reference limit`);
			work.symbolReferences = symbolReferences;
			for (let symbol = 0; symbol < symbolCount; symbol += 1) {
				const offset = view.getUint32(symbolArrayOffset + symbol * 4, true);
				payloadString(payload, offset, fileOffset, index, `symbol ${symbol}`, work, false);
			}
			return {
				command: "LC_LAZY_LOAD_DYLIB_INFO",
				encoding: "lazy_load_dylib_info",
				install_name: installName,
				weak: (flags & LAZY_INFO_MAY_BE_MISSING) !== 0,
				upward: false,
				reexport: false,
				delayed_init: false,
				current_version: null,
				compatibility_version: null
			};
		};
		chargeLazyString = (work, examined) => {
			const occupied = work.stringBytes + examined;
			if (occupied > 16777216) throw new MachoFormatIssue("unsupported", `LC_LAZY_LOAD_DYLIB_INFO string validation occupies ${occupied} bytes, above the ${MAX_LOAD_COMMAND_BYTES}-byte limit`);
			work.stringBytes = occupied;
		};
		payloadString = (payload, offset, fileOffset, index, label, work, excludeFinalByte) => {
			if (offset < LAZY_INFO_HEADER_BYTES) throw new MachoFormatIssue("malformed", `load command ${index} LC_LAZY_LOAD_DYLIB_INFO ${label} offset ${offset} is inside the payload header`);
			if (offset >= payload.byteLength) throw new MachoFormatIssue("malformed", `load command ${index} LC_LAZY_LOAD_DYLIB_INFO ${label} offset ${offset} is outside the payload`);
			const absolute = Number.isSafeInteger(fileOffset + offset) ? fileOffset + offset : undefined;
			const cached = absolute === undefined ? undefined : work.strings.get(absolute);
			const terminatorLimit = excludeFinalByte ? payload.byteLength - 1 : payload.byteLength;
			if (cached !== undefined && absolute !== undefined) {
				const end = cached.end - fileOffset;
				if (end < offset || end >= terminatorLimit) throw new MachoFormatIssue("malformed", `load command ${index} LC_LAZY_LOAD_DYLIB_INFO ${label} is unterminated`);
				chargeLazyString(work, cached.end - absolute + 1);
				return cached.text;
			}
			if (offset >= terminatorLimit) throw new MachoFormatIssue("malformed", `load command ${index} LC_LAZY_LOAD_DYLIB_INFO ${label} is unterminated`);
			const remaining = MAX_LOAD_COMMAND_BYTES - work.stringBytes;
			const windowEnd = Math.min(terminatorLimit, offset + remaining);
			const end = payload.subarray(0, windowEnd).indexOf(0, offset);
			if (end < 0) {
				if (windowEnd < terminatorLimit) throw new MachoFormatIssue("unsupported", `LC_LAZY_LOAD_DYLIB_INFO string validation occupies ${work.stringBytes + (windowEnd - offset) + 1} bytes, above the ${MAX_LOAD_COMMAND_BYTES}-byte limit`);
				throw new MachoFormatIssue("malformed", `load command ${index} LC_LAZY_LOAD_DYLIB_INFO ${label} is unterminated`);
			}
			chargeLazyString(work, end - offset + 1);
			let text;
			try {
				text = new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				}).decode(payload.subarray(offset, end));
			} catch {
				throw new MachoFormatIssue("malformed", `load command ${index} LC_LAZY_LOAD_DYLIB_INFO ${label} is not UTF-8`);
			}
			if (absolute !== undefined && Number.isSafeInteger(fileOffset + end)) work.strings.set(absolute, {
				text,
				end: fileOffset + end
			});
			return text;
		};
		decodeDependency = (command, body, index) => {
			if (body.byteLength < 24) throw new MachoFormatIssue("malformed", `load command ${index} is too short for a dylib command`);
			const view = viewOf(body);
			const nameOffset = view.getUint32(8, true);
			const usesFlags = nameOffset === 28 && body.byteLength >= 28 && view.getUint32(12, true) === DYLIB_USE_MARKER;
			const flags = usesFlags ? view.getUint32(24, true) : 0;
			return {
				command,
				encoding: usesFlags ? "dylib_use_command" : "dylib_command",
				install_name: commandString(body, usesFlags ? 28 : 24, index),
				weak: command === "LC_LOAD_WEAK_DYLIB" || (flags & DYLIB_USE_WEAK_LINK) !== 0,
				upward: command === "LC_LOAD_UPWARD_DYLIB" || (flags & DYLIB_USE_UPWARD) !== 0,
				reexport: command === "LC_REEXPORT_DYLIB" || (flags & DYLIB_USE_REEXPORT) !== 0,
				delayed_init: (flags & DYLIB_USE_DELAYED_INIT) !== 0,
				current_version: version(view.getUint32(16, true)),
				compatibility_version: version(view.getUint32(20, true))
			};
		};
		commandString = (body, minimumOffset, index) => {
			if (body.byteLength < 12) throw new MachoFormatIssue("malformed", `load command ${index} is too short to hold a string offset`);
			const offset = viewOf(body).getUint32(8, true);
			if (offset < minimumOffset || offset >= body.byteLength) throw new MachoFormatIssue("malformed", `load command ${index} has string offset ${offset} outside the command`);
			const end = body.indexOf(0, offset);
			if (end < 0) throw new MachoFormatIssue("malformed", `load command ${index} has an unterminated string`);
			try {
				return new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				}).decode(body.subarray(offset, end));
			} catch {
				throw new MachoFormatIssue("malformed", `load command ${index} has a string that is not UTF-8`);
			}
		};
		readExact = async (readAt, offset, length, label) => {
			const bytes = await readAt(offset, length);
			if (bytes.byteLength < length) throw new MachoFormatIssue("malformed", `${label} is truncated`);
			return bytes;
		};
		fileTypeName = (fileType) => fileType === 2 ? "execute" : fileType === 6 ? "dylib" : fileType === 8 ? "bundle" : "other";
		version = (value) => `${value >>> 16}.${value >>> 8 & 255}.${value & 255}`;
		swap = (value) => ((value & 255) << 24 | (value & 65280) << 8 | value >>> 8 & 65280 | value >>> 24) >>> 0;
		viewOf = (bytes) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	})))();
}

//#endregion
export { hasMachoMagic, init_MachoLoadCommandReader, readMachoImage };