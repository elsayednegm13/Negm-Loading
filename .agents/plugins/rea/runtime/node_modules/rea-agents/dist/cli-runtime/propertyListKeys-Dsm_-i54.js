import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { err, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { copyPlistUidIdentity, createPlistNumberCollector, init_plistNumbers, init_plistUid, markPlistDictionary } from "./interfaceBuilderGraph-DKoO7eCM.js";
import { PlistNestingLimitError, UnknownPlistScalar, init_plistValue, init_unknownPlistScalar } from "./toolOutputSchemaGroups-D49U2-8O.js";
import { hasBinaryPlistSignature, init_appleArchiveFormat } from "./appleArchiveFormat-B-JoSBSY.js";
import { parseOpenStep } from "plist";
import { DOMParser, onErrorStopParsing } from "@xmldom/xmldom";
import { SaxesParser } from "saxes";

//#region dist/domain/propertyListXmlText.js
var XmlPlistTextDecodeError, decodeXmlPlistText, declaredEncoding, asciiXmlDeclaration, verifyEncodingDeclaration;
function init_propertyListXmlText() {
	return (init_propertyListXmlText = __esmMin((() => {
		XmlPlistTextDecodeError = class extends TypeError {
			reason;
			declaredEncoding;
			constructor(reason, message, declaredEncoding, options) {
				super(message, options);
				this.reason = reason;
				this.declaredEncoding = declaredEncoding;
				this.name = "XmlPlistTextDecodeError";
			}
		};
		decodeXmlPlistText = (bytes) => {
			if (bytes[0] === 255 && bytes[1] === 254 && bytes[2] === 0 && bytes[3] === 0 || bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 254 && bytes[3] === 255) throw new XmlPlistTextDecodeError("unsupported-encoding", "Unsupported XML encoding: UTF-32. Supported encodings are UTF-8 and BOM-marked UTF-16 in either byte order.", "UTF-32");
			const encoding = bytes[0] === 255 && bytes[1] === 254 ? "utf-16le" : bytes[0] === 254 && bytes[1] === 255 ? "utf-16be" : "utf-8";
			const prolog = encoding === "utf-8" ? asciiXmlDeclaration(bytes) : undefined;
			const declaration = prolog === undefined ? undefined : declaredEncoding(prolog);
			if (prolog !== undefined) verifyEncodingDeclaration(declaration, encoding);
			let text;
			try {
				text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
			} catch (cause) {
				throw new XmlPlistTextDecodeError("invalid-bytes", "XML text bytes are invalid for the detected encoding", undefined, { cause });
			}
			if (prolog === undefined) verifyEncodingDeclaration(declaredEncoding(text), encoding);
			return text;
		};
		declaredEncoding = (text) => /^<\?xml\s[^?]*\bencoding\s*=\s*["']([^"']+)["']/u.exec(text)?.[1];
		asciiXmlDeclaration = (bytes) => {
			const start = bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191 ? 3 : 0;
			if (bytes[start] !== 60 || bytes[start + 1] !== 63 || bytes[start + 2] !== 120 || bytes[start + 3] !== 109 || bytes[start + 4] !== 108) return undefined;
			for (let index = start + 5; index < bytes.length; index += 1) {
				if (bytes[index] > 127) return undefined;
				if (bytes[index] === 63 && bytes[index + 1] === 62) return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(start, index + 2));
			}
			return undefined;
		};
		verifyEncodingDeclaration = (declaration, encoding) => {
			const declared = declaration?.toLowerCase();
			if (declared !== undefined && ![
				"utf-8",
				"utf-16",
				"utf-16le",
				"utf-16be"
			].includes(declared)) throw new XmlPlistTextDecodeError("unsupported-encoding", `Unsupported XML encoding declaration: ${declaration}. Supported encodings are UTF-8 and BOM-marked UTF-16 in either byte order.`, declaration);
			if (declared !== undefined && declared !== encoding && !(encoding !== "utf-8" && declared === "utf-16")) throw new XmlPlistTextDecodeError("encoding-mismatch", "XML encoding declaration disagrees with its bytes", declaration);
		};
	})))();
}

