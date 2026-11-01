import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { init_machoCpuIdentity, machoCpuSubtypeBase } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { MachoLoadCommandCursor, init_machoContainer, init_machoLoadCommands, readFatSliceDeclarations, validateFatSlice, validateFatSliceIdentity } from "./machoLoadCommands-CChRRK2_.js";
import { createHash } from "node:crypto";

//#region dist/native/AppleDispatchDecodeFacts.js
var issue;
function init_AppleDispatchDecodeFacts() {
	return (init_AppleDispatchDecodeFacts = __esmMin((() => {
		issue = (facet, code, message, location) => ({
			facet,
			code,
			message,
			...location === undefined ? {} : { location }
		});
	})))();
}

//#endregion
//#region dist/native/AppleMachoNames.js
var decodeMachoName;
function init_AppleMachoNames() {
	return (init_AppleMachoNames = __esmMin((() => {
		decodeMachoName = (bytes) => {
			try {
				return new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				}).decode(bytes);
			} catch {
				return { bytes_base64: bytes.toString("base64") };
			}
		};
	})))();
}

//#endregion
//#region dist/native/AppleMachoFixups.js
var POINTER_FORMATS, bits, signed, libraryFacts, symbolName, cString, resolvedBind, sameImport, readImport, decodeChainedPointer, readChainedPage, chainedFixups, uleb, REBASE_POINTER_SIZE, REBASE_POINTER, REBASE_NON_POINTER, REBASE_CONFLICT, markRebaseLocation, readRebaseStream, legacyRebaseState, resolveLegacyRebase, parseLegacyRebases, sleb, setBindRegister, readBindStream, resolveLegacyBind, parseLegacyBinds, hasUnresolvedLegacyBytes, parsePointerFixups;
function init_AppleMachoFixups() {
	return (init_AppleMachoFixups = __esmMin((() => {
		init_AppleDispatchDecodeFacts();
		init_AppleMachoNames();
		POINTER_FORMATS = {
			1: "DYLD_CHAINED_PTR_ARM64E",
			2: "DYLD_CHAINED_PTR_64",
			6: "DYLD_CHAINED_PTR_64_OFFSET",
			9: "DYLD_CHAINED_PTR_ARM64E_USERLAND",
			12: "DYLD_CHAINED_PTR_ARM64E_USERLAND24"
		};
		bits = (value, from, width) => value >> BigInt(from) & (1n << BigInt(width)) - 1n;
		signed = (value, width) => value >= 1n << BigInt(width - 1) ? value - (1n << BigInt(width)) : value;
		libraryFacts = (ordinal, dylibs) => {
			if (!Number.isSafeInteger(ordinal) || ordinal < -3) throw new RangeError(`Unsupported dylib ordinal ${String(ordinal)}`);
			if (ordinal > 0) {
				const name = dylibs[ordinal - 1];
				if (name === undefined) throw new RangeError(`Dylib ordinal ${ordinal} exceeds the ${dylibs.length} declared dependencies`);
				return typeof name === "string" ? { library: name } : {
					library: null,
					library_bytes_base64: name.bytes_base64
				};
			}
			return { library: null };
		};
		symbolName = (bytes) => {
			const name = decodeMachoName(bytes);
			return typeof name === "string" ? { symbol: name } : {
				symbol: null,
				symbol_bytes_base64: name.bytes_base64
			};
		};
		cString = (bytes, offset, end) => {
			const stop = bytes.indexOf(0, offset);
			if (offset < 0 || offset >= end || stop < 0 || stop >= end) throw new RangeError("Fixup symbol name is outside the symbol pool");
			return symbolName(bytes.subarray(offset, stop));
		};
		resolvedBind = (imported, addend) => imported.symbol === null || imported.library_bytes_base64 !== undefined ? {
			kind: "unsupported",
			reason: imported.symbol === null ? "Fixup symbol bytes cannot be represented losslessly as UTF-8 text" : "Dylib install-name bytes cannot be represented losslessly as UTF-8 text",
			binding: {
				...imported,
				addend: imported.addend + addend
			}
		} : {
			kind: "bind",
			...imported,
			addend: imported.addend + addend
		};
		sameImport = (left, right) => left.symbol === right.symbol && (left.symbol !== null || right.symbol !== null || left.symbol_bytes_base64 === right.symbol_bytes_base64) && left.binding_source === right.binding_source && left.library_ordinal === right.library_ordinal && left.library === right.library && left.library_bytes_base64 === right.library_bytes_base64 && left.weak === right.weak && left.addend === right.addend;
		readImport = (data, header, index) => {
			const { bytes, base, end, dylibs } = data;
			const size = header.format === 3 ? 16 : header.format === 2 ? 8 : 4;
			if (header.format < 1 || header.format > 3) throw new RangeError(`Unsupported chained import format ${header.format}`);
			if (!Number.isSafeInteger(header.count) || base + header.offset + header.count * size > end) throw new RangeError("Chained import table exceeds the fixup data");
			if (index < 0 || index >= header.count) throw new RangeError("Chained import index is outside the table");
			const at = base + header.offset + index * size;
			if (header.format === 3) {
				const word = bytes.readBigUInt64LE(at);
				const encodedOrdinal = Number(bits(word, 0, 16));
				const ordinal = encodedOrdinal > 65520 ? encodedOrdinal - 65536 : encodedOrdinal;
				return {
					...cString(bytes, base + header.symbols + Number(bits(word, 32, 32)), end),
					binding_source: "chained",
					library_ordinal: ordinal,
					...libraryFacts(ordinal, dylibs),
					weak: bits(word, 16, 1) === 1n,
					addend: bytes.readBigInt64LE(at + 8)
				};
			}
			const word = bytes.readUInt32LE(at);
			const encodedOrdinal = word & 255;
			const ordinal = encodedOrdinal > 240 ? encodedOrdinal - 256 : encodedOrdinal;
			return {
				...cString(bytes, base + header.symbols + (word >>> 9), end),
				binding_source: "chained",
				library_ordinal: ordinal,
				...libraryFacts(ordinal, dylibs),
				weak: (word >>> 8 & 1) === 1,
				addend: header.format === 2 ? BigInt(bytes.readInt32LE(at + 4)) : 0n
			};
		};
		decodeChainedPointer = (raw, format, baseAddress, imports) => {
			const bind = (ordinal, addend) => {
				const target = typeof imports === "function" ? imports(Number(ordinal)) : imports[Number(ordinal)];
				if (target === undefined) throw new RangeError(`Chained bind ordinal ${ordinal} has no import`);
				return resolvedBind(target, addend);
			};
			if (format === 2 || format === 6) {
				if (bits(raw, 63, 1) === 1n) return bind(bits(raw, 0, 24), bits(raw, 24, 8));
				const target = bits(raw, 0, 36) | bits(raw, 36, 8) << 56n;
				return {
					kind: "rebase",
					target: format === 6 ? target + baseAddress : target
				};
			}
			if (format === 1 || format === 9 || format === 12) {
				const auth = bits(raw, 63, 1) === 1n;
				if (bits(raw, 62, 1) === 1n) return bind(bits(raw, 0, format === 12 ? 24 : 16), auth ? 0n : signed(bits(raw, 32, 19), 19));
				if (auth) return {
					kind: "rebase",
					target: bits(raw, 0, 32) + baseAddress
				};
				const target = bits(raw, 0, 43) | bits(raw, 43, 8) << 56n;
				return {
					kind: "rebase",
					target: format === 1 ? target : target + baseAddress
				};
			}
			throw new RangeError(`Unsupported chained pointer format ${format}`);
		};
		readChainedPage = (bytes, source) => {
			let locations = new Uint8Array(0);
			let lastOffset;
			let failure;
			try {
				if ((source.start & 32768) !== 0) throw new RangeError("Multiple chained starts are not valid for 64-bit pointers");
				if (source.start + 8 > source.size) throw new RangeError("Chained pointer leaves its file-backed page");
				locations = new Uint8Array(Math.ceil(source.size / 8));
				const generic = source.format === 2 || source.format === 6;
				let at = source.start;
				while (true) {
					locations[at >>> 3] = (locations[at >>> 3] ?? 0) | 1 << (at & 7);
					lastOffset = at;
					const raw = bytes.readBigUInt64LE(source.offset + at);
					const next = Number(bits(raw, 51, generic ? 12 : 11)) * (generic ? 4 : 8);
					if (next === 0) break;
					if (at + next + 8 > source.size) throw new RangeError("Chained pointer link leaves its file-backed page");
					at += next;
				}
			} catch (cause) {
				failure = cause instanceof Error ? cause.message : String(cause);
			}
			return {
				locations,
				lastOffset,
				failure
			};
		};
		chainedFixups = (image, range, rebases, binds) => {
			const { bytes, segments, dylibs, baseAddress } = image;
			const base = range.offset;
			const end = range.offset + range.size;
			if (!Number.isSafeInteger(base) || base < 0 || !Number.isSafeInteger(range.size) || range.size < 28 || end > bytes.length) throw new RangeError("Chained fixup header exceeds the target");
			if (bytes.readUInt32LE(base) !== 0) throw new RangeError("Unsupported chained fixup header version");
			const startsOffset = bytes.readUInt32LE(base + 4);
			const importHeader = {
				offset: bytes.readUInt32LE(base + 8),
				symbols: bytes.readUInt32LE(base + 12),
				count: bytes.readUInt32LE(base + 16),
				format: bytes.readUInt32LE(base + 20)
			};
			const importSize = importHeader.format === 3 ? 16 : importHeader.format === 2 ? 8 : 4;
			const importTableEnd = base + importHeader.offset + importHeader.count * importSize;
			if (importHeader.format < 1 || importHeader.format > 3) throw new RangeError(`Unsupported chained import format ${importHeader.format}`);
			if (importHeader.offset < 28 || importHeader.symbols < importHeader.offset || importTableEnd > base + importHeader.symbols || base + importHeader.symbols > end) throw new RangeError("Chained import table exceeds the fixup data");
			const imports = (index) => readImport({
				bytes,
				base,
				end,
				dylibs
			}, importHeader, index);
			if (bytes.readUInt32LE(base + 24) !== 0) throw new RangeError("Compressed chained-fixup symbol names are not supported");
			const starts = base + startsOffset;
			const startsEnd = base + importHeader.offset;
			const requireStartsRange = (at, size) => {
				if (at < base + 28 || at > startsEnd - size) throw new RangeError("Chained starts table exceeds its fixup data");
			};
			requireStartsRange(starts, 4);
			const segmentCount = bytes.readUInt32LE(starts);
			if (segmentCount > segments.length) throw new RangeError("Chained starts segment count exceeds the Mach-O layout");
			requireStartsRange(starts, 4 + segmentCount * 4);
			const ranges = [];
			const maximumCachedPages = Math.ceil(bytes.length / 4096) + 2 * segmentCount;
			let remainingLocationBytes = Math.ceil(bytes.length / 8);
			const cachedPages = new Map();
			const pageFacts = (chain, page, start) => {
				const pageOffset = page * chain.pageSize;
				const source = {
					offset: chain.segment.offset + pageOffset,
					size: Math.min(chain.pageSize, Number(chain.segment.size) - pageOffset, bytes.length - chain.segment.offset - pageOffset),
					format: chain.format,
					start
				};
				const key = `${source.offset}:${source.size}:${source.format}:${source.start}`;
				const cached = cachedPages.get(key);
				if (cached !== undefined) return cached;
				const retain = cachedPages.size < maximumCachedPages && Math.ceil(Math.max(source.size, 0) / 8) <= remainingLocationBytes;
				const facts = readChainedPage(bytes, source);
				if (retain) {
					remainingLocationBytes -= facts.locations.byteLength;
					cachedPages.set(key, facts);
				}
				return facts;
			};
			for (let index = 0; index < segmentCount; index++) {
				const infoOffset = bytes.readUInt32LE(starts + 4 + index * 4);
				if (infoOffset === 0) continue;
				const segment = segments[index];
				if (segment === undefined) throw new RangeError("Chained fixup segment table is out of range");
				const info = starts + infoOffset;
				requireStartsRange(info, 22);
				const infoSize = bytes.readUInt32LE(info);
				const pageSize = bytes.readUInt16LE(info + 4);
				const pageCount = bytes.readUInt16LE(info + 20);
				if (infoSize < 22 + pageCount * 2) throw new RangeError("Chained page starts exceed the segment table size");
				requireStartsRange(info, infoSize);
				if (pageSize !== 4096 && pageSize !== 16384) throw new RangeError("Chained page size must be 4096 or 16384 bytes");
				if (bytes.readBigUInt64LE(info + 8) !== segment.address - baseAddress) throw new RangeError("Chained segment offset disagrees with its Mach-O layout");
				ranges.push({
					segment,
					format: bytes.readUInt16LE(info + 6),
					pageSize,
					pageCount,
					pageStarts: info + 22
				});
			}
			const formats = [...new Set(ranges.map(({ format }) => POINTER_FORMATS[format] ?? `format-${format}`))];
			const issues = [
				...rebases.issues,
				...binds.issues,
				...ranges.flatMap(({ format, segment }) => POINTER_FORMATS[format] === undefined ? [issue("pointer_fixups", "unsupported_pointer_format", `Unsupported chained pointer format ${format}`, `0x${segment.address.toString(16)}`)] : [])
			];
			const examinedViews = new Map();
			const decodedRanges = new Set();
			for (const [chainIndex, chain] of ranges.entries()) {
				if (POINTER_FORMATS[chain.format] === undefined) continue;
				const view = `${chain.pageStarts}:${chain.segment.offset}:${chain.segment.size}:${chain.segment.address}:${chain.format}:${chain.pageSize}:${chain.pageCount}`;
				const prior = examinedViews.get(view);
				if (prior !== undefined) {
					if (prior) decodedRanges.add(chainIndex);
					continue;
				}
				let complete = true;
				for (let page = 0; page < chain.pageCount; page++) {
					const start = bytes.readUInt16LE(chain.pageStarts + page * 2);
					if (start === 65535) continue;
					const facts = pageFacts(chain, page, start);
					if (facts.failure !== undefined) {
						complete = false;
						issues.push(issue("pointer_fixups", "chained_pointer_walk_failed", facts.failure, `0x${(chain.segment.address + BigInt(page * chain.pageSize)).toString(16)}`));
						break;
					}
				}
				examinedViews.set(view, complete);
				if (complete) decodedRanges.add(chainIndex);
			}
			const failures = issues.map(({ message }) => message);
			const applicabilityFailures = [...rebases.failures, ...binds.failures];
			const applicabilityComplete = rebases.complete && binds.complete;
			const recordPointerFailure = (reason, address, chainIndex) => {
				const location = `0x${address.toString(16)}`;
				if (!issues.some((entry) => entry.code === "chained_pointer_decode_failed" && entry.location === location)) {
					issues.push(issue("pointer_fixups", "chained_pointer_decode_failed", reason, location));
					failures.push(reason);
				}
				decodedRanges.delete(chainIndex);
			};
			return {
				kind: "chained",
				formats,
				failures,
				issues,
				examined: Math.max(ranges.length, 1) + rebases.examined + binds.examined,
				get decoded() {
					return (ranges.length === 0 ? 1 : decodedRanges.size) + rebases.decoded + binds.decoded;
				},
				legacyRebaseStreams: rebases.examined,
				legacyBindStreams: binds.examined,
				unreadRebaseBytes: rebases.unreadBytes,
				hasUnresolvedLegacyBytes: (address, size) => hasUnresolvedLegacyBytes(segments, rebases, binds, address, size),
				decode(address, raw) {
					const rawPointer = () => applicabilityComplete ? {
						kind: "raw",
						target: raw
					} : {
						kind: "unknown",
						raw,
						reason: `LC_DYLD_INFO pointer-fixup applicability was not completely decoded: ${applicabilityFailures.join("; ")}`
					};
					const legacyBind = resolveLegacyBind(binds.runs, address);
					const legacyRebase = resolveLegacyRebase(segments, rebases.membership, address, raw);
					if (legacyBind?.kind === "unsupported") return legacyBind;
					if (legacyBind !== undefined && legacyRebase !== undefined) return {
						kind: "unsupported",
						reason: `Both bind and rebase records target pointer location 0x${address.toString(16)}`
					};
					if (legacyBind !== undefined && !rebases.complete) return {
						kind: "unknown",
						raw,
						reason: `Legacy rebase opcodes could overlap this bind location: ${rebases.failures.join("; ")}`
					};
					if (legacyRebase !== undefined && !binds.complete) return {
						kind: "unknown",
						raw,
						reason: `Legacy bind opcodes could overlap this rebase location: ${binds.failures.join("; ")}`
					};
					const chainIndex = ranges.findIndex(({ segment }) => address >= segment.address && address < segment.address + segment.size);
					const chain = ranges[chainIndex];
					if (chain === undefined) return legacyBind ?? legacyRebase ?? rawPointer();
					const within = Number(address - chain.segment.address);
					const page = Math.floor(within / chain.pageSize);
					if (page >= chain.pageCount) return legacyBind ?? legacyRebase ?? rawPointer();
					const start = bytes.readUInt16LE(chain.pageStarts + page * 2);
					if (start === 65535) return legacyBind ?? legacyRebase ?? rawPointer();
					if (POINTER_FORMATS[chain.format] === undefined) return {
						kind: "unsupported",
						reason: `Unsupported chained pointer format ${chain.format}`
					};
					try {
						const facts = pageFacts(chain, page, start);
						const at = within % chain.pageSize;
						const locations = facts.locations;
						if (((locations[at >>> 3] ?? 0) & 1 << (at & 7)) !== 0) {
							if (legacyBind !== undefined || legacyRebase !== undefined || !applicabilityComplete) {
								if (legacyBind !== undefined || legacyRebase !== undefined) return {
									kind: "unsupported",
									reason: `Both chained and legacy fixup records target pointer location 0x${address.toString(16)}`
								};
								return {
									kind: "unknown",
									raw,
									reason: `Incomplete legacy fixup streams could overlap chained pointer location 0x${address.toString(16)}: ${applicabilityFailures.join("; ")}`
								};
							}
							const decoded = decodeChainedPointer(raw, chain.format, baseAddress, imports);
							if (decoded.kind === "unsupported") recordPointerFailure(decoded.reason, address, chainIndex);
							return decoded;
						}
						if (facts.failure !== undefined && (facts.lastOffset === undefined || at > facts.lastOffset)) throw new RangeError(facts.failure);
						return legacyBind ?? legacyRebase ?? rawPointer();
					} catch (cause) {
						const reason = cause instanceof Error ? cause.message : String(cause);
						recordPointerFailure(reason, address, chainIndex);
						return {
							kind: "unsupported",
							reason
						};
					}
				}
			};
		};
		uleb = (bytes, cursor, end, stream = "bind", rebaseWork) => {
			let value = 0n;
			let shift = 0;
			for (;;) {
				if (cursor.at >= end) throw new RangeError(`Truncated ${stream} opcode operand`);
				if (rebaseWork !== undefined) {
					if (rebaseWork.workRemaining === 0) throw new RangeError("Legacy rebase parsing exceeded the source-derived work budget");
					rebaseWork.workRemaining--;
				}
				const byte = bytes[cursor.at++] ?? 0;
				const slice = byte & 127;
				if (shift === 63 && slice > 1 || shift === 64 && slice !== 0) throw new RangeError(`Oversized ${stream} opcode operand`);
				if (shift < 64) value |= BigInt(slice) << BigInt(shift);
				shift = Math.min(64, shift + 7);
				if ((byte & 128) === 0) return value;
			}
		};
		REBASE_POINTER_SIZE = 8n;
		REBASE_POINTER = 1;
		REBASE_NON_POINTER = 2;
		REBASE_CONFLICT = 3;
		markRebaseLocation = (index, fileOffset, type, fileBytes) => {
			index.bitmap ??= new Uint8Array(Math.ceil(fileBytes / 4));
			const at = Math.floor(fileOffset / 4);
			const shift = fileOffset % 4 * 2;
			const previous = (index.bitmap[at] ?? 0) >> shift & 3;
			const next = previous === 0 || previous === type ? type : REBASE_CONFLICT;
			index.bitmap[at] = (index.bitmap[at] ?? 0) & ~(3 << shift) | next << shift;
		};
		readRebaseStream = (image, range, index) => {
			const { bytes, segments } = image;
			const end = range.offset + range.size;
			if (!Number.isSafeInteger(range.offset) || !Number.isSafeInteger(range.size) || range.offset < 0 || range.size < 0 || !Number.isSafeInteger(end) || end > bytes.length) throw new RangeError("Rebase opcodes exceed the target");
			const cursor = { at: range.offset };
			let segmentIndex = -1;
			let segmentOffset = 0n;
			let type = 0;
			const addRun = (count, skip) => {
				if (count === 0n) return;
				if (type === 0 || type > 3) throw new RangeError(`Unsupported legacy rebase type ${type}`);
				const segment = segments[segmentIndex];
				if (segment === undefined) throw new RangeError("Rebase location has no selected segment");
				const stride = REBASE_POINTER_SIZE + skip;
				const lastOffset = segmentOffset + (count - 1n) * stride;
				if (segmentOffset < 0n || lastOffset + REBASE_POINTER_SIZE > segment.size) throw new RangeError("Rebase expansion leaves its file-backed segment");
				if (!Number.isSafeInteger(segment.offset) || segment.offset < 0) throw new RangeError("Rebase segment file offset is invalid");
				const firstFileOffset = BigInt(segment.offset) + segmentOffset;
				if (firstFileOffset < 0n || lastOffset + BigInt(segment.offset) + REBASE_POINTER_SIZE > BigInt(bytes.length)) throw new RangeError("Rebase location exceeds the source file");
				const fact = type === 1 ? REBASE_POINTER : REBASE_NON_POINTER;
				const admitted = count < BigInt(index.workRemaining) ? count : BigInt(index.workRemaining);
				for (let indexOffset = 0n; indexOffset < admitted; indexOffset++) {
					const fileOffset = Number(firstFileOffset + indexOffset * stride);
					markRebaseLocation(index, fileOffset, fact, bytes.length);
				}
				index.workRemaining -= Number(admitted);
				if (admitted < count) throw new RangeError("Legacy rebase opcode and expansion work exceeded the source-derived budget");
				segmentOffset += count * stride;
			};
			while (cursor.at < end) {
				if (index.workRemaining === 0) throw new RangeError("Legacy rebase parsing exceeded the source-derived work budget");
				index.workRemaining--;
				const byte = bytes[cursor.at++] ?? 0;
				const immediate = byte & 15;
				switch (byte & 240) {
					case 0:
						if (end - cursor.at > 15) throw new RangeError("Rebase opcodes terminated before the stream end");
						cursor.at = end;
						break;
					case 16:
						type = immediate;
						break;
					case 32: {
						if (segments[immediate] === undefined) throw new RangeError("Rebase segment index is out of range");
						segmentIndex = immediate;
						segmentOffset = uleb(bytes, cursor, end, "rebase", index);
						break;
					}
					case 48:
						segmentOffset += uleb(bytes, cursor, end, "rebase", index);
						break;
					case 64:
						segmentOffset += BigInt(immediate) * REBASE_POINTER_SIZE;
						break;
					case 80:
						addRun(BigInt(immediate), 0n);
						break;
					case 96: {
						const count = uleb(bytes, cursor, end, "rebase", index);
						addRun(count, 0n);
						break;
					}
					case 112: {
						addRun(1n, 0n);
						segmentOffset += uleb(bytes, cursor, end, "rebase", index);
						break;
					}
					case 128: {
						const count = uleb(bytes, cursor, end, "rebase", index);
						const skip = uleb(bytes, cursor, end, "rebase", index);
						addRun(count, skip);
						break;
					}
					default: throw new RangeError(`Unsupported rebase opcode 0x${byte.toString(16)}`);
				}
			}
		};
		legacyRebaseState = (segments, membership, address) => {
			if (membership === null) return 0;
			let fileOffset;
			for (const segment of segments) {
				const relative = address - segment.address;
				if (relative < 0n || relative + REBASE_POINTER_SIZE > segment.size) continue;
				if (fileOffset !== undefined) return {
					kind: "unsupported",
					reason: `Ambiguous segments map legacy rebase pointer location 0x${address.toString(16)}`
				};
				const mapped = BigInt(segment.offset) + relative;
				if (mapped < 0n || mapped > BigInt(Number.MAX_SAFE_INTEGER)) return {
					kind: "unsupported",
					reason: "Legacy rebase file offset exceeds the safe integer range"
				};
				fileOffset = Number(mapped);
			}
			if (fileOffset === undefined) return 0;
			const at = Math.floor(fileOffset / 4);
			const shift = fileOffset % 4 * 2;
			return (membership[at] ?? 0) >> shift & 3;
		};
		resolveLegacyRebase = (segments, membership, address, raw) => {
			const state = legacyRebaseState(segments, membership, address);
			if (typeof state !== "number") return state;
			if (state === 0) return undefined;
			if (state === REBASE_POINTER) return {
				kind: "rebase",
				target: raw
			};
			return {
				kind: "unsupported",
				reason: state === REBASE_CONFLICT ? `Conflicting legacy rebase kinds target pointer location 0x${address.toString(16)}` : "Legacy non-pointer rebase is not a 64-bit metadata pointer"
			};
		};
		parseLegacyRebases = (image, streams) => {
			const workBudget = Math.min(Number.MAX_SAFE_INTEGER, image.bytes.length * 2);
			const index = {
				bitmap: null,
				workRemaining: workBudget
			};
			const failures = [];
			let decoded = 0;
			let unreadBytes = 0;
			for (const stream of streams) {
				try {
					readRebaseStream(image, stream, index);
					decoded++;
				} catch (cause) {
					failures.push(`rebase opcodes: ${cause instanceof Error ? cause.message : String(cause)}`);
					unreadBytes += stream.size;
				}
			}
			return {
				membership: index.bitmap,
				failures,
				issues: failures.map((message) => issue("pointer_fixups", "rebase_stream_decode_failed", message)),
				examined: streams.length,
				decoded,
				unreadBytes,
				complete: failures.length === 0
			};
		};
		sleb = (bytes, cursor, end) => {
			let value = 0n;
			let shift = 0;
			let byte = 0;
			do {
				if (cursor.at >= end) throw new RangeError("Truncated bind opcode operand");
				byte = bytes[cursor.at++] ?? 0;
				const slice = byte & 127;
				if (shift === 63 && slice !== 0 && slice !== 127 || shift === 64 && slice !== (value < 0n ? 127 : 0)) throw new RangeError("Oversized bind opcode operand");
				if (shift < 64) value = BigInt.asIntN(64, value | BigInt(slice) << BigInt(shift));
				shift = Math.min(64, shift + 7);
			} while ((byte & 128) !== 0);
			return shift < 64 && (byte & 64) !== 0 ? value - (1n << BigInt(shift)) : value;
		};
		setBindRegister = (image, stream, state, byte) => {
			const { bytes } = image;
			const { cursor, end } = stream;
			const immediate = byte & 15;
			switch (byte & 240) {
				case 16:
					state.ordinal = immediate;
					state.ordinalFailure = null;
					return true;
				case 32:
					{
						const ordinal = uleb(bytes, cursor, end);
						if (ordinal > BigInt(Number.MAX_SAFE_INTEGER)) {
							state.ordinal = 0;
							state.ordinalFailure = `Dylib ordinal ${ordinal} exceeds the safe integer range`;
						} else {
							state.ordinal = Number(ordinal);
							state.ordinalFailure = null;
						}
					}
					return true;
				case 48:
					state.ordinal = immediate === 0 ? 0 : immediate - 16;
					state.ordinalFailure = null;
					return true;
				case 64: {
					const stop = bytes.indexOf(0, cursor.at);
					if (stop < 0 || stop >= end) throw new RangeError("Unterminated bind symbol");
					state.symbol = symbolName(bytes.subarray(cursor.at, stop));
					state.weak = (immediate & 1) !== 0;
					cursor.at = stop + 1;
					return true;
				}
				case 80: return true;
				case 96:
					state.addend = sleb(bytes, cursor, end);
					return true;
				case 112: {
					const segment = image.segments[immediate];
					if (segment === undefined) throw new RangeError("Bind segment index is out of range");
					state.segmentIndex = immediate;
					state.address = segment.address + uleb(bytes, cursor, end);
					return true;
				}
				case 128:
					state.address = state.address + uleb(bytes, cursor, end) & 18446744073709551615n;
					return true;
				default: return false;
			}
		};
		readBindStream = (image, range, binds) => {
			const { bytes } = image;
			const end = range.offset + range.size;
			if (end > bytes.length) throw new RangeError("Bind opcodes exceed the target");
			const cursor = { at: range.offset };
			const state = {
				ordinal: 0,
				ordinalFailure: null,
				segmentIndex: -1,
				symbol: { symbol: "" },
				weak: false,
				addend: 0n,
				address: 0n
			};
			const preflightRun = (count, skip) => {
				if (count === 0n) return;
				const segment = image.segments[state.segmentIndex];
				if (segment === undefined) throw new RangeError("Bind location has no selected segment");
				const stride = 8n + skip;
				const end = state.address + (count - 1n) * stride + 8n;
				if (state.address < segment.address || end > segment.address + segment.size) throw new RangeError("Bind expansion leaves its file-backed segment");
			};
			const bind = (count, skip) => {
				if (count === 0n) return;
				preflightRun(count, skip);
				const stride = 8n + skip;
				let binding;
				try {
					if (state.ordinalFailure !== null) throw new RangeError(state.ordinalFailure);
					const resolvedLibrary = libraryFacts(state.ordinal, image.dylibs);
					const decoded = resolvedBind({
						...state.symbol,
						binding_source: range.stream,
						library_ordinal: state.ordinal,
						...range.stream === "weak" ? { library: null } : resolvedLibrary,
						weak: state.weak,
						addend: state.addend
					}, 0n);
					binding = decoded.kind === "bind" ? {
						kind: "bind",
						value: decoded
					} : decoded;
				} catch (cause) {
					binding = {
						kind: "unsupported",
						reason: cause instanceof Error ? cause.message : String(cause)
					};
				}
				const previous = binds.at(-1);
				const sameBinding = (left, right) => left.kind === "unsupported" && right.kind === "unsupported" ? left.reason === right.reason && (left.binding === undefined || right.binding === undefined ? left.binding === right.binding : sameImport(left.binding, right.binding)) : left.kind === "bind" && right.kind === "bind" ? sameImport(left.value, right.value) : false;
				if (previous !== undefined && previous.stride === stride && previous.start + previous.count * stride === state.address && sameBinding(previous.binding, binding)) {
					previous.count += count;
				} else {
					binds.push({
						start: state.address,
						count,
						stride,
						binding
					});
				}
				state.address = state.address + count * stride & 18446744073709551615n;
			};
			while (cursor.at < end) {
				const byte = bytes[cursor.at++] ?? 0;
				if (setBindRegister(image, {
					cursor,
					end
				}, state, byte)) continue;
				switch (byte & 240) {
					case 0:
						if (range.stream !== "lazy") return;
						break;
					case 144:
						bind(1n, 0n);
						break;
					case 160:
						bind(1n, uleb(bytes, cursor, end));
						break;
					case 176:
						bind(1n, BigInt(byte & 15) * 8n);
						break;
					case 192: {
						if (range.stream === "lazy") throw new RangeError("Lazy bind streams do not support repeated bind opcodes");
						const count = uleb(bytes, cursor, end);
						const skip = uleb(bytes, cursor, end);
						bind(count, skip);
						break;
					}
					default: throw new RangeError(`Unsupported bind opcode 0x${byte.toString(16)}`);
				}
			}
		};
		resolveLegacyBind = (runs, address) => {
			let match;
			for (const run of runs) {
				const distance = address - run.start;
				if (distance >= 0n && distance % run.stride === 0n && distance / run.stride < run.count) {
					if (match !== undefined) return {
						kind: "unsupported",
						reason: `Ambiguous bind records target pointer location 0x${address.toString(16)}`
					};
					match = run;
				}
			}
			return match === undefined ? undefined : match.binding.kind === "unsupported" ? match.binding : {
				kind: "bind",
				...match.binding.value
			};
		};
		parseLegacyBinds = (image, streams) => {
			const runs = [];
			const failures = [];
			let decoded = 0;
			for (const stream of streams) {
				try {
					readBindStream(image, stream, runs);
					decoded++;
				} catch (cause) {
					failures.push(`${stream.stream} bind opcodes: ${cause instanceof Error ? cause.message : String(cause)}`);
				}
			}
			const complete = failures.length === 0;
			const issues = failures.map((message) => issue("pointer_fixups", "bind_stream_decode_failed", message));
			for (const run of runs) {
				if (run.binding.kind !== "unsupported" || run.binding.binding === undefined) continue;
				issues.push(issue("pointer_fixups", run.binding.binding.symbol === null ? "bind_symbol_text_unavailable" : "bind_library_text_unavailable", run.binding.reason, `0x${run.start.toString(16)}`));
				failures.push(run.binding.reason);
			}
			return {
				runs,
				failures,
				issues,
				examined: streams.length,
				decoded,
				complete
			};
		};
		hasUnresolvedLegacyBytes = (segments, rebases, binds, address, size) => {
			if (size <= 0) return false;
			if (!rebases.complete || !binds.complete) return true;
			const first = address - 7n;
			const end = address + BigInt(size);
			for (const run of binds.runs) {
				const index = first <= run.start ? 0n : (first - run.start + run.stride - 1n) / run.stride;
				if (index < run.count && run.start + index * run.stride < end) return true;
			}
			if (rebases.membership !== null) for (let slot = first; slot < end; slot++) {
				const state = legacyRebaseState(segments, rebases.membership, slot);
				if (typeof state !== "number" || state === REBASE_CONFLICT || state === REBASE_NON_POINTER && slot + 4n > address) return true;
			}
			return false;
		};
		parsePointerFixups = (bytes, commands, segments, baseAddress) => {
			const image = {
				bytes,
				segments,
				dylibs: commands.dylibs,
				baseAddress
			};
			const rebases = parseLegacyRebases(image, commands.rebases);
			const binds = parseLegacyBinds(image, commands.binds);
			if (commands.chained !== null) {
				return chainedFixups(image, commands.chained, rebases, binds);
			}
			const applicabilityFailures = [...rebases.failures, ...binds.failures];
			const applicabilityComplete = rebases.complete && binds.complete;
			const rawPointer = (raw) => applicabilityComplete ? {
				kind: "raw",
				target: raw
			} : {
				kind: "unknown",
				raw,
				reason: `LC_DYLD_INFO pointer-fixup applicability was not completely decoded: ${applicabilityFailures.join("; ")}`
			};
			if (commands.binds.length === 0 && commands.rebases.length === 0) return {
				kind: "none",
				formats: [],
				failures: [],
				issues: [],
				examined: 0,
				decoded: 0,
				legacyRebaseStreams: 0,
				legacyBindStreams: 0,
				unreadRebaseBytes: 0,
				hasUnresolvedLegacyBytes: () => false,
				decode: (_address, raw) => rawPointer(raw)
			};
			const failures = [...rebases.failures, ...binds.failures];
			const issues = [...rebases.issues, ...binds.issues];
			return {
				kind: "dyld-info",
				formats: [],
				failures,
				issues,
				examined: binds.examined + rebases.examined,
				decoded: binds.decoded + rebases.decoded,
				legacyRebaseStreams: rebases.examined,
				legacyBindStreams: binds.examined,
				unreadRebaseBytes: rebases.unreadBytes,
				hasUnresolvedLegacyBytes: (address, size) => hasUnresolvedLegacyBytes(segments, rebases, binds, address, size),
				decode(address, raw) {
					const match = resolveLegacyBind(binds.runs, address);
					const rebase = resolveLegacyRebase(segments, rebases.membership, address, raw);
					if (match?.kind === "unsupported") return match;
					if (match !== undefined && rebase !== undefined) return {
						kind: "unsupported",
						reason: `Both bind and rebase records target pointer location 0x${address.toString(16)}`
					};
					if (match !== undefined && !rebases.complete) return {
						kind: "unknown",
						raw,
						reason: `Legacy rebase opcodes could overlap this bind location: ${rebases.failures.join("; ")}`
					};
					if (match !== undefined) return match;
					if (rebase !== undefined && !binds.complete) return {
						kind: "unknown",
						raw,
						reason: `Legacy bind opcodes could overlap this rebase location: ${binds.failures.join("; ")}`
					};
					return rebase ?? rawPointer(raw);
				}
			};
		};
	})))();
}