//#endregion
//#region dist/artifacts/apple/PlistScalars.js
var containsSortedOffset, UnsupportedBinaryPlistUidError, readBinaryPlistUidValue, normalizedUidWidth, binaryPlistUidNormalizationWidth, binaryPlistUidRecord, binaryPlistContainerRecord, binaryPlistCloneOffsetWidth, decodeBinaryPlistUids, APPLE_EPOCH_MILLISECONDS, binaryDateRequiresExactSeconds, binaryPlistObjectEnd, scanBinaryPlistScalars, retainBinaryPlistUidIdentity, decodeBinaryPlistScalars, cloneBinaryPlistObjects;
function init_PlistScalars() {
	return (init_PlistScalars = __esmMin((() => {
		init_plistUid();
		init_plistNumbers();
		init_appleArchiveFormat();
		containsSortedOffset = (offsets, target) => {
			let low = 0;
			let high = offsets.length;
			while (low < high) {
				const middle = low + Math.floor((high - low) / 2);
				const value = offsets[middle];
				if (value === target) return true;
				if (value === undefined || value < target) low = middle + 1;
				else high = middle;
			}
			return false;
		};
		UnsupportedBinaryPlistUidError = class extends TypeError {
			decimalValue;
			sourceWidth;
			_tag = "UnsupportedBinaryPlistUidError";
			constructor(decimalValue, sourceWidth) {
				super(`binary plist UID value ${decimalValue} in ${sourceWidth}-byte encoding exceeds the exact supported range`);
				this.decimalValue = decimalValue;
				this.sourceWidth = sourceWidth;
				this.name = "UnsupportedBinaryPlistUidError";
			}
		};
		readBinaryPlistUidValue = (bytes, offset, width) => {
			let value = 0n;
			for (let index = 0; index < width; index += 1) value = value << 8n | BigInt(bytes[offset + 1 + index] ?? 0);
			if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new UnsupportedBinaryPlistUidError(value.toString(), width);
			return value;
		};
		normalizedUidWidth = (value) => value <= 255n ? 1 : value <= 65535n ? 2 : value <= 4294967295n ? 4 : 8;
		binaryPlistUidNormalizationWidth = (bytes, offset) => {
			const marker = bytes[offset];
			if (marker === undefined || marker >> 4 !== 8) return undefined;
			const sourceWidth = (marker & 15) + 1;
			const value = readBinaryPlistUidValue(bytes, offset, sourceWidth);
			if ([
				1,
				2,
				4,
				8
			].includes(sourceWidth)) return undefined;
			const targetWidth = normalizedUidWidth(value);
			return targetWidth === sourceWidth ? undefined : targetWidth;
		};
		binaryPlistUidRecord = (bytes, offset, targetWidth) => {
			const sourceWidth = (bytes[offset] & 15) + 1;
			let value = readBinaryPlistUidValue(bytes, offset, sourceWidth);
			const width = targetWidth ?? normalizedUidWidth(value);
			const record = Buffer.alloc(width + 1);
			record[0] = 128 | width - 1;
			for (let byte = width - 1; byte >= 0; byte -= 1) {
				record[byte + 1] = Number(value & 255n);
				value >>= 8n;
			}
			return record;
		};
		binaryPlistContainerRecord = (bytes, container, targetWidth) => {
			const record = Buffer.alloc(container.headerLength + container.references.length * targetWidth);
			bytes.copy(record, 0, container.offset, container.offset + container.headerLength);
			for (let index = 0; index < container.references.length; index += 1) {
				let value = BigInt(container.references[index] ?? 0);
				for (let byte = targetWidth - 1; byte >= 0; byte -= 1) {
					record[container.headerLength + index * targetWidth + byte] = Number(value & 255n);
					value >>= 8n;
				}
			}
			return record;
		};
		binaryPlistCloneOffsetWidth = (currentWidth, firstCloneOffset, cloneRecordLengths) => {
			const tableOffset = firstCloneOffset + cloneRecordLengths.reduce((sum, length) => sum + length, 0);
			const widths = [
				1,
				2,
				4,
				8
			];
			if (widths.includes(currentWidth) && (currentWidth === 8 || tableOffset < 2 ** (currentWidth * 8))) return currentWidth;
			return widths.find((width) => width === 8 ? tableOffset <= Number.MAX_SAFE_INTEGER : tableOffset < 2 ** (width * 8));
		};
		decodeBinaryPlistUids = (bytes, uidOffsets) => {
			if (uidOffsets.length === 0) return bytes;
			const replacements = new Map(uidOffsets.map(({ offset, width }) => [offset, binaryPlistUidRecord(bytes, offset, width)]));
			return cloneBinaryPlistObjects(bytes, replacements);
		};
		APPLE_EPOCH_MILLISECONDS = 9783072e5;
		binaryDateRequiresExactSeconds = (secondsSince2001) => {
			if (!Number.isFinite(secondsSince2001)) return false;
			const date = new Date(secondsSince2001 * 1e3 + APPLE_EPOCH_MILLISECONDS);
			return Number.isFinite(date.getTime()) && (date.getTime() - APPLE_EPOCH_MILLISECONDS) / 1e3 !== secondsSince2001;
		};
		binaryPlistObjectEnd = (bytes, offset, objectEnd, referenceWidth) => {
			const marker = bytes[offset];
			if (marker === undefined) return undefined;
			const type = marker >> 4;
			let length = marker & 15;
			let cursor = offset + 1;
			if (length === 15 && type !== 0 && type !== 8) {
				const extendedMarker = bytes[cursor];
				if (extendedMarker === undefined || extendedMarker >> 4 !== 1) return undefined;
				const width = 1 << (extendedMarker & 15);
				if (width > 8 || cursor + 1 + width > objectEnd) return undefined;
				cursor += 1;
				let extendedLength = 0n;
				for (let index = 0; index < width; index += 1) extendedLength = extendedLength << 8n | BigInt(bytes[cursor + index] ?? 0);
				if (extendedLength > BigInt(Number.MAX_SAFE_INTEGER)) return undefined;
				length = Number(extendedLength);
				cursor += width;
			}
			let payloadLength;
			if (type === 0) payloadLength = 0;
			else if (type === 1 || type === 2) {
				if ((marker & 15) > 4) return undefined;
				payloadLength = 1 << (marker & 15);
			} else if (type === 3) {
				if (marker !== 51) return undefined;
				payloadLength = 8;
			} else if (type === 4 || type === 5 || type === 7) {
				payloadLength = length;
			} else if (type === 6) {
				payloadLength = length * 2;
			} else if (type === 8) {
				payloadLength = (marker & 15) + 1;
			} else if (type === 10 || type === 11 || type === 12) {
				payloadLength = length * referenceWidth;
			} else if (type === 13) {
				payloadLength = length * 2 * referenceWidth;
			} else return undefined;
			const end = cursor + payloadLength;
			return Number.isSafeInteger(end) && end <= objectEnd ? end : undefined;
		};
		scanBinaryPlistScalars = (bytes, scalarPlan) => {
			const output = createPlistNumberCollector();
			const wideIntegers = [];
			const dates = [];
			const result = (incomplete) => ({
				literals: output.result(incomplete),
				wideIntegers,
				dates
			});
			if (bytes.length < 40 || !hasBinaryPlistSignature(bytes)) return result(true);
			const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
			const trailer = bytes.length - 32;
			const offsetWidth = bytes[trailer + 6] ?? 0;
			if (offsetWidth < 1) return result(true);
			const countRaw = view.getBigUint64(trailer + 8);
			const tableRaw = view.getBigUint64(trailer + 24);
			const safeMaximum = BigInt(Number.MAX_SAFE_INTEGER);
			if (countRaw === 0n || countRaw > safeMaximum || tableRaw > safeMaximum) return result(true);
			if (tableRaw < 8n || tableRaw >= BigInt(trailer)) return result(true);
			const offsetTable = Number(tableRaw);
			const capacity = Math.floor((trailer - offsetTable) / offsetWidth);
			if (countRaw > BigInt(capacity)) return result(true);
			const count = Number(countRaw);
			const referenceWidth = bytes[trailer + 7] ?? 0;
			if (referenceWidth < 1) return result(true);
			const unsigned = (offset) => {
				if (offset < offsetTable || offset + offsetWidth > trailer) return undefined;
				let value = 0n;
				for (let index = 0; index < offsetWidth; index += 1) value = BigInt.asUintN(64, value << 8n | BigInt(bytes[offset + index] ?? 0));
				return value > safeMaximum ? undefined : Number(value);
			};
			const objectOffsets = [];
			let incomplete = false;
			for (let index = 0; index < count; index += 1) {
				const offset = unsigned(offsetTable + index * offsetWidth);
				if (offset === undefined || offset < 8 || offset >= offsetTable) {
					incomplete = true;
					continue;
				}
				objectOffsets.push(offset);
			}
			const sortedOffsets = [...new Set(objectOffsets)].sort((a, b) => a - b);
			const validOffsets = new Set();
			for (const offset of sortedOffsets) {
				const encodedEnd = binaryPlistObjectEnd(bytes, offset, trailer, referenceWidth);
				if (encodedEnd === undefined) {
					incomplete = true;
					continue;
				}
				validOffsets.add(offset);
			}
			const visitedOffsets = new Set();
			for (const offset of objectOffsets) {
				if (!visitedOffsets.has(offset)) {
					const marker = bytes[offset] ?? 0;
					if (marker === 51 && offset + 9 <= offsetTable && (scalarPlan === undefined || containsSortedOffset(scalarPlan.reachableDateOffsets, offset))) {
						const payloadOffset = offset + 1;
						dates.push({
							offset,
							payloadOffset,
							secondsSince2001: view.getFloat64(payloadOffset)
						});
					}
				}
				if (!validOffsets.has(offset)) {
					incomplete = true;
					continue;
				}
				if (visitedOffsets.has(offset)) continue;
				visitedOffsets.add(offset);
				const marker = bytes[offset] ?? 0;
				const type = marker >> 4;
				if (type === 3 && marker === 51) {
					continue;
				}
				if (type !== 1 && type !== 2) continue;
				const width = 2 ** (marker & 15);
				if (offset + 1 + width > offsetTable) incomplete = true;
				if (offset + 1 + width > offsetTable) continue;
				const isReachable = scalarPlan === undefined || containsSortedOffset(scalarPlan.reachableNumericOffsets, offset);
				if (type === 1 && width === 8) {
					const value = view.getBigInt64(offset + 1);
					if (isReachable) output.integer(value);
				} else if (type === 1 && width === 16) {
					const value = BigInt.asIntN(128, view.getBigUint64(offset + 1) << 64n | view.getBigUint64(offset + 9));
					if (isReachable) {
						output.integer(value);
						if (scalarPlan === undefined || containsSortedOffset(scalarPlan.reachableWideIntegerOffsets, offset)) wideIntegers.push({
							offset,
							value
						});
					}
				} else if (type === 1 && width > 4) {
					incomplete = true;
				} else if (type === 2 && width === 4) {
					const value = view.getFloat32(offset + 1);
					if (isReachable) output.real(value);
				} else if (type === 2 && width === 8) {
					const value = view.getFloat64(offset + 1);
					if (isReachable) output.real(value);
				} else if (type === 2) {
					incomplete = true;
				}
			}
			return result(incomplete);
		};
		retainBinaryPlistUidIdentity = (value, plan) => {
			if (plan.binaryUidPaths === undefined) return value;
			const pending = [value];
			while (pending.length > 0) {
				const item = pending.pop();
				if (Array.isArray(item)) {
					for (const child of item) pending.push(child);
				} else if (item !== null && typeof item === "object" && !(item instanceof Date) && !(item instanceof Uint8Array)) {
					markPlistDictionary(item);
					for (const child of Object.values(item)) pending.push(child);
				}
			}
			for (let path of plan.binaryUidPaths) {
				const keys = [];
				while (path !== null) {
					keys.push(path.key);
					path = path.parent;
				}
				let item = value;
				for (let index = keys.length - 1; index >= 0; index -= 1) {
					if (item === null || typeof item !== "object") {
						item = undefined;
						break;
					}
					item = Object.getOwnPropertyDescriptor(item, keys[index])?.value;
				}
				if (item !== null && typeof item === "object") {
					const uid = Object.getOwnPropertyDescriptor(item, "UID")?.value;
					if (typeof uid === "number") markPlistDictionary(item, uid);
				}
			}
			return value;
		};
		decodeBinaryPlistScalars = (bytes, metadata, scalarPlan) => {
			const reachableDateOffsets = new Set(scalarPlan.reachableDateOffsets);
			const overlappingDateOffsets = new Set(scalarPlan.overlappingDateOffsets);
			const reachableWideIntegerOffsets = new Set(scalarPlan.reachableWideIntegerOffsets);
			const overlappingWideIntegerOffsets = new Set(scalarPlan.overlappingWideIntegerOffsets);
			const unrepresentableDates = metadata.dates.filter(({ offset, secondsSince2001 }) => reachableDateOffsets.has(offset) && binaryDateRequiresExactSeconds(secondsSince2001));
			const reachableWideIntegers = metadata.wideIntegers.filter(({ offset }) => reachableWideIntegerOffsets.has(offset));
			const replacements = new Map();
			for (const { offset, width } of scalarPlan.uidOffsetsToNormalize) replacements.set(offset, binaryPlistUidRecord(bytes, offset, width));
			for (const { offset } of unrepresentableDates) if (overlappingDateOffsets.has(offset)) {
				const replacement = Buffer.from(bytes.subarray(offset, offset + 9));
				replacement.writeDoubleBE(Number.NaN, 1);
				replacements.set(offset, replacement);
			}
			for (const { offset, value } of reachableWideIntegers) if (overlappingWideIntegerOffsets.has(offset)) {
				const replacement = Buffer.alloc(9);
				replacement[0] = 35;
				replacement.writeDoubleBE(Number(value), 1);
				replacements.set(offset, replacement);
			}
			const trailerOffset = bytes.length - 32;
			const sourceReferenceSize = bytes[trailerOffset + 7] ?? 0;
			const normalizedReferenceSize = scalarPlan.normalizedReferenceSize ?? sourceReferenceSize;
			for (const container of scalarPlan.containersToNormalize ?? []) replacements.set(container.offset, binaryPlistContainerRecord(bytes, container, normalizedReferenceSize));
			const needsTableNormalization = (scalarPlan.normalizedOffsetSize ?? bytes[trailerOffset + 6] ?? 0) !== (bytes[trailerOffset + 6] ?? 0) || normalizedReferenceSize !== sourceReferenceSize;
			if (reachableWideIntegers.length === 0 && unrepresentableDates.length === 0 && replacements.size === 0 && !needsTableNormalization) return bytes;
			const compatible = replacements.size === 0 && !needsTableNormalization ? Buffer.from(bytes) : cloneBinaryPlistObjects(bytes, replacements, scalarPlan.normalizedOffsetSize ?? bytes[trailerOffset + 6] ?? 0, normalizedReferenceSize);
			for (const { offset, value } of reachableWideIntegers) {
				if (overlappingWideIntegerOffsets.has(offset)) continue;
				compatible[offset] = 35;
				compatible.writeDoubleBE(Number(value), offset + 1);
			}
			for (const { offset, payloadOffset } of unrepresentableDates) {
				if (!overlappingDateOffsets.has(offset)) compatible.writeDoubleBE(Number.NaN, payloadOffset);
			}
			return compatible;
		};
		cloneBinaryPlistObjects = (bytes, replacements, normalizedOffsetSize, normalizedReferenceSize) => {
			const trailerOffset = bytes.length - 32;
			const offsetSize = bytes[trailerOffset + 6] ?? 0;
			const objectCount = Number(bytes.readBigUInt64BE(trailerOffset + 8));
			const oldTableOffset = Number(bytes.readBigUInt64BE(trailerOffset + 24));
			const readOffset = (offset) => {
				let value = 0n;
				for (let index = 0; index < offsetSize; index += 1) value = BigInt.asUintN(64, value << 8n | BigInt(bytes[offset + index] ?? 0));
				return value;
			};
			const offsets = Array.from({ length: objectCount }, (_, index) => readOffset(oldTableOffset + index * offsetSize));
			const cloneEntries = [...replacements.entries()];
			const replacementLengths = cloneEntries.map(([, record]) => record.length);
			const newOffsetSize = normalizedOffsetSize ?? binaryPlistCloneOffsetWidth(offsetSize, oldTableOffset, replacementLengths);
			if (newOffsetSize === undefined) throw new RangeError("binary plist cloned scalar offset exceeds supported width");
			const cloneStart = oldTableOffset;
			const cloneBytes = replacementLengths.reduce((sum, length) => sum + length, 0);
			const newTableOffset = cloneStart + cloneBytes;
			const newLength = bytes.length + cloneBytes + objectCount * (newOffsetSize - offsetSize);
			if (!Number.isSafeInteger(newLength)) throw new RangeError("binary plist cloned scalar representation is too large");
			const compatible = Buffer.alloc(newLength);
			bytes.copy(compatible, 0, 0, oldTableOffset);
			const cloneOffsetBySource = new Map();
			let cloneCursor = cloneStart;
			cloneEntries.forEach(([sourceOffset, replacement]) => {
				const cloneOffset = cloneCursor;
				cloneOffsetBySource.set(sourceOffset, BigInt(cloneOffset));
				replacement.copy(compatible, cloneOffset);
				cloneCursor += replacement.length;
			});
			const tableStart = newTableOffset;
			const tableEnd = tableStart + objectCount * newOffsetSize;
			const oldTableEnd = oldTableOffset + objectCount * offsetSize;
			const padding = bytes.subarray(oldTableEnd, trailerOffset);
			offsets.forEach((sourceOffset, index) => {
				const sourceNumber = sourceOffset <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(sourceOffset) : undefined;
				let value = sourceNumber === undefined ? sourceOffset : cloneOffsetBySource.get(sourceNumber) ?? sourceOffset;
				for (let byte = newOffsetSize - 1; byte >= 0; byte -= 1) {
					compatible[tableStart + index * newOffsetSize + byte] = Number(value & 255n);
					value >>= 8n;
				}
			});
			const trailer = Buffer.from(bytes.subarray(trailerOffset));
			trailer[6] = newOffsetSize;
			if (normalizedReferenceSize !== undefined) trailer[7] = normalizedReferenceSize;
			trailer.writeBigUInt64BE(BigInt(newTableOffset), 24);
			padding.copy(compatible, tableEnd);
			trailer.copy(compatible, tableEnd + padding.length);
			return compatible;
		};
	})))();
}

//#endregion
//#region dist/artifacts/apple/PropertyListDecodeBudget.js
/** Consume each XML span once; malformed tokens cannot restart suffix scans. */
function* xmlPreflightTokens(xml) {
	let cursor = 0;
	while (cursor < xml.length) {
		const start = xml.indexOf("<", cursor);
		if (start < 0) return;
		const opaqueEnd = xml.startsWith("<!--", start) ? "-->" : xml.startsWith("<![CDATA[", start) ? "]]>" : xml.startsWith("<?", start) ? "?>" : undefined;
		if (opaqueEnd !== undefined) {
			const end = xml.indexOf(opaqueEnd, start + 2);
			if (end < 0) return;
			cursor = end + opaqueEnd.length;
			continue;
		}
		const doctype = /^<!DOCTYPE\b/iu.test(xml.slice(start, start + 10));
		const element = /^<\/?[A-Za-z]/u.test(xml.slice(start, start + 4));
		let quote;
		let internalSubset = false;
		let end = start + 1;
		for (; end < xml.length; end += 1) {
			const character = xml[end];
			if (quote !== undefined) {
				if (character === quote) quote = undefined;
			} else if (character === "\"" || character === "'") quote = character;
			else if (character === ">") break;
			else if (doctype && character === "[") internalSubset = true;
		}
		if (end === xml.length) return;
		cursor = end + 1;
		if (doctype || element) yield {
			doctype,
			internalSubset
		};
	}
}
var preflightPropertyListDecode, estimateXmlPlistExpansion, MAX_BINARY_PLIST_NESTING_DEPTH, PropertyListDecodeBudgetFailure, propertyListDecodeBudgetFailure, PROTOTYPE_KEY$1, findOverlappingScalarOffsets, estimateBinaryPlistExpansion;
function init_PropertyListDecodeBudget() {
	return (init_PropertyListDecodeBudget = __esmMin((() => {
		init_propertyListXmlText();
		init_appleArchiveFormat();
		init_PlistScalars();
		preflightPropertyListDecode = (bytes, maxBytes, xmlText, options = {}) => {
			const { numberProjection = false, uidProjection = false, budget = "the property list decode budget", fail = propertyListDecodeBudgetFailure } = options;
			const expansion = hasBinaryPlistSignature(bytes) ? estimateBinaryPlistExpansion(bytes, maxBytes, {
				numberProjection,
				uidProjection,
				budget,
				fail
			}) : {
				estimatedBytes: estimateXmlPlistExpansion(bytes, maxBytes, xmlText, numberProjection, budget, fail),
				binaryPrototypeKeyObserved: false,
				datePrecisionOverlapCount: 0,
				reachableDateOffsets: [],
				overlappingDateOffsets: [],
				reachableWideIntegerOffsets: [],
				overlappingWideIntegerOffsets: [],
				reachableNumericOffsets: [],
				uidOffsetsToNormalize: [],
				containersToNormalize: [],
				normalizedOffsetSize: 1,
				normalizedReferenceSize: 1
			};
			if (expansion.estimatedBytes > maxBytes) throw fail("expansion", `plist representation exceeds ${budget}`);
			return expansion;
		};
		estimateXmlPlistExpansion = (bytes, maxBytes, xmlText, numberProjection = false, budget = "the property list decode budget", fail = propertyListDecodeBudgetFailure) => {
			const xml = xmlText ?? decodeXmlPlistText(bytes);
			const decodedSourceBytes = xml.length * 2;
			let elementCount = 0;
			const elementBytes = numberProjection ? 256 : 128;
			for (const token of xmlPreflightTokens(xml)) {
				if (token.doctype) {
					if (token.internalSubset) throw fail("expansion", `XML plist internal entity expansion exceeds ${budget}`);
					continue;
				}
				elementCount += 1;
				if (decodedSourceBytes * 2 + elementCount * elementBytes > maxBytes) return maxBytes + 1;
			}
			return decodedSourceBytes * 2 + elementCount * elementBytes;
		};
		MAX_BINARY_PLIST_NESTING_DEPTH = 128;
		PropertyListDecodeBudgetFailure = class extends Error {
			kind;
			constructor(kind, message) {
				super(message);
				this.kind = kind;
				this.name = "PropertyListDecodeBudgetFailure";
			}
		};
		propertyListDecodeBudgetFailure = (kind, message) => new PropertyListDecodeBudgetFailure(kind, message);
		PROTOTYPE_KEY$1 = "__proto__";
		findOverlappingScalarOffsets = (spans, scalarOffsets) => {
			let maxPriorEnd = -1;
			const overlappingOffsets = new Set();
			const activeScalars = new Map();
			for (const span of spans) {
				for (const [offset, end] of activeScalars) if (end <= span.offset) activeScalars.delete(offset);
				if (scalarOffsets.has(span.offset)) {
					if (maxPriorEnd > span.offset) {
						overlappingOffsets.add(span.offset);
						for (const activeOffset of activeScalars.keys()) overlappingOffsets.add(activeOffset);
						activeScalars.clear();
					} else activeScalars.set(span.offset, span.end);
				} else {
					for (const activeOffset of activeScalars.keys()) overlappingOffsets.add(activeOffset);
					activeScalars.clear();
				}
				maxPriorEnd = Math.max(maxPriorEnd, span.end);
			}
			return overlappingOffsets;
		};
		estimateBinaryPlistExpansion = (bytes, maxBytes, { budget = "the property list decode budget", fail = propertyListDecodeBudgetFailure, bounds = "strict", numberProjection = false, uidProjection = false, maximumDepth = 128 } = {}) => {
			if (bytes.length < 40) throw new TypeError("binary plist trailer is truncated");
			const trailer = bytes.length - 32;
			const offsetSize = bytes[trailer + 6] ?? 0;
			const referenceSize = bytes[trailer + 7] ?? 0;
			if (offsetSize < 1 || referenceSize < 1) throw new TypeError("binary plist trailer integer sizes are invalid");
			const readInteger = (offset, size) => {
				if (offset < 0 || size < 1 || offset + size > bytes.length) return -1;
				let value = 0n;
				for (let index = 0; index < size; index += 1) value = BigInt.asUintN(64, value << 8n | BigInt(bytes[offset + index] ?? 0));
				return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : -1;
			};
			const objectCount = readInteger(trailer + 8, 8);
			const topObject = readInteger(trailer + 16, 8);
			const offsetTable = readInteger(trailer + 24, 8);
			const tableEnd = bounds === "strict" ? trailer : bytes.length;
			const objectsEnd = bounds === "strict" ? offsetTable : bytes.length;
			if (objectCount < 1 || topObject < 0 || topObject >= objectCount || offsetTable < 8 || !Number.isSafeInteger(objectCount * offsetSize) || !Number.isSafeInteger(offsetTable + objectCount * offsetSize) || offsetTable + objectCount * offsetSize > tableEnd) throw new TypeError("binary plist trailer or object table is invalid");
			if (offsetSize < 8 && offsetTable >= 2 ** (offsetSize * 8) || referenceSize < 8 && objectCount >= 2 ** (referenceSize * 8)) throw new TypeError("binary plist table width cannot address its contents");
			const normalizedReferenceSize = [
				1,
				2,
				4,
				8
			].includes(referenceSize) && (referenceSize === 8 || objectCount < 2 ** (referenceSize * 8)) ? referenceSize : [
				1,
				2,
				4,
				8
			].find((width) => width === 8 || objectCount < 2 ** (width * 8));
			if (normalizedReferenceSize === undefined) throw new TypeError("binary plist object reference count is invalid");
			const objectBytes = numberProjection || uidProjection ? 320 : 16;
			const expandedNodeBytes = numberProjection || uidProjection ? 224 : 96;
			let estimate = bytes.length * (numberProjection ? 3 : 2) + objectCount * objectBytes;
			let binaryPrototypeKeyObserved = false;
			if (estimate > maxBytes) throw fail("expansion", `binary plist object table exceeds ${budget}`);
			const active = new Set();
			const pending = [{
				object: topObject,
				depth: 0,
				exit: false,
				dictionaryKey: false,
				...uidProjection ? { path: null } : {}
			}];
			const binaryUidPaths = [];
			const dictionaryKeys = new Map();
			const readDictionaryKey = (object) => {
				const prior = dictionaryKeys.get(object);
				if (prior !== undefined) return prior;
				const offset = readInteger(offsetTable + object * offsetSize, offsetSize);
				if (offset < 8 || offset >= objectsEnd) throw new TypeError("binary plist object offset is invalid");
				const marker = bytes[offset] ?? 0;
				const type = marker >> 4;
				if (type !== 5 && type !== 6) throw new TypeError("binary plist dictionary key is not a string");
				let size = marker & 15;
				let cursor = offset + 1;
				if (size === 15) {
					const extended = bytes[cursor] ?? 0;
					if (extended >> 4 !== 1 || (extended & 15) > 3) throw new TypeError("binary plist extended object size is invalid");
					const width = 1 << (extended & 15);
					size = readInteger(cursor + 1, width);
					cursor += 1 + width;
				}
				if (size < 0 || cursor + size * (type === 6 ? 2 : 1) > objectsEnd) throw new TypeError("binary plist scalar object is truncated");
				let key = "";
				for (let index = 0; index < size; index += 1) key += String.fromCharCode(type === 5 ? bytes[cursor + index] : bytes.readUInt16BE(cursor + index * 2));
				dictionaryKeys.set(object, key);
				return key;
			};
			let pendingObjectCount = 1;
			const reachableObjectOffsets = new Set();
			const reachableDateOffsets = new Set();
			const reachableWideIntegerOffsets = new Set();
			const reachableNumericOffsets = new Set();
			const uidWidthsToNormalize = new Map();
			const containersToNormalize = new Map();
			const reachableDateOccurrences = [];
			while (pending.length > 0) {
				const entry = pending.pop();
				if (entry === undefined) break;
				if (entry.exit) {
					active.delete(entry.object);
					continue;
				}
				pendingObjectCount -= 1;
				if (entry.depth > maximumDepth) throw fail("depth", `binary plist nesting exceeds ${budget}`);
				if (active.has(entry.object)) throw fail("cycle", `binary plist reference cycle exceeds ${budget}`);
				estimate += expandedNodeBytes;
				if (estimate > maxBytes) throw fail("expansion", `binary plist reference expansion exceeds ${budget}`);
				const offset = readInteger(offsetTable + entry.object * offsetSize, offsetSize);
				if (offset < 8 || offset >= objectsEnd) throw new TypeError("binary plist object offset is invalid");
				if (numberProjection) reachableObjectOffsets.add(offset);
				const marker = bytes[offset] ?? 0;
				const type = marker >> 4;
				if (entry.dictionaryKey && type !== 5 && type !== 6) throw new TypeError("binary plist dictionary key is not a string");
				if (type === 3) {
					if (marker !== 51) throw new TypeError(`binary plist date marker 0x${marker.toString(16)} is invalid`);
					if (offset + 9 > offsetTable) throw new TypeError("binary plist date object is truncated");
					if (numberProjection) {
						reachableDateOffsets.add(offset);
						reachableDateOccurrences.push(offset);
					}
					continue;
				}
				if (type === 8) {
					const uidWidth = (marker & 15) + 1;
					if (offset + 1 + uidWidth > objectsEnd) throw new TypeError("binary plist UID object is truncated");
					if (entry.path !== undefined) binaryUidPaths.push(entry.path);
					const normalizedWidth = binaryPlistUidNormalizationWidth(bytes, offset);
					if (normalizedWidth !== undefined) uidWidthsToNormalize.set(offset, normalizedWidth);
					continue;
				}
				if (type === 1 || type === 2) {
					const info = marker & 15;
					if (type === 1 && info > 4) throw new TypeError("binary plist integer width is invalid");
					if (type === 2 && info !== 2 && info !== 3) throw new TypeError("binary plist real width is invalid");
					const width = 1 << info;
					if (offset + 1 + width > offsetTable) throw new TypeError("binary plist numeric scalar is truncated");
					if (numberProjection) {
						reachableNumericOffsets.add(offset);
						if (type === 1 && width === 16) reachableWideIntegerOffsets.add(offset);
					}
					continue;
				}
				let size = marker & 15;
				let cursor = offset + 1;
				if (size === 15 && type !== 0 && type !== 8) {
					const extMarker = bytes[cursor] ?? 0;
					if (extMarker >> 4 !== 1 || (extMarker & 15) > 3) throw new TypeError("binary plist extended object size is invalid");
					cursor += 1;
					const integerSize = 1 << (extMarker & 15);
					size = readInteger(cursor, integerSize);
					cursor += integerSize;
					if (size < 0 || cursor > objectsEnd) throw new TypeError("binary plist extended object size is invalid");
				}
				if (type === 4 || type === 5 || type === 6) {
					const byteLength = type === 6 ? size * 2 : size;
					if (cursor + byteLength > objectsEnd) throw new TypeError("binary plist scalar object is truncated");
					if (!binaryPrototypeKeyObserved && entry.dictionaryKey && (type === 5 || type === 6) && size === PROTOTYPE_KEY$1.length) {
						let matches = true;
						for (let index = 0; index < PROTOTYPE_KEY$1.length; index += 1) {
							const codeUnit = type === 5 ? bytes[cursor + index] ?? 0 : (bytes[cursor + index * 2] ?? 0) << 8 | (bytes[cursor + index * 2 + 1] ?? 0);
							if (codeUnit !== PROTOTYPE_KEY$1.charCodeAt(index)) {
								matches = false;
								break;
							}
						}
						if (matches) binaryPrototypeKeyObserved = true;
					}
					estimate += type === 4 ? size + 4 * Math.ceil(size / 3) : byteLength * 2;
					if (estimate > maxBytes) throw fail("expansion", `binary plist scalar expansion exceeds ${budget}`);
					continue;
				}
				if (type !== 10 && type !== 13) continue;
				const childCount = type === 13 ? size * 2 : size;
				const refsEnd = cursor + childCount * referenceSize;
				if (!Number.isSafeInteger(refsEnd) || refsEnd > objectsEnd) throw new TypeError("binary plist reference table is truncated");
				const availableNodes = Math.floor((maxBytes - estimate) / expandedNodeBytes);
				if (childCount > availableNodes - pendingObjectCount) throw fail("expansion", `binary plist reference expansion exceeds ${budget}`);
				const parsedReferences = referenceSize !== normalizedReferenceSize && !containersToNormalize.has(offset) ? [] : undefined;
				const valueKeys = new Map();
				if (entry.path !== undefined && type === 13) {
					const lastKeyIndexes = new Map();
					for (let index = 0; index < size; index += 1) {
						const reference = readInteger(cursor + index * referenceSize, referenceSize);
						if (reference < 0 || reference >= objectCount) throw new TypeError("binary plist reference is invalid");
						lastKeyIndexes.set(readDictionaryKey(reference), index);
					}
					for (const [key, index] of lastKeyIndexes) if (key !== PROTOTYPE_KEY$1) valueKeys.set(size + index, key);
				}
				active.add(entry.object);
				pending.push({
					object: entry.object,
					depth: entry.depth,
					exit: true,
					dictionaryKey: false
				});
				for (let index = childCount - 1; index >= 0; index -= 1) {
					const reference = readInteger(cursor + index * referenceSize, referenceSize);
					if (reference < 0 || reference >= objectCount) throw new TypeError("binary plist reference is invalid");
					if (parsedReferences !== undefined) parsedReferences[index] = reference;
					pending.push({
						object: reference,
						depth: entry.depth + 1,
						exit: false,
						dictionaryKey: type === 13 && index < size,
						...entry.path === undefined || type === 13 && !valueKeys.has(index) ? {} : { path: {
							parent: entry.path,
							key: type === 13 ? valueKeys.get(index) : index
						} }
					});
				}
				if (parsedReferences !== undefined) containersToNormalize.set(offset, {
					offset,
					headerLength: cursor - offset,
					references: parsedReferences
				});
				pendingObjectCount += childCount;
			}
			const uidOffsetsToNormalize = [...uidWidthsToNormalize].map(([offset, width]) => ({
				offset,
				width
			})).sort((left, right) => left.offset - right.offset);
			const normalizedContainers = [...containersToNormalize.values()].sort((left, right) => left.offset - right.offset);
			const containerCloneLengths = normalizedContainers.map(({ headerLength, references }) => {
				const cloneLength = headerLength + references.length * normalizedReferenceSize;
				if (!Number.isSafeInteger(cloneLength)) throw new TypeError("binary plist reference table is too large");
				return cloneLength;
			});
			const normalizeOffsetWidth = (cloneLengths) => {
				const width = binaryPlistCloneOffsetWidth(offsetSize, offsetTable, cloneLengths);
				if (width === undefined) throw new TypeError("binary plist object offset exceeds supported width");
				return width;
			};
			if (!numberProjection) {
				const cloneLengths = [...uidOffsetsToNormalize.map(({ width }) => width + 1), ...containerCloneLengths];
				const normalizedOffsetSize = normalizeOffsetWidth(cloneLengths);
				if (cloneLengths.length > 0 || normalizedOffsetSize !== offsetSize) {
					const cloneBytes = cloneLengths.reduce((sum, length) => sum + length, 0);
					estimate += cloneBytes + objectCount * (normalizedOffsetSize - offsetSize);
					if (estimate > maxBytes) throw fail("expansion", `binary plist UID-copy expansion exceeds ${budget}`);
				}
				return {
					estimatedBytes: estimate,
					...uidProjection ? { binaryUidPaths } : {},
					binaryPrototypeKeyObserved,
					datePrecisionOverlapCount: 0,
					reachableDateOffsets: [],
					overlappingDateOffsets: [],
					reachableWideIntegerOffsets: [],
					overlappingWideIntegerOffsets: [],
					reachableNumericOffsets: [],
					uidOffsetsToNormalize,
					containersToNormalize: normalizedContainers,
					normalizedOffsetSize,
					normalizedReferenceSize
				};
			}
			const reachableSpans = [...reachableObjectOffsets].map((offset) => ({
				offset,
				end: binaryPlistObjectEnd(bytes, offset, objectsEnd, referenceSize)
			})).filter((span) => span.end !== undefined).sort((left, right) => left.offset - right.offset);
			const overlappingDateOffsets = findOverlappingScalarOffsets(reachableSpans, reachableDateOffsets);
			const overlappingWideIntegerOffsets = findOverlappingScalarOffsets(reachableSpans, reachableWideIntegerOffsets);
			const precisionUnknownDateOffsets = [...overlappingDateOffsets].filter((offset) => {
				const seconds = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getFloat64(offset + 1);
				return binaryDateRequiresExactSeconds(seconds);
			}).sort((left, right) => left - right);
			const cloneOffsets = new Set([...precisionUnknownDateOffsets, ...overlappingWideIntegerOffsets]);
			const cloneLengths = [
				...uidOffsetsToNormalize.map(({ width }) => width + 1),
				...containerCloneLengths,
				...Array.from(cloneOffsets, () => 9)
			];
			const normalizedOffsetSize = normalizeOffsetWidth(cloneLengths);
			if (cloneLengths.length > 0 || normalizedOffsetSize !== offsetSize) {
				const cloneBytes = cloneLengths.reduce((sum, length) => sum + length, 0);
				estimate += cloneBytes + objectCount * (normalizedOffsetSize - offsetSize);
				if (estimate > maxBytes) throw fail("expansion", `binary plist scalar-copy expansion exceeds ${budget}`);
			}
			const precisionUnknownOffsets = new Set(precisionUnknownDateOffsets);
			const datePrecisionOverlapCount = reachableDateOccurrences.filter((offset) => precisionUnknownOffsets.has(offset)).length;
			return {
				estimatedBytes: estimate,
				...uidProjection ? { binaryUidPaths } : {},
				binaryPrototypeKeyObserved,
				datePrecisionOverlapCount,
				reachableDateOffsets: [...reachableDateOffsets].sort((left, right) => left - right),
				overlappingDateOffsets: precisionUnknownDateOffsets,
				reachableWideIntegerOffsets: [...reachableWideIntegerOffsets].sort((left, right) => left - right),
				overlappingWideIntegerOffsets: [...overlappingWideIntegerOffsets].sort((left, right) => left - right),
				reachableNumericOffsets: [...reachableNumericOffsets].sort((left, right) => left - right),
				uidOffsetsToNormalize,
				containersToNormalize: normalizedContainers,
				normalizedOffsetSize,
				normalizedReferenceSize
			};
		};
	})))();
}