//#endregion
//#region dist/native/MachoArchitectureSelection.js
var MACHO_ARCHITECTURE_POLICIES, machoSubtypeRank, selectMachoArchitectureName;
function init_MachoArchitectureSelection() {
	return (init_MachoArchitectureSelection = __esmMin((() => {
		init_machoCpuIdentity();
		MACHO_ARCHITECTURE_POLICIES = {
			x86: {
				cpuType: 7,
				subtypes: [{
					subtype: 3,
					name: "i386"
				}]
			},
			x86_64: {
				cpuType: 16777223,
				subtypes: [{
					subtype: 3,
					name: "x86_64"
				}]
			},
			arm: {
				cpuType: 12,
				subtypes: [],
				variantName: /^arm$/u
			},
			arm64: {
				cpuType: 16777228,
				subtypes: [
					{
						subtype: 0,
						name: "arm64"
					},
					{
						subtype: 2,
						name: "arm64e"
					},
					{
						subtype: 1,
						name: "arm64v8"
					}
				],
				variantName: /^arm64e\.[A-Za-z0-9_]+$/u
			},
			arm64_32: {
				cpuType: 33554444,
				subtypes: [{
					subtype: 1,
					name: "arm64_32"
				}]
			}
		};
		machoSubtypeRank = (policy, subtype) => {
			const rank = policy.subtypes.findIndex((candidate) => candidate.subtype === machoCpuSubtypeBase(subtype));
			return rank < 0 ? policy.subtypes.length : rank;
		};
		selectMachoArchitectureName = (policy, available) => {
			let selected;
			let bestRank = Number.POSITIVE_INFINITY;
			for (const architecture of available) {
				if (architecture.cpu_type_code !== null && architecture.cpu_type_code !== policy.cpuType) continue;
				const namedSubtype = policy.subtypes.find(({ name }) => name === architecture.name);
				const recognizedName = namedSubtype !== undefined || policy.variantName?.test(architecture.name);
				if (!recognizedName && (architecture.cpu_type_code === null || architecture.cpu_subtype_base === null)) continue;
				const subtype = architecture.cpu_subtype_base ?? namedSubtype?.subtype;
				const rank = subtype === undefined ? policy.subtypes.length : machoSubtypeRank(policy, subtype);
				if (rank >= bestRank) continue;
				selected = architecture.name;
				bestRank = rank;
			}
			return selected;
		};
	})))();
}