//#endregion
//#region dist/domain/xmlDocument.js
var XML_LINE_ENDING, XmlDocumentParseError, parseXmlDocument;
function init_xmlDocument() {
	return (init_xmlDocument = __esmMin((() => {
		init_result();
		XML_LINE_ENDING = /\r\n?|\n/gu;
		XmlDocumentParseError = class extends Error {
			reason;
			_tag = "XmlDocumentParseError";
			constructor(reason, cause) {
				super(reason === "doctype" ? "XML document types are unsupported" : `XML is not well-formed${cause instanceof Error ? `: ${cause.message}` : ""}`, { cause });
				this.reason = reason;
			}
		};
		parseXmlDocument = (source, policy) => {
			try {
				const syntax = new SaxesParser({
					defaultXMLVersion: "1.0",
					forceXMLVersion: true
				});
				syntax.on("doctype", () => {
					if (policy.doctype === "reject") throw new XmlDocumentParseError("doctype");
				});
				syntax.write(source).close();
				return ok(new DOMParser({
					normalizeLineEndings: policy.lineEndings === "preserve" ? (text) => text : (text) => text.replace(XML_LINE_ENDING, "\n"),
					onError: onErrorStopParsing
				}).parseFromString(source, "application/xml"));
			} catch (cause) {
				return err(cause instanceof XmlDocumentParseError ? cause : new XmlDocumentParseError("malformed", cause));
			}
		};
	})))();
}

//#endregion
//#region dist/domain/propertyListXmlData.js
var XmlPlistDataError, BASE64_DIGITS, C_WHITESPACE, visitDataQuartets, decodeXmlPlistData;
function init_propertyListXmlData() {
	return (init_propertyListXmlData = __esmMin((() => {
		init_result();
		XmlPlistDataError = class extends TypeError {
			reason;
			characterOffset;
			_tag = "XmlPlistDataError";
			constructor(reason, characterOffset = null) {
				super(`Cannot decode XML plist <data>: ${reason}`);
				this.reason = reason;
				this.characterOffset = characterOffset;
				this.name = "XmlPlistDataError";
			}
		};
		BASE64_DIGITS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		C_WHITESPACE = new Set([
			" ",
			"	",
			"\n",
			"\v",
			"\f",
			"\r"
		]);
		visitDataQuartets = (text, visit) => {
			let quartet = 0;
			let digits = 0;
			let padding = 0;
			for (let index = 0; index < text.length; index += 1) {
				if (text.charCodeAt(index) >= 128) return err(new XmlPlistDataError("non-ascii", index));
				const character = text[index];
				if (character === "=") padding += 1;
				else if (!C_WHITESPACE.has(character)) padding = 0;
				const digit = character === "=" ? 0 : BASE64_DIGITS.indexOf(character);
				if (digit < 0) continue;
				quartet = (quartet << 6 | digit) & 16777215;
				digits += 1;
				if (digits % 4 === 0) visit(quartet, padding >= 2 ? 1 : padding === 1 ? 2 : 3);
			}
			return ok(undefined);
		};
		decodeXmlPlistData = (text) => {
			let length = 0;
			const counted = visitDataQuartets(text, (_value, byteCount) => {
				length += byteCount;
			});
			if (!counted.ok) return counted;
			const bytes = new Uint8Array(length);
			let offset = 0;
			const decoded = visitDataQuartets(text, (value, byteCount) => {
				bytes[offset++] = value >> 16;
				if (byteCount >= 2) bytes[offset++] = value >> 8;
				if (byteCount === 3) bytes[offset++] = value;
			});
			return decoded.ok ? ok(bytes) : decoded;
		};
	})))();
}