//#endregion
//#region dist/native/AppleMachoSelection.js
var hex, fatHeaderFormat, selectMachoSlice, MH_MAGIC, MH_CIGAM, MH_CIGAM_64, UnsupportedMachoMetadataFormatError, parseMachoLayout, collectSegment, LC_DYLD_INFO, LC_DYLD_INFO_ONLY, LC_DYLD_CHAINED_FIXUPS, DYLIB_COMMANDS, collectFixupCommand;
function init_AppleMachoSelection() {
	return (init_AppleMachoSelection = __esmMin((() => {
		init_machoLoadCommands();
		init_AppleMachoNames();
		init_MachoArchitectureSelection();
		init_machoCpuIdentity();
		init_machoContainer();
		hex = (value) => `0x${value.toString(16)}`;
		fatHeaderFormat = (magic) => {
			switch (magic) {
				case 3405691582: return {
					littleEndian: false,
					fat64: false
				};
				case 3405691583: return {
					littleEndian: false,
					fat64: true
				};
				case 3199925962: return {
					littleEndian: true,
					fat64: false
				};
				case 3216703178: return {
					littleEndian: true,
					fat64: true
				};
				default: return null;
			}
		};
		selectMachoSlice = (bytes, architecture) => {
			const magic = bytes.readUInt32BE(0);
			const header = fatHeaderFormat(magic);
			if (header === null) return {
				slice: 0,
				sliceEnd: bytes.length
			};
			const { littleEndian, fat64 } = header;
			const stride = fat64 ? 32 : 20;
			const readUInt32 = littleEndian ? (offset) => bytes.readUInt32LE(offset) : (offset) => bytes.readUInt32BE(offset);
			const byteOrder = littleEndian ? "little-endian" : "big-endian";
			const malformed = (reason) => new RangeError(`${reason} (FAT header byte order: ${byteOrder})`);
			const invalid = (reason) => new TypeError(`${reason} (FAT header byte order: ${byteOrder})`);
			if (bytes.length < 8) throw malformed("Malformed FAT architecture table");
			const count = readUInt32(4);
			const headerEnd = 8 + count * stride;
			if (count > 128 || headerEnd > bytes.length) throw malformed("Malformed FAT architecture table");
			const policy = MACHO_ARCHITECTURE_POLICIES[architecture];
			if (policy === undefined) throw invalid("Requested FAT architecture is absent");
			const declarations = readFatSliceDeclarations(bytes.subarray(8, headerEnd), {
				count,
				wide: fat64,
				littleEndian
			});
			if (declarations.status !== "parsed") throw malformed(declarations.reason);
			let best;
			let bestRank = Number.POSITIVE_INFINITY;
			let ambiguous = false;
			for (const declaration of declarations.slices) {
				const issue = validateFatSlice(declaration, bytes.length, headerEnd);
				if (issue !== null) throw malformed(issue);
				if (declaration.cpuType !== policy.cpuType) continue;
				const rank = machoSubtypeRank(policy, declaration.cpuSubtype);
				if (best !== undefined && rank >= bestRank) {
					if (rank === bestRank && machoCpuSubtypeBase(declaration.cpuSubtype) === machoCpuSubtypeBase(best.cpuSubtype)) ambiguous = true;
					continue;
				}
				best = declaration;
				bestRank = rank;
				ambiguous = false;
			}
			if (best === undefined) throw invalid("Requested FAT architecture is absent");
			if (ambiguous) throw invalid("Ambiguous FAT architecture slice");
			const selected = {
				slice: best.offset,
				sliceEnd: best.offset + best.size,
				fatDeclaration: {
					...best,
					tableEnd: headerEnd
				}
			};
			return selected;
		};
		MH_MAGIC = 4277009102;
		MH_CIGAM = 3472551422;
		MH_CIGAM_64 = 3489328638;
		UnsupportedMachoMetadataFormatError = class extends Error {
			constructor(message) {
				super(message);
				this.name = "UnsupportedMachoMetadataFormatError";
			}
		};
		parseMachoLayout = (bytes, architecture) => {
			if (bytes.length < 4) throw new RangeError("Truncated Mach-O header");
			const selection = selectMachoSlice(bytes, architecture);
			const { slice, sliceEnd } = selection;
			if (slice + 4 > sliceEnd) throw new RangeError("Truncated Mach-O header");
			const selectedMagic = bytes.readUInt32LE(slice);
			const is32Bit = selectedMagic === MH_MAGIC || selectedMagic === MH_CIGAM;
			const isBigEndian = selectedMagic === MH_CIGAM || selectedMagic === MH_CIGAM_64;
			const headerSize = is32Bit ? 28 : 32;
			const recognizedMagic = is32Bit || selectedMagic === 4277009103 || selectedMagic === MH_CIGAM_64;
			if (!recognizedMagic && slice + 32 > sliceEnd) throw new RangeError("Truncated Mach-O header");
			if (!recognizedMagic) throw new TypeError("Only little-endian 64-bit Mach-O metadata is supported");
			if (slice + headerSize > sliceEnd) throw new RangeError("Truncated Mach-O header");
			const readHeaderUInt32 = isBigEndian ? (offset) => bytes.readUInt32BE(offset) : (offset) => bytes.readUInt32LE(offset);
			const cpuType = readHeaderUInt32(slice + 4);
			const cpuSubtype = readHeaderUInt32(slice + 8);
			const fat = selection.fatDeclaration;
			if (fat !== undefined) {
				const issue = validateFatSliceIdentity(fat, {
					cpuType,
					cpuSubtype
				});
				if (issue !== null) throw new TypeError(issue);
			}
			if (selectedMagic === MH_CIGAM_64) {
				if (cpuType !== 16777234) throw new TypeError("Unsupported big-endian Mach-O CPU type");
				throw new UnsupportedMachoMetadataFormatError("Unsupported big-endian 64-bit PowerPC Mach-O metadata");
			}
			if (MACHO_ARCHITECTURE_POLICIES[architecture]?.cpuType !== cpuType) throw new TypeError(`Mach-O CPU type does not match requested architecture ${architecture}`);
			if (is32Bit) throw new UnsupportedMachoMetadataFormatError(`Unsupported 32-bit Mach-O metadata for requested CPU type ${architecture}`);
			const commands = bytes.readUInt32LE(slice + 16);
			const commandEnd = slice + 32 + bytes.readUInt32LE(slice + 20);
			if (commands > 4096 || commandEnd > sliceEnd) throw new RangeError("Malformed Mach-O command bounds");
			const state = {
				slice,
				sliceEnd,
				segments: [],
				sections: [],
				dylibs: [],
				binds: [],
				rebases: [],
				chained: null,
				baseAddress: undefined
			};
			const framing = new MachoLoadCommandCursor({
				wide: true,
				littleEndian: true,
				commandCount: commands,
				commandBytes: commandEnd - slice - 32
			});
			while (framing.nextOffset !== null) {
				const cursor = slice + 32 + framing.nextOffset;
				const frame = framing.read(bytes.subarray(cursor, cursor + 8));
				if (!frame.ok) throw new RangeError(frame.error);
				const command = {
					cursor,
					kind: frame.value.command,
					size: frame.value.size
				};
				if (command.kind === 25) collectSegment(bytes, command, state);
				else collectFixupCommand(bytes, command, state);
			}
			const complete = framing.finish();
			if (!complete.ok) throw new RangeError(complete.error);
			const { segments, sections, chained, binds, rebases, dylibs } = state;
			const offset = (address, size = 1) => {
				const matches = segments.filter((segment) => address >= segment.address && address + BigInt(size) <= segment.address + segment.size);
				if (matches.length !== 1) throw new RangeError(`Unmapped or ambiguous metadata pointer ${hex(address)}`);
				const segment = matches[0];
				if (segment === undefined) throw new RangeError("Missing metadata segment");
				return segment.offset + Number(address - segment.address);
			};
			return {
				segments,
				sections,
				selectedImage: {
					container: fat === undefined ? "thin" : "fat",
					offset: slice,
					byteLength: sliceEnd - slice,
					cpuType,
					cpuSubtype,
					containerTableSha256: fat === undefined ? null : createHash("sha256").update(bytes.subarray(0, fat.tableEnd)).digest("hex")
				},
				offset,
				fixups: {
					chained,
					binds,
					rebases,
					dylibs
				},
				baseAddress: state.baseAddress ?? 0n
			};
		};
		collectSegment = (bytes, { cursor, size }, state) => {
			if (size < 72) throw new RangeError("Truncated segment command");
			const address = bytes.readBigUInt64LE(cursor + 24), fileSize = bytes.readBigUInt64LE(cursor + 48), fileOffset = bytes.readBigUInt64LE(cursor + 40);
			if (fileOffset + fileSize > BigInt(state.sliceEnd - state.slice)) throw new RangeError("Segment file range exceeds target bytes");
			state.segments.push({
				address,
				size: fileSize,
				offset: state.slice + Number(fileOffset),
				executable: (bytes.readUInt32LE(cursor + 60) & 4) !== 0
			});
			if (fileOffset === 0n && fileSize > 0n) state.baseAddress ??= address;
			const count = bytes.readUInt32LE(cursor + 64);
			if (72 + count * 80 > size) throw new RangeError("Truncated section table");
			for (let section = 0; section < count; section++) {
				const position = cursor + 72 + section * 80;
				const sectionSize = bytes.readBigUInt64LE(position + 40);
				if (sectionSize > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("Section size exceeds exact numeric range");
				state.sections.push({
					name: bytes.subarray(position, position + 16).toString("latin1").replace(/\0.*$/u, ""),
					address: bytes.readBigUInt64LE(position + 32),
					size: Number(sectionSize)
				});
			}
		};
		LC_DYLD_INFO = 34;
		LC_DYLD_INFO_ONLY = 2147483682;
		LC_DYLD_CHAINED_FIXUPS = 2147483700;
		DYLIB_COMMANDS = [
			12,
			2147483672,
			2147483679,
			32,
			2147483683
		];
		collectFixupCommand = (bytes, { cursor, kind, size }, state) => {
			const range = (at) => {
				const offset = state.slice + bytes.readUInt32LE(at);
				const length = bytes.readUInt32LE(at + 4);
				if (offset + length > state.sliceEnd) throw new RangeError("Fixup data exceeds the Mach-O slice");
				return {
					offset,
					size: length
				};
			};
			if (kind === LC_DYLD_CHAINED_FIXUPS) {
				if (size < 16) throw new RangeError("Truncated chained-fixups command");
				state.chained = range(cursor + 8);
			} else if (kind === LC_DYLD_INFO || kind === LC_DYLD_INFO_ONLY) {
				if (size < 48) throw new RangeError("Truncated dyld-info command");
				const rebase = range(cursor + 8);
				if (rebase.size > 0) state.rebases.push(rebase);
				for (const [at, stream] of [
					[cursor + 16, "bind"],
					[cursor + 24, "weak"],
					[cursor + 32, "lazy"]
				]) {
					const bound = range(at);
					if (bound.size > 0) state.binds.push({
						...bound,
						stream
					});
				}
			} else if (DYLIB_COMMANDS.includes(kind)) {
				if (size < 24) throw new RangeError("Truncated dylib command");
				const nameOffset = bytes.readUInt32LE(cursor + 8);
				if (nameOffset < 24 || nameOffset >= size) throw new RangeError("Dylib install name is outside its load command");
				const end = bytes.indexOf(0, cursor + nameOffset);
				if (end < 0 || end >= cursor + size) throw new RangeError("Unterminated dylib install name");
				state.dylibs.push(decodeMachoName(bytes.subarray(cursor + nameOffset, end)));
			}
		};
	})))();
}

//#endregion
export { MACHO_ARCHITECTURE_POLICIES, UnsupportedMachoMetadataFormatError, init_AppleDispatchDecodeFacts, init_AppleMachoFixups, init_AppleMachoSelection, init_MachoArchitectureSelection, issue, parseMachoLayout, parsePointerFixups, selectMachoArchitectureName };