//#endregion
//#region dist/domain/propertyListXmlSource.js
var XmlPlistSourceError, readXmlPlistSource, openingTagEnd, closingTagStart, PLIST_LEXICAL_SCALARS, PLIST_CONTAINER_ELEMENTS, collectXmlPlistScalarSpans;
function init_propertyListXmlSource() {
	return (init_propertyListXmlSource = __esmMin((() => {
		init_plistValue();
		init_result();
		init_xmlDocument();
		init_propertyListXmlData();
		XmlPlistSourceError = class extends TypeError {
			_tag = "XmlPlistSourceError";
			constructor() {
				super("Cannot locate XML plist scalar in its original source");
			}
		};
		readXmlPlistSource = (text, maximumDepth = 128) => {
			const normalized = text.replace(XML_LINE_ENDING, "\n");
			const parsed = parseXmlDocument(normalized, {
				doctype: "allow",
				lineEndings: "preserve"
			});
			if (!parsed.ok) throw parsed.error;
			const document = parsed.value;
			const lineEndings = new RegExp(XML_LINE_ENDING);
			let line = 1;
			let lineStart = 0;
			const readSpan = (node) => {
				if (node.lineNumber === undefined || node.columnNumber === undefined) return err("source-location");
				while (line < node.lineNumber) {
					const ending = lineEndings.exec(text);
					if (ending === null) return err("source-location");
					lineStart = ending.index + ending[0].length;
					line += 1;
				}
				if (line !== node.lineNumber) return err("source-location");
				const start = lineStart + node.columnNumber - 1;
				const openingEnd = openingTagEnd(text, start);
				if (openingEnd < 0 || text[start] !== "<") return err("source-location");
				const selfClosing = text[openingEnd - 1] === "/";
				const end = selfClosing ? openingEnd + 1 : closingTagStart(text, openingEnd + 1);
				return end < 0 ? err("source-location") : ok({
					start: openingEnd + 1,
					end,
					selfClosing
				});
			};
			const spans = collectXmlPlistScalarSpans(document, readSpan, maximumDepth);
			return {
				document,
				scalarLiteral(node) {
					const span = spans.get(node);
					return span?.ok === true ? ok(text.slice(span.value.start, span.value.end)) : err(new XmlPlistSourceError());
				},
				dataValue(node) {
					const span = spans.get(node);
					if (node.nodeName !== "data" || span === undefined) return err(new XmlPlistDataError("source-location"));
					if (!span.ok) return err(new XmlPlistDataError(span.error));
					for (let child = node.firstChild; child !== null; child = child.nextSibling) if (child.nodeType !== child.TEXT_NODE) return err(new XmlPlistDataError("markup"));
					if (span.value.selfClosing) return err(new XmlPlistDataError("empty-element"));
					return decodeXmlPlistData(text.slice(span.value.start, span.value.end));
				}
			};
		};
		openingTagEnd = (source, start) => {
			let quote;
			for (let cursor = start; cursor < source.length; cursor += 1) {
				const character = source[cursor];
				if (quote !== undefined) {
					if (character === quote) quote = undefined;
				} else if (character === "\"" || character === "'") quote = character;
				else if (character === ">") return cursor;
			}
			return -1;
		};
		closingTagStart = (source, contentStart) => {
			let depth = 1;
			let cursor = contentStart;
			while (cursor < source.length) {
				const start = source.indexOf("<", cursor);
				if (start < 0) return -1;
				const delimiter = source.startsWith("<!--", start) ? "-->" : source.startsWith("<![CDATA[", start) ? "]]>" : source.startsWith("<?", start) ? "?>" : undefined;
				if (delimiter !== undefined) {
					const end = source.indexOf(delimiter, start + 2);
					if (end < 0) return -1;
					cursor = end + delimiter.length;
					continue;
				}
				const end = openingTagEnd(source, start);
				if (end < 0) return -1;
				if (source[start + 1] === "/") {
					depth -= 1;
					if (depth === 0) return start;
				} else if (source[end - 1] !== "/") depth += 1;
				cursor = end + 1;
			}
			return -1;
		};
		PLIST_LEXICAL_SCALARS = new Set([
			"data",
			"integer",
			"real",
			"date",
			"true",
			"false"
		]);
		PLIST_CONTAINER_ELEMENTS = new Set([
			"plist",
			"dict",
			"array"
		]);
		collectXmlPlistScalarSpans = (document, readSpan, maximumDepth) => {
			const spans = new WeakMap();
			const root = document.documentElement;
			if (root === null) return spans;
			const pending = [{
				node: root,
				depth: -1
			}];
			while (pending.length > 0) {
				const entry = pending.pop();
				if (entry === undefined) break;
				const { node, depth } = entry;
				if (node.nextSibling !== null) pending.push({
					node: node.nextSibling,
					depth
				});
				if (node.nodeType !== node.ELEMENT_NODE) continue;
				if (node.nodeName !== "key" && depth > maximumDepth) throw new PlistNestingLimitError(maximumDepth);
				if (PLIST_LEXICAL_SCALARS.has(node.nodeName)) spans.set(node, readSpan(node));
				if (PLIST_CONTAINER_ELEMENTS.has(node.nodeName) && node.firstChild !== null) pending.push({
					node: node.firstChild,
					depth: depth + 1
				});
			}
			return spans;
		};
	})))();
}

//#endregion
//#region dist/domain/propertyListXmlScalar.js
var INTEGER_WHITESPACE, REAL_WHITESPACE, INTEGER_LITERAL, REAL_LEADING_WHITESPACE, parseXmlPlistIntegerLiteral, decodeXmlPlistDateLiteral, parseXmlPlistRealLiteral;
function init_propertyListXmlScalar() {
	return (init_propertyListXmlScalar = __esmMin((() => {
		init_result();
		INTEGER_WHITESPACE = "[\\u0000-\\u0020\\u007f\\u2000-\\u200b\\u205f\\u3000]*";
		REAL_WHITESPACE = "[\\u0000-\\u0020\\u007f-\\u00a0\\u2000-\\u200b\\u3000\\ufeff]*";
		INTEGER_LITERAL = new RegExp(`^${INTEGER_WHITESPACE}(?:([+-])${INTEGER_WHITESPACE})?(?:0[xX]([\\da-fA-F]+)|(\\d+))$`, "u");
		REAL_LEADING_WHITESPACE = new RegExp(`^${REAL_WHITESPACE}`, "u");
		parseXmlPlistIntegerLiteral = (raw) => {
			const match = INTEGER_LITERAL.exec(raw);
			if (match === null) return undefined;
			const magnitude = BigInt(match[2] === undefined ? match[3] : `0x${match[2]}`);
			return match[1] === "-" ? -magnitude : magnitude;
		};
		decodeXmlPlistDateLiteral = (raw) => {
			const match = /^(-?)(\d+)-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/u.exec(raw);
			if (match === null) return err("invalid-literal");
			const yearMagnitude = Number(match[2]);
			const year = match[1] === "-" ? -yearMagnitude : yearMagnitude;
			const month = Number(match[3]);
			const day = Number(match[4]);
			const hour = Number(match[5]);
			const minute = Number(match[6]);
			const second = Number(match[7]);
			if (!Number.isSafeInteger(year) || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return err("unrepresentable");
			const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
			const daysInMonth = [
				31,
				leapYear ? 29 : 28,
				31,
				30,
				31,
				30,
				31,
				31,
				30,
				31,
				30,
				31
			][month - 1];
			if (day < 1 || day > daysInMonth) return err("unrepresentable");
			const date = new Date(0);
			date.setUTCFullYear(year, month - 1, day);
			date.setUTCHours(hour, minute, second, 0);
			return Number.isNaN(date.getTime()) ? err("unrepresentable") : ok(date);
		};
		parseXmlPlistRealLiteral = (raw) => {
			const text = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>|&#(?:x([\da-fA-F]+)|(\d+));|&(amp|lt|gt|apos|quot);/gu, (_token, cdata, hex, decimal, name) => {
				if (cdata !== undefined) return cdata;
				if (hex !== undefined) return String.fromCodePoint(Number.parseInt(hex, 16));
				if (decimal !== undefined) return String.fromCodePoint(Number.parseInt(decimal, 10));
				return name === "amp" ? "&" : name === "lt" ? "<" : name === "gt" ? ">" : name === "apos" ? "'" : "\"";
			});
			if (text.length <= 9) {
				switch (text.toLowerCase()) {
					case "nan": return ok(Number.NaN);
					case "+infinity":
					case "infinity":
					case "+inf":
					case "inf": return ok(Number.POSITIVE_INFINITY);
					case "-infinity":
					case "-inf": return ok(Number.NEGATIVE_INFINITY);
				}
			}
			const numericText = text.replace(REAL_LEADING_WHITESPACE, "");
			if (!/^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/u.test(numericText)) return err("invalid-literal");
			const value = Number(numericText);
			return Number.isFinite(value) ? ok(value) : err("unrepresentable");
		};
	})))();
}

//#endregion
//#region dist/domain/propertyListXml.js
var decodeXmlPropertyList;
function init_propertyListXml() {
	return (init_propertyListXml = __esmMin((() => {
		init_plistUid();
		init_propertyListXmlSource();
		init_plistNumbers();
		init_unknownPlistScalar();
		init_plistValue();
		init_propertyListXmlScalar();
		decodeXmlPropertyList = (text, maximumDepth = 128) => {
			const source = readXmlPlistSource(text, maximumDepth);
			const document = source.document;
			const root = document.documentElement;
			if (root?.nodeName !== "plist") throw new TypeError("malformed document. First element should be <plist>");
			const numbers = createPlistNumberCollector();
			const textNode = (node) => node.nodeType === node.TEXT_NODE;
			const characterNode = (node) => textNode(node) || node.nodeType === node.CDATA_SECTION_NODE;
			const content = (node, accepts) => {
				let text = "";
				for (let child = node.firstChild; child !== null; child = child.nextSibling) {
					if (accepts(child)) text += child.nodeValue ?? "";
				}
				return text;
			};
			const hasUnsupportedMarkup = (node, accepts) => {
				for (let child = node.firstChild; child !== null; child = child.nextSibling) if (!accepts(child)) return true;
				return false;
			};
			const dictionaryKey = (node) => {
				for (let child = node.firstChild; child !== null; child = child.nextSibling) if (child.nodeType === child.ELEMENT_NODE) return String(node.firstChild?.nodeValue ?? null);
				return content(node, characterNode);
			};
			const members = function* (node) {
				for (let child = node.firstChild; child !== null; child = child.nextSibling) if (child.nodeType !== child.TEXT_NODE && child.nodeType !== child.CDATA_SECTION_NODE && child.nodeType !== child.COMMENT_NODE && child.nodeType !== child.PROCESSING_INSTRUCTION_NODE) yield child;
			};
			const decode = (node) => {
				switch (node.nodeName) {
					case "plist": return Array.from(members(node), decode);
					case "array": {
						const values = [];
						for (const member of members(node)) {
							const value = decode(member);
							if (value !== null) values.push(value);
						}
						return values;
					}
					case "dict": {
						const entries = [];
						let key;
						for (const child of members(node)) {
							if (key === undefined) {
								if (child.nodeName !== "key") throw new TypeError("Missing key while parsing <dict/>");
								key = dictionaryKey(child);
							} else {
								if (child.nodeName === "key") throw new TypeError("Unexpected <key> while parsing <dict/>. Keys and values must alternate.");
								entries.push([key, decode(child)]);
								key = undefined;
							}
						}
						if (key !== undefined) throw new TypeError("Missing value for key while parsing <dict/>");
						const value = Object.fromEntries(entries);
						const keys = Object.keys(value);
						markPlistDictionary(value, keys.length === 1 && keys[0] === "CF$UID" && typeof value["CF$UID"] === "number" ? value["CF$UID"] : undefined);
						return value;
					}
					case "key": {
						const value = node.firstChild === null ? "" : node.firstChild.nodeValue;
						if (value === "__proto__") throw new TypeError("__proto__ is not a scalar plist key");
						return value;
					}
					case "string": return content(node, characterNode);
					case "integer": {
						const raw = source.scalarLiteral(node);
						if (!raw.ok) throw raw.error;
						const unsupportedMarkup = hasUnsupportedMarkup(node, textNode);
						const exact = !unsupportedMarkup ? parseXmlPlistIntegerLiteral(raw.value) : undefined;
						if (exact === undefined) return new UnknownPlistScalar("integer", raw.value, unsupportedMarkup ? "unsupported-markup" : "invalid-literal");
						numbers.integer(exact);
						const decoded = Number(exact);
						return Number.isFinite(decoded) ? decoded : exact;
					}
					case "real": {
						const raw = source.scalarLiteral(node);
						if (!raw.ok) throw raw.error;
						if (hasUnsupportedMarkup(node, characterNode)) return new UnknownPlistScalar("real", raw.value, "unsupported-markup");
						const value = parseXmlPlistRealLiteral(raw.value);
						if (!value.ok) return new UnknownPlistScalar("real", raw.value, value.error);
						numbers.real(value.value);
						return value.value;
					}
					case "data": {
						const value = source.dataValue(node);
						if (!value.ok) throw value.error;
						return value.value;
					}
					case "date": {
						const raw = source.scalarLiteral(node);
						if (!raw.ok) throw raw.error;
						if (hasUnsupportedMarkup(node, textNode)) return new UnknownPlistScalar("date", raw.value, "unsupported-markup");
						const date = decodeXmlPlistDateLiteral(raw.value);
						return date.ok ? date.value : new UnknownPlistScalar("date", raw.value, date.error);
					}
					case "null": return null;
					case "true":
					case "false": {
						const raw = source.scalarLiteral(node);
						if (!raw.ok) throw raw.error;
						return raw.value === "" ? node.nodeName === "true" : new UnknownPlistScalar(node.nodeName, raw.value, hasUnsupportedMarkup(node, textNode) ? "unsupported-markup" : "invalid-literal");
					}
					default: throw new TypeError(`Invalid PLIST tag ${node.nodeName}`);
				}
			};
			const values = Array.from(members(root), decode);
			return {
				value: values.length === 1 ? values[0] : values,
				numberLiterals: numbers.result()
			};
		};
	})))();
}

//#endregion
//#region dist/domain/propertyListKeys.js
var PROTOTYPE_KEY, omittedPrototypeKeysLimitation, omitPrototypeKeys, parseXmlPropertyList, consumeOpenStepSeparator, admitsOpenStepCloser, scanOpenStep, isOpenStepPrototypeKey, skipOpenStepTrivia, skipOpenStepScalar;
function init_propertyListKeys() {
	return (init_propertyListKeys = __esmMin((() => {
		init_plistUid();
		init_propertyListXml();
		init_plistNumbers();
		init_unknownPlistScalar();
		init_plistValue();
		PROTOTYPE_KEY = "__proto__";
		omittedPrototypeKeysLimitation = (count) => count === null ? "Dictionary entries keyed __proto__ were omitted because REA results cannot represent that key." : `${String(count)} dictionary ${count === 1 ? "entry" : "entries"} keyed __proto__ ${count === 1 ? "was" : "were"} omitted because REA results cannot represent that key.`;
		omitPrototypeKeys = (value) => {
			let omitted = 0;
			const strip = (item) => {
				if (Array.isArray(item)) return item.map(strip);
				if (item === null || typeof item !== "object" || item instanceof Date || item instanceof Uint8Array || item instanceof UnknownPlistScalar) return item;
				const projected = Object.fromEntries(Object.entries(item).flatMap(([name, entry]) => {
					if (name !== PROTOTYPE_KEY) return [[name, strip(entry)]];
					omitted += 1;
					return [];
				}));
				copyPlistUidIdentity(item, projected);
				return projected;
			};
			const stripped = strip(value);
			return {
				value: stripped,
				omittedPrototypeKeys: omitted
			};
		};
		parseXmlPropertyList = (text, maximumDepth = 128) => {
			const first = text[skipOpenStepTrivia(text, 0)];
			if (first === "{" || first === "(") {
				const prototypeKeys = scanOpenStep(text, maximumDepth);
				return {
					value: omitPrototypeKeys(parseOpenStep(text)).value,
					numberLiterals: createPlistNumberCollector().result(true),
					omittedPrototypeKeys: prototypeKeys
				};
			}
			const decoded = decodeXmlPropertyList(text, maximumDepth);
			return {
				...omitPrototypeKeys(decoded.value),
				numberLiterals: decoded.numberLiterals
			};
		};
		consumeOpenStepSeparator = (parent, character) => {
			if (parent?.next === "after-value") {
				parent.next = "key";
				return character === ";" ? "consumed" : "none";
			}
			if (parent?.next !== "equals" && parent?.next !== "separator") return "none";
			if (character !== (parent.next === "equals" ? "=" : ",")) return "invalid";
			parent.next = "value";
			return "consumed";
		};
		admitsOpenStepCloser = (parent, character) => parent?.end === character && parent.next !== "equals" && !(parent.end === "}" && parent.next === "value");
		scanOpenStep = (text, maximumDepth) => {
			let prototypeKeys = 0;
			const containers = [];
			const completeValue = () => {
				const parent = containers.at(-1);
				if (parent !== undefined) parent.next = parent.next === "key" ? "equals" : parent.end === "}" ? "after-value" : "separator";
			};
			const assertDepth = () => {
				if (containers.length > maximumDepth) throw new PlistNestingLimitError(maximumDepth);
			};
			let cursor = 0;
			while (cursor < text.length) {
				const afterTrivia = skipOpenStepTrivia(text, cursor);
				if (afterTrivia !== cursor) {
					cursor = afterTrivia;
					continue;
				}
				const character = text[cursor] ?? "";
				const parent = containers.at(-1);
				if (character === "}" || character === ")") {
					if (!admitsOpenStepCloser(parent, character)) return prototypeKeys;
					const closed = containers.pop();
					if (closed?.keyStart !== undefined && isOpenStepPrototypeKey(text.slice(closed.keyStart, cursor + 1))) prototypeKeys += 1;
					if (containers.length === 0) return prototypeKeys;
					completeValue();
					cursor += 1;
					continue;
				}
				const separator = consumeOpenStepSeparator(parent, character);
				if (separator === "invalid") return prototypeKeys;
				if (separator === "consumed") {
					cursor += 1;
					continue;
				}
				if (character === "{" || character === "(") {
					assertDepth();
					containers.push({
						end: character === "{" ? "}" : ")",
						next: character === "{" ? "key" : "value",
						...parent?.next === "key" ? { keyStart: cursor } : {}
					});
					cursor += 1;
					continue;
				}
				const end = skipOpenStepScalar(text, cursor);
				if (end === cursor) return prototypeKeys;
				if (parent?.next === "key") {
					if (isOpenStepPrototypeKey(text.slice(cursor, end))) prototypeKeys += 1;
				} else assertDepth();
				cursor = end;
				completeValue();
			}
			return prototypeKeys;
		};
		isOpenStepPrototypeKey = (token) => {
			if (!/^["({<]/u.test(token)) return token === PROTOTYPE_KEY;
			if (token.startsWith("\"") && !token.includes("\\")) return token === `"${PROTOTYPE_KEY}"`;
			try {
				return String(parseOpenStep(token)) === PROTOTYPE_KEY;
			} catch {
				return false;
			}
		};
		skipOpenStepTrivia = (text, cursor) => {
			while (cursor < text.length) {
				if (/\s/u.test(text[cursor] ?? "")) {
					cursor += 1;
					continue;
				}
				if (!text.startsWith("//", cursor) && !text.startsWith("/*", cursor)) break;
				const line = text[cursor + 1] === "/";
				const end = text.indexOf(line ? "\n" : "*/", cursor + 2);
				cursor = end === -1 ? text.length : end + (line ? 1 : 2);
			}
			return cursor;
		};
		skipOpenStepScalar = (text, start) => {
			let cursor = start;
			const character = text[cursor];
			if (character === "\"") {
				cursor += 1;
				while (cursor < text.length) {
					const next = text[cursor];
					cursor += next === "\\" ? 2 : 1;
					if (next === "\"") break;
				}
			} else if (character === "<") {
				const end = text.indexOf(">", cursor + 1);
				cursor = end === -1 ? text.length : end + 1;
			} else {
				while (cursor < text.length && /[a-zA-Z0-9._/$:-]/u.test(text[cursor] ?? "")) cursor += 1;
			}
			return cursor;
		};
	})))();
}

//#endregion
export { PropertyListDecodeBudgetFailure, UnsupportedBinaryPlistUidError, XmlPlistTextDecodeError, decodeBinaryPlistScalars, decodeBinaryPlistUids, decodeXmlPlistText, estimateBinaryPlistExpansion, init_PlistScalars, init_PropertyListDecodeBudget, init_propertyListKeys, init_propertyListXmlText, init_xmlDocument, omitPrototypeKeys, omittedPrototypeKeysLimitation, parseXmlDocument, parseXmlPropertyList, preflightPropertyListDecode, retainBinaryPlistUidIdentity, scanBinaryPlistScalars };