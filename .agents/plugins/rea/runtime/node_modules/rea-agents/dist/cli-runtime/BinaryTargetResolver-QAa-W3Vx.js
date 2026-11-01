import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { hasZipSignature, init_localPath, init_zipPackageFormat, isPathWithinRoot, isZipPackageFormat, locateTrailingZipArchive, zipRootPackageFormat } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCancelledError, BinaryTargetError, err, init_analysisErrorCore, init_configurationErrors, init_jsonValue, init_result, jsonValueSchema, ok } from "./jsonLines-Gf10X4s1.js";
import { init_analysisErrorProjection, projectAnalysisError } from "./analysisErrorProjection-DCiob2UF.js";
import { absoluteCallerPath, init_callerPath } from "./callerPath-D1wtkHi_.js";
import { ArtifactReaderFailure, OwnedRegularFileOperationFailure, RegularFileCancelled, RegularFileCleanupFailure, init_ArtifactReader, init_OwnedRegularFile, init_RegularFile, regularFileCancellation, sameRegularFileState, withOwnedRegularFile } from "./ArtifactReader-PV1DaSaC.js";
import { RetainedRegularFileCleanupFailure, bindRegularFileCleanup, init_RegularFileRead, retryRegularFileCleanup } from "./RegularFileRead-4snB6-IE.js";
import { init_elfFixedHeader, readElfFixedHeader } from "./peMachine-BoMBJgsB.js";
import { admitRawBinary, init_rawBinary, parseRawBinaryEntryPoint, rawBinarySelectionError } from "./toolOutputSchemaGroups-D49U2-8O.js";
import { MAX_XML_PLIST_PROBE_BYTES, createXmlPlistSignatureProbe, hasBinaryPlistSignature, init_appleArchiveFormat } from "./appleArchiveFormat-B-JoSBSY.js";
import { JVM_CLASS_IDENTITY_LIMIT_REASON, MAX_JVM_CLASS_IDENTITY_BYTES, MachoLoadCommandCursor, classifyFatContainerIdentity, init_jvmClassFile, init_machoContainer, init_machoLoadCommands, isJvmClassFile, readFatContainerHeader, readMachoHeaderPrefixFacts, readMachoLoadCommandTableHeader } from "./machoLoadCommands-CChRRK2_.js";
import { claimsExecutableHeader, hasGodotPckHeader, init_binaryTarget, init_dosMz, init_godotPckFormat, mzWindowsHeaderLayoutLimitation, observeMzWindowsHeader, parseCodeViewData, parseExecutableHeader, parseMzHeaderEvidence, parsePeRecord, peDebugDirectoryEntry, peRvaToFileOffset } from "./godotPckFormat-BQCRCg8e.js";
import { decodeBinaryPlistUids, decodeXmlPlistText, init_PlistScalars, init_PropertyListDecodeBudget, init_propertyListKeys, init_propertyListXmlText, omitPrototypeKeys, parseXmlPropertyList, preflightPropertyListDecode } from "./propertyListKeys-Dsm_-i54.js";
import { init_dosCom, validateDosComLength } from "./managedToolContracts-depS6hrC.js";
import { z } from "zod";
import { createHash } from "node:crypto";
import { extname, join } from "node:path";
import { access, lstat, opendir, readFile, realpath, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { parseBinary } from "plist";

//#region dist/domain/elfDeclaredRanges.js
/** Canonical table declarations, including extended counts in inactive section zero. */
function* readElfTableDeclarations(bytes, fileSize) {
	const fixed = readElfFixedHeader(bytes, fileSize);
	if (!fixed.ok) return fixed;
	const header = fixed.value;
	const r = reader(bytes, header);
	const fields = TABLE_FIELDS[header.elfClass];
	const programOffset = r.word(fields.programOffset);
	const sectionOffset = r.word(fields.sectionOffset);
	const programWidth = r.u16(fields.programWidth);
	const sectionWidth = r.u16(fields.sectionWidth);
	let programCount = BigInt(r.u16(fields.programCount));
	let sectionCount = BigInt(r.u16(fields.sectionCount));
	let namesIndex = r.u16(fields.namesIndex);
	if (sectionOffset === 0n && (sectionCount !== 0n || namesIndex !== 0 || programCount === 65535n)) return err("ELF section table is missing");
	if (sectionOffset !== 0n && (sectionCount === 0n || namesIndex === 65535 || programCount === 65535n)) {
		const failure = tableFailure("section", {
			offset: sectionOffset,
			count: 1n,
			width: sectionWidth
		}, header, fileSize);
		if (failure !== undefined) return err(failure);
		const first = yield {
			offset: Number(sectionOffset),
			size: fields.sectionHeaderSize
		};
		const counts = extendedCounts(first, header, {
			programCount,
			sectionCount,
			namesIndex
		});
		if (!counts.ok) return counts;
		({programCount, sectionCount, namesIndex} = counts.value);
	}
	for (const [kind, offset, count, width] of [[
		"program",
		programOffset,
		programCount,
		programWidth
	], [
		"section",
		sectionOffset,
		sectionCount,
		sectionWidth
	]]) {
		const failure = tableFailure(kind, {
			offset,
			count,
			width
		}, header, fileSize);
		if (failure !== undefined) return err(failure);
	}
	if (sectionCount !== 0n && BigInt(namesIndex) >= sectionCount) return err("ELF section-name index lies outside the declared section table");
	return ok({
		header,
		programs: {
			offset: programOffset,
			count: Number(programCount),
			width: programWidth
		},
		sections: {
			offset: sectionOffset,
			count: Number(sectionCount),
			width: sectionWidth,
			namesIndex
		}
	});
}
/** Examine only header records; referenced payloads are range-checked, never copied. */
function* inspectTableRanges(kind, table, header, fileSize) {
	const wide = header.elfClass === 64;
	const perRead = Math.max(1, Math.floor(64 * 1024 / table.width));
	for (let index = 0; index < table.count; index += perRead) {
		const count = Math.min(perRead, table.count - index);
		const size = count * table.width;
		const bytes = yield {
			offset: Number(table.offset) + index * table.width,
			size
		};
		if (bytes.length !== size) return err(`truncated ELF ${kind} header table`);
		const r = reader(bytes, header);
		for (let item = 0; item < count; item++) {
			const at = item * table.width;
			const type = r.u32(at + (kind === "program" ? 0 : 4));
			if (type === 0 || kind === "section" && type === 8) continue;
			const offset = r.word(at + (kind === "program" ? wide ? 8 : 4 : wide ? 24 : 16));
			const length = r.word(at + (kind === "program" ? wide ? 32 : 16 : wide ? 32 : 20));
			const failure = rangeFailure(`${kind} ${String(index + item)}`, offset, length, fileSize);
			if (failure !== undefined) return err(failure);
		}
	}
	return ok(null);
}
/** Physical extent admission, independent of section names, CPU lanes and decoder budgets. */
function* validateElfDeclaredRanges(prefix, fileSize) {
	const declarations = yield* readElfTableDeclarations(prefix, fileSize);
	if (!declarations.ok) return declarations;
	const { header, programs, sections } = declarations.value;
	for (const [kind, table] of [["program", programs], ["section", sections]]) {
		if (table.count === 0) continue;
		const inspected = yield* inspectTableRanges(kind, table, header, fileSize);
		if (!inspected.ok) return inspected;
	}
	return ok(null);
}
var reader, rangeFailure, tableFailure, extendedCounts, TABLE_FIELDS;
function init_elfDeclaredRanges() {
	return (init_elfDeclaredRanges = __esmMin((() => {
		init_elfFixedHeader();
		init_result();
		reader = (bytes, header) => {
			const little = header.byteOrder === "little";
			const u16 = (at) => little ? bytes.readUInt16LE(at) : bytes.readUInt16BE(at);
			const u32 = (at) => little ? bytes.readUInt32LE(at) : bytes.readUInt32BE(at);
			const word = (at) => header.elfClass === 32 ? BigInt(u32(at)) : little ? bytes.readBigUInt64LE(at) : bytes.readBigUInt64BE(at);
			return {
				u16,
				u32,
				word
			};
		};
		rangeFailure = (label, offset, size, fileSize) => size !== 0n && (offset > BigInt(fileSize) || size > BigInt(fileSize) - offset) ? `truncated ELF ${label}: declared file range ${String(offset)}..${String(offset + size)} exceeds the ${String(fileSize)}-byte file` : undefined;
		tableFailure = (kind, table, header, fileSize) => {
			if (table.count === 0n) return undefined;
			const wide = header.elfClass === 64;
			const minimumWidth = kind === "program" ? wide ? 56 : 32 : wide ? 64 : 40;
			const label = `${kind} header table`;
			if (table.width < minimumWidth) return `invalid ELF ${label} entry width`;
			if (table.offset < BigInt(wide ? 64 : 52)) return `ELF ${label} overlaps the fixed header`;
			return rangeFailure(label, table.offset, table.count * BigInt(table.width), fileSize);
		};
		extendedCounts = (first, header, initial) => {
			const wide = header.elfClass === 64;
			if (first.length !== (wide ? 64 : 40)) return err("truncated ELF extended section-zero header");
			const zero = reader(first, header);
			if (zero.u32(4) !== 0) return err("ELF extended numbering requires an inactive SHT_NULL section zero");
			const counts = { ...initial };
			if (counts.sectionCount === 0n) {
				counts.sectionCount = zero.word(wide ? 32 : 20);
				if (counts.sectionCount < 65280n) return err("invalid ELF extended section count");
			}
			if (counts.namesIndex === 65535) {
				counts.namesIndex = zero.u32(wide ? 40 : 24);
				if (counts.namesIndex < 65280) return err("invalid ELF extended section-name index");
			}
			if (counts.programCount === 65535n) {
				counts.programCount = BigInt(zero.u32(wide ? 44 : 28));
				if (counts.programCount < 65535n) return err("invalid ELF extended program count");
			}
			return ok(counts);
		};
		TABLE_FIELDS = {
			32: {
				programOffset: 28,
				sectionOffset: 32,
				programWidth: 42,
				programCount: 44,
				sectionWidth: 46,
				sectionCount: 48,
				namesIndex: 50,
				sectionHeaderSize: 40
			},
			64: {
				programOffset: 32,
				sectionOffset: 40,
				programWidth: 54,
				programCount: 56,
				sectionWidth: 58,
				sectionCount: 60,
				namesIndex: 62,
				sectionHeaderSize: 64
			}
		};
	})))();
}

//#endregion
//#region dist/application/AppBundleExecutable.js
var BINARY_PLIST_DECODE_BYTES, BUNDLE_LAYOUTS, defaultFileSystem, resolveAppBundleExecutable, findAppBundleResourceRoot, resolveAppBundleResourceRoot, presentLayout, layoutPlistPresent, isAbsence, errorCode, codeDescription, isSystemErrorCode, isPermissionDenied, errorReason, wrappedBundle, resolveLayoutExecutable, parseXmlPlistExecutable, executableName, executableEntrySchema, parseBinaryPlistExecutable, isSafeExecutableName;
function init_AppBundleExecutable() {
	return (init_AppBundleExecutable = __esmMin((() => {
		init_PropertyListDecodeBudget();
		init_PlistScalars();
		init_configurationErrors();
		init_localPath();
		init_propertyListKeys();
		init_propertyListXmlText();
		init_appleArchiveFormat();
		init_result();
		init_callerPath();
		BINARY_PLIST_DECODE_BYTES = 16 * 1024 * 1024;
		BUNDLE_LAYOUTS = [{
			plist: ["Contents", "Info.plist"],
			programs: ["Contents", "MacOS"],
			programsLabel: "Contents/MacOS"
		}, {
			plist: ["Info.plist"],
			programs: [],
			programsLabel: "the bundle root"
		}];
		defaultFileSystem = {
			readFile,
			realpath
		};
		resolveAppBundleExecutable = async (path, fileSystem = defaultFileSystem) => {
			try {
				const layout = await presentLayout(path);
				if (layout !== undefined) return await resolveLayoutExecutable(path, layout, fileSystem);
				const wrapped = await wrappedBundle(path);
				if (wrapped !== undefined) {
					const wrappedLayout = await presentLayout(wrapped);
					if (wrappedLayout !== undefined) return await resolveLayoutExecutable(wrapped, wrappedLayout, fileSystem);
				}
			} catch (cause) {
				if (cause instanceof BinaryTargetError) return err(cause);
				return err(new BinaryTargetError(path, errorReason(cause, path), { cause }));
			}
			return err(new BinaryTargetError(path, `app Info.plist is missing or no supported bundle layout was found: ${path}`, { cause: new Error("No Contents/Info.plist, root Info.plist, or single Wrapper/*.app bundle was found") }));
		};
		findAppBundleResourceRoot = async (path, options = {}) => {
			const callerPath = absoluteCallerPath(path, options.cwd === undefined ? {} : { cwd: options.cwd });
			try {
				const canonicalInput = await realpath(callerPath);
				const directLayout = await presentLayout(canonicalInput);
				const wrapped = directLayout === undefined ? await wrappedBundle(canonicalInput) : undefined;
				const root = wrapped ?? canonicalInput;
				const layout = directLayout ?? await presentLayout(root);
				if (layout === undefined) return ok(undefined);
				const canonicalPath = await realpath(root);
				return ok({
					callerPath,
					canonicalPath,
					infoPlistPath: join(canonicalPath, ...layout.plist),
					layout: layout.plist[0] === "Contents" ? "contents" : "root",
					executableSha256: null
				});
			} catch (cause) {
				if (cause instanceof BinaryTargetError) return err(cause);
				return err(new BinaryTargetError(callerPath, errorReason(cause, callerPath), { cause }));
			}
		};
		resolveAppBundleResourceRoot = async (path, options = {}) => {
			const found = await findAppBundleResourceRoot(path, options);
			if (!found.ok) return found;
			if (found.value !== undefined) return ok(found.value);
			const callerPath = absoluteCallerPath(path, options);
			return err(new BinaryTargetError(callerPath, `app resource root has no supported Info.plist layout: ${callerPath}`));
		};
		presentLayout = async (bundle) => {
			for (const layout of BUNDLE_LAYOUTS) if (await layoutPlistPresent(join(bundle, ...layout.plist))) return layout;
			return undefined;
		};
		layoutPlistPresent = async (path) => {
			try {
				return (await stat(path)).isFile();
			} catch (cause) {
				if (isAbsence(cause)) return false;
				if (isPermissionDenied(cause)) throw new BinaryTargetError(path, `permission denied inspecting app Info.plist ${path}`, { cause });
				throw cause;
			}
		};
		isAbsence = (cause) => {
			const code = errorCode(cause);
			return code === "ENOENT" || code === "ENOTDIR";
		};
		errorCode = (cause) => cause instanceof Error ? Reflect.get(cause, "code") : undefined;
		codeDescription = (cause) => {
			const code = errorCode(cause);
			return typeof code === "string" || typeof code === "number" ? ` (${String(code)})` : "";
		};
		isSystemErrorCode = (cause) => {
			const code = errorCode(cause);
			return typeof code === "string" && /^[A-Z][A-Z0-9_]+$/u.test(code) && !code.startsWith("ERR_");
		};
		isPermissionDenied = (cause) => errorCode(cause) === "EACCES" || errorCode(cause) === "EPERM";
		errorReason = (cause, path) => isPermissionDenied(cause) ? `permission denied accessing app bundle path ${path}` : isAbsence(cause) ? `app bundle path is missing: ${path}` : `could not inspect app bundle path ${path}`;
		wrappedBundle = async (bundle) => {
			const wrapper = join(bundle, "Wrapper");
			try {
				if (!(await lstat(wrapper)).isDirectory()) return undefined;
			} catch (cause) {
				if (isAbsence(cause)) return undefined;
				throw cause;
			}
			let app;
			for await (const entry of await opendir(wrapper)) {
				if (!entry.isDirectory() || !entry.name.toLowerCase().endsWith(".app")) continue;
				if (app !== undefined) return undefined;
				app = join(wrapper, entry.name);
			}
			return app;
		};
		resolveLayoutExecutable = async (bundle, layout, fileSystem) => {
			const plistPath = join(bundle, ...layout.plist);
			let plist;
			try {
				plist = await fileSystem.readFile(plistPath);
			} catch (cause) {
				return err(new BinaryTargetError(plistPath, isPermissionDenied(cause) ? `permission denied reading app Info.plist ${plistPath}` : isAbsence(cause) ? `app Info.plist is missing: ${plistPath}` : `could not read app Info.plist ${plistPath}${codeDescription(cause)}`, { cause }));
			}
			let name;
			try {
				name = hasBinaryPlistSignature(plist) ? await (fileSystem.decodeBinaryPlist?.(plistPath) ?? parseBinaryPlistExecutable(plist)) : parseXmlPlistExecutable(decodeXmlPlistText(plist));
			} catch (cause) {
				return err(new BinaryTargetError(plistPath, isPermissionDenied(cause) ? `permission denied decoding app Info.plist ${plistPath}${codeDescription(cause)}` : isSystemErrorCode(cause) ? `could not decode app Info.plist ${plistPath}${codeDescription(cause)}` : `app Info.plist is malformed, unsupported, or lacks CFBundleExecutable: ${plistPath}${cause instanceof Error ? ` (${cause.message})` : ""}`, { cause }));
			}
			if (!isSafeExecutableName(name)) return err(new BinaryTargetError(bundle, "app has an unsafe CFBundleExecutable"));
			const programs = join(bundle, ...layout.programs);
			const executable = join(programs, name);
			let canonicalBundle;
			try {
				canonicalBundle = await fileSystem.realpath(bundle);
			} catch (cause) {
				return err(new BinaryTargetError(bundle, errorReason(cause, bundle), { cause }));
			}
			try {
				const canonicalPrograms = await fileSystem.realpath(programs);
				if (!isPathWithinRoot(canonicalBundle, canonicalPrograms)) return err(new BinaryTargetError(bundle, `app program directory leaves ${layout.programsLabel}`));
				const canonicalExecutable = await fileSystem.realpath(executable);
				if (!isPathWithinRoot(canonicalPrograms, canonicalExecutable)) return err(new BinaryTargetError(bundle, `app program file leaves ${layout.programsLabel}`));
				return ok({
					executable: canonicalExecutable,
					infoPlist: plistPath
				});
			} catch (cause) {
				return err(new BinaryTargetError(executable, isPermissionDenied(cause) ? `permission denied resolving app program file ${executable}` : isAbsence(cause) ? `app program file is missing: ${executable}` : `could not resolve app program file ${executable}`, { cause }));
			}
		};
		parseXmlPlistExecutable = (plist) => {
			const { value } = parseXmlPropertyList(plist);
			return executableName(value);
		};
		executableName = (value) => {
			const executable = executableEntrySchema.safeParse(value);
			if (!executable.success) throw new Error("CFBundleExecutable is missing");
			return executable.data.CFBundleExecutable;
		};
		executableEntrySchema = z.looseObject({ CFBundleExecutable: z.string() });
		parseBinaryPlistExecutable = (plist) => {
			const plan = preflightPropertyListDecode(plist, BINARY_PLIST_DECODE_BYTES);
			return executableName(omitPrototypeKeys(parseBinary(decodeBinaryPlistUids(plist, plan.uidOffsetsToNormalize))).value);
		};
		isSafeExecutableName = (name) => name.length > 0 && name !== "." && name !== ".." && !name.includes("\0") && !/[/\\]/u.test(name);
	})))();
}

//#endregion
//#region dist/application/MipsElfSharedLoad.js
var readMipsElfSharedLoad;
function init_MipsElfSharedLoad() {
	return (init_MipsElfSharedLoad = __esmMin((() => {
		init_result();
		readMipsElfSharedLoad = async (programHeaders, little, fileSize, read, checkCancelled, sections) => {
			const u32 = (bytes, offset) => little ? bytes.readUInt32LE(offset) : bytes.readUInt32BE(offset);
			const loads = [];
			let dynamic;
			for (let position = 0; position < programHeaders.length; position += 32) {
				checkCancelled();
				const type = u32(programHeaders, position);
				const offset = u32(programHeaders, position + 4);
				const size = u32(programHeaders, position + 16);
				if (type === 1) {
					const address = u32(programHeaders, position + 8);
					const memorySize = u32(programHeaders, position + 20);
					if (offset > fileSize - size || size > memorySize || address + memorySize > 4294967296) return err("invalid or incomplete MIPS PT_LOAD range");
					loads.push({
						offset,
						address,
						size,
						memorySize
					});
				}
				if (type === 2) {
					if (dynamic !== undefined) return err("duplicate MIPS PT_DYNAMIC tables");
					dynamic = {
						offset,
						address: u32(programHeaders, position + 8),
						size
					};
				}
			}
			if (dynamic === undefined) return err("MIPS shared image has no PT_DYNAMIC table");
			if (dynamic.size === 0 || dynamic.size % 8 !== 0) return err("invalid MIPS ELF32 dynamic table size");
			if (dynamic.offset > fileSize - dynamic.size) return err("MIPS PT_DYNAMIC range extends beyond the file");
			const ranges = loads.filter((load) => load.memorySize > 0).sort((left, right) => left.address - right.address);
			for (let i = 1; i < ranges.length; i += 1) {
				checkCancelled();
				const previous = ranges[i - 1];
				if (ranges[i].address < previous.address + previous.memorySize) return err("overlapping MIPS PT_LOAD memory ranges require separate mapping verification");
			}
			const mapped = (address, length, fileBacked) => {
				let low = 0;
				let high = ranges.length;
				while (low < high) {
					const middle = Math.floor((low + high) / 2);
					if (ranges[middle].address <= address) low = middle + 1;
					else high = middle;
				}
				const range = ranges[low - 1];
				return range !== undefined && address - range.address <= (fileBacked ? range.size : range.memorySize) - length ? range : undefined;
			};
			const dynamicMapping = mapped(dynamic.address, dynamic.size, true);
			if (dynamicMapping === undefined || dynamicMapping.offset + dynamic.address - dynamicMapping.address !== dynamic.offset) return err("MIPS PT_DYNAMIC has no unique matching file-backed PT_LOAD range");
			const chunkBytes = 64 * 1024;
			const relevant = new Set([
				2,
				7,
				8,
				9,
				17,
				18,
				19,
				20,
				23,
				35,
				36,
				37
			]);
			const tags = new Map();
			let terminated = false;
			for (let offset = 0; offset < dynamic.size && !terminated; offset += chunkBytes) {
				const chunk = await read(dynamic.offset + offset, Math.min(chunkBytes, dynamic.size - offset), "dynamic table");
				if (!chunk.ok) return chunk;
				for (let position = 0; position < chunk.value.length; position += 8) {
					checkCancelled();
					const tag = u32(chunk.value, position);
					if (tag === 0) {
						terminated = true;
						break;
					}
					if (!relevant.has(tag)) continue;
					if (tags.has(tag)) return err(`duplicate MIPS dynamic tag ${tag}`);
					tags.set(tag, u32(chunk.value, position + 4));
				}
			}
			if (!terminated) return err("MIPS dynamic table has no DT_NULL terminator");
			if ([
				35,
				36,
				37
			].some((tag) => tags.has(tag))) return err("MIPS shared RELR relocation declarations require separate verification");
			if ([
				2,
				7,
				8,
				9,
				23
			].some((tag) => (tags.get(tag) ?? 0) !== 0)) return err("MIPS shared RELA or PLT relocation declarations require separate verification");
			const address = tags.get(17);
			const size = tags.get(18);
			const stride = tags.get(19);
			const checkSections = (offset, length) => {
				let observed = 0;
				for (const section of sections) {
					checkCancelled();
					if (section.size === 0) continue;
					if (section.type !== 9 || section.entrySize !== 8 || section.offset !== offset || section.size !== length) return "MIPS section relocation declarations outside the dynamic REL table require separate verification";
					observed += 1;
				}
				return observed > 1 ? "duplicate MIPS section relocation declarations require separate verification" : undefined;
			};
			const emptyRelocations = () => {
				const reason = checkSections(0, 0);
				return reason === undefined ? ok({
					status: "complete",
					relocationCount: 0,
					relocationTypes: [],
					symbolRelativeCount: 0
				}) : err(reason);
			};
			if (address === undefined && size === undefined && stride === undefined) return emptyRelocations();
			if (address === undefined || size === undefined || stride !== 8 || size % 8 !== 0) return err("incomplete or invalid MIPS DT_REL/DT_RELSZ/DT_RELENT declaration");
			if (size === 0) return emptyRelocations();
			const mapping = mapped(address, size, true);
			if (mapping === undefined) return err("MIPS DT_REL range has no unique complete file-backed PT_LOAD mapping");
			const fileOffset = mapping.offset + address - mapping.address;
			const sectionReason = checkSections(fileOffset, size);
			if (sectionReason !== undefined) return err(sectionReason);
			let symbolRelativeCount = 0;
			const types = new Set();
			for (let offset = 0; offset < size; offset += chunkBytes) {
				const chunk = await read(fileOffset + offset, Math.min(chunkBytes, size - offset), "dynamic REL records");
				if (!chunk.ok) return chunk;
				for (let position = 0; position < chunk.value.length; position += 8) {
					checkCancelled();
					const info = u32(chunk.value, position + 4);
					const type = info & 255;
					const relocationAddress = u32(chunk.value, position);
					if (type === 3 && mapped(relocationAddress, 4, false) === undefined) return err("MIPS REL32 destination has no unique complete PT_LOAD memory range");
					types.add(type);
					if (type === 3 && info >>> 8 !== 0) symbolRelativeCount += 1;
				}
			}
			return ok({
				status: "complete",
				relocationCount: size / 8,
				relocationTypes: [...types].sort((left, right) => left - right),
				symbolRelativeCount
			});
		};
	})))();
}

//#endregion
//#region dist/application/MipsGnuAttributes.js
var MIPS_GNU_ATTRIBUTES_MAX_BYTES, FORMAT_VERSION, TAG_FILE, TAG_GNU_MIPS_ABI_FP, TAG_GNU_MIPS_ABI_MSA, parseMipsGnuAttributes;
function init_MipsGnuAttributes() {
	return (init_MipsGnuAttributes = __esmMin((() => {
		init_result();
		MIPS_GNU_ATTRIBUTES_MAX_BYTES = 4096;
		FORMAT_VERSION = 65;
		TAG_FILE = 1;
		TAG_GNU_MIPS_ABI_FP = 4;
		TAG_GNU_MIPS_ABI_MSA = 8;
		parseMipsGnuAttributes = (bytes, littleEndian) => {
			if (bytes.length === 0 || bytes[0] !== FORMAT_VERSION) return err("unsupported MIPS GNU attribute section format version");
			const readU32 = (offset) => littleEndian ? bytes.readUInt32LE(offset) : bytes.readUInt32BE(offset);
			const readUleb = (offset, end) => {
				let value = 0;
				for (let index = 0; index < 5 && offset + index < end; index += 1) {
					const byte = bytes[offset + index];
					value += (byte & 127) * 2 ** (7 * index);
					if ((byte & 128) === 0) return value <= 4294967295 ? {
						value,
						next: offset + index + 1
					} : undefined;
				}
				return undefined;
			};
			let fpAbi = null;
			let msa = null;
			let vendorSeen = false;
			let position = 1;
			while (position < bytes.length) {
				if (bytes.length - position < 4) return err("truncated MIPS GNU attribute subsection length");
				const length = readU32(position);
				if (length < 4 || length > bytes.length - position) return err("MIPS GNU attribute subsection length does not fit the section");
				const end = position + length;
				const vendorEnd = bytes.indexOf(0, position + 4);
				if (vendorEnd < 0 || vendorEnd >= end) return err("unterminated MIPS GNU attribute vendor name");
				if (bytes.toString("latin1", position + 4, vendorEnd) !== "gnu") return err("MIPS ELF declares non-GNU vendor attributes that REA does not inspect");
				if (vendorSeen) return err("duplicate MIPS GNU attribute vendor subsections");
				vendorSeen = true;
				let cursor = vendorEnd + 1;
				while (cursor < end) {
					const scopeStart = cursor;
					const scope = readUleb(cursor, end);
					if (scope === undefined) return err("malformed MIPS GNU attribute scope tag");
					if (scope.value !== TAG_FILE) return err("MIPS GNU attributes scoped to sections or symbols are not inspected by REA");
					if (end - scope.next < 4) return err("truncated MIPS GNU attribute scope length");
					const scopeLength = readU32(scope.next);
					if (scopeLength < scope.next + 4 - scopeStart || scopeLength > end - scopeStart) return err("MIPS GNU attribute scope length does not fit its subsection");
					const scopeEnd = scopeStart + scopeLength;
					cursor = scope.next + 4;
					while (cursor < scopeEnd) {
						const tag = readUleb(cursor, scopeEnd);
						if (tag === undefined) return err("malformed MIPS GNU attribute tag");
						if (tag.value !== TAG_GNU_MIPS_ABI_FP && tag.value !== TAG_GNU_MIPS_ABI_MSA) return err(`MIPS ELF declares GNU attribute tag ${tag.value}, which REA does not inspect`);
						const value = readUleb(tag.next, scopeEnd);
						if (value === undefined) return err("malformed MIPS GNU attribute value");
						if (tag.value === TAG_GNU_MIPS_ABI_FP) {
							if (fpAbi !== null) return err("duplicate MIPS GNU floating-point ABI attributes");
							fpAbi = value.value;
						} else {
							if (msa !== null) return err("duplicate MIPS GNU MSA ABI attributes");
							msa = value.value;
						}
						cursor = value.next;
					}
					cursor = scopeEnd;
				}
				position = end;
			}
			return ok({
				fpAbi,
				msa
			});
		};
	})))();
}

//#endregion
//#region dist/application/MipsElfMetadata.js
var SHT_GNU_ATTRIBUTES, readMipsElfMetadata;
function init_MipsElfMetadata() {
	return (init_MipsElfMetadata = __esmMin((() => {
		init_elfFixedHeader();
		init_result();
		init_MipsElfSharedLoad();
		init_MipsGnuAttributes();
		SHT_GNU_ATTRIBUTES = 1879048181;
		readMipsElfMetadata = async (handle, metadata, checkCancelled) => {
			checkCancelled();
			if (metadata.elfClass !== 32) return err("MIPS ABI record inspection currently supports ELF32 only");
			const fileSize = (await handle.stat()).size;
			checkCancelled();
			const read = async (offset, length, label) => {
				checkCancelled();
				if (!Number.isSafeInteger(fileSize) || offset < 0 || length < 0 || offset > fileSize - length) return err(`MIPS ${label} lies outside the file`);
				const bytes = Buffer.alloc(length);
				let total = 0;
				while (total < length) {
					checkCancelled();
					const observed = await handle.read(bytes, total, length - total, offset + total);
					checkCancelled();
					if (observed.bytesRead === 0) return err(`truncated MIPS ${label}`);
					total += observed.bytesRead;
				}
				return ok(bytes);
			};
			const header = await read(0, 52, "ELF32 header");
			if (!header.ok) return header;
			const bytes = header.value;
			const fixedHeader = readElfFixedHeader(bytes, fileSize);
			if (!fixedHeader.ok) return fixedHeader;
			const little = metadata.byteOrder === "little";
			const u16 = (data, offset) => little ? data.readUInt16LE(offset) : data.readUInt16BE(offset);
			const u32 = (data, offset) => little ? data.readUInt32LE(offset) : data.readUInt32BE(offset);
			if (fixedHeader.value.elfClass !== 32 || fixedHeader.value.byteOrder !== metadata.byteOrder || fixedHeader.value.machine !== 8 || u16(bytes, 16) !== metadata.type || u32(bytes, 36) !== metadata.flags) return err("MIPS ELF header no longer matches the resolved identity");
			if (fixedHeader.value.headerSize !== 52) return err("invalid MIPS ELF32 version or header size");
			const tables = [{
				label: "program header table",
				offset: u32(bytes, 28),
				count: u16(bytes, 44),
				stride: u16(bytes, 42),
				entrySize: 32,
				typeOffset: 0,
				dataOffset: 4,
				sizeOffset: 16,
				recordType: 1879048195,
				optional: false
			}, {
				label: "section header table",
				offset: u32(bytes, 32),
				count: u16(bytes, 48),
				stride: u16(bytes, 46),
				entrySize: 40,
				typeOffset: 4,
				dataOffset: 16,
				sizeOffset: 20,
				recordType: 1879048234,
				optional: true
			}];
			if (u16(bytes, 44) === 65535 || u16(bytes, 48) >= 65280) return err("extended or reserved MIPS ELF table numbering is unsupported");
			let record;
			let sharedLoad;
			let programHeaders;
			const relocationSections = [];
			const limitations = [];
			let gnuAttributes = null;
			for (const table of tables) {
				if (table.count === 0) {
					if (table.offset !== 0) return err(`unsupported extended or inconsistent MIPS ${table.label}`);
					continue;
				}
				if (table.offset < 52 || table.stride !== table.entrySize) return err(`invalid MIPS ${table.label} offset or entry size`);
				const count = table.optional ? Math.min(table.count, Math.max(0, Math.floor((fileSize - table.offset) / table.entrySize))) : table.count;
				if (count < table.count) limitations.push(`MIPS ${table.label} at file offset ${table.offset} extends beyond the captured file: examined ${count} of ${table.count} complete headers. ABI declarations in unavailable headers remain unknown.`);
				if (count === 0) continue;
				const contents = await read(table.offset, count * table.entrySize, table.label);
				if (!contents.ok) return contents;
				if (!table.optional && metadata.type === 3) programHeaders = contents.value;
				let found = false;
				for (let i = 0; i < count; i += 1) {
					checkCancelled();
					const position = i * table.entrySize;
					const type = u32(contents.value, position + table.typeOffset);
					if (table.optional && type === SHT_GNU_ATTRIBUTES) {
						if (gnuAttributes !== null) return err("duplicate MIPS GNU attribute sections");
						const size = u32(contents.value, position + 20);
						if (size === 0 || size > 4096) return err(`MIPS GNU attribute section size ${size} is outside REA's inspected bound of ${MIPS_GNU_ATTRIBUTES_MAX_BYTES} bytes`);
						const section = await read(u32(contents.value, position + 16), size, "GNU attribute section");
						if (!section.ok) return section;
						const parsed = parseMipsGnuAttributes(section.value, little);
						if (!parsed.ok) return parsed;
						gnuAttributes = parsed.value;
						continue;
					}
					if (metadata.type === 3 && table.optional && (type === 4 || type === 9 || type === 19)) relocationSections.push({
						type,
						offset: u32(contents.value, position + 16),
						size: u32(contents.value, position + 20),
						entrySize: u32(contents.value, position + 36)
					});
					if (type !== table.recordType) continue;
					if (found) return err(`duplicate MIPS ABI records in ${table.label}`);
					found = true;
					const offset = u32(contents.value, position + table.dataOffset);
					const size = u32(contents.value, position + table.sizeOffset);
					if (size !== 24) return err("unsupported MIPS ABI record size; expected 24 bytes");
					const candidate = await read(offset, 24, "ABI record");
					if (!candidate.ok) return candidate;
					if (record !== undefined && !record.equals(candidate.value)) return err("conflicting MIPS program/section ABI declarations");
					record = candidate.value;
				}
			}
			if (metadata.type === 3 && programHeaders !== undefined) {
				if (limitations.length > 0) sharedLoad = {
					status: "unavailable",
					reason: `MIPS shared-image relocation declaration sources are incomplete. ${limitations.join(" ")}`
				};
				else {
					const shared = await readMipsElfSharedLoad(programHeaders, little, fileSize, read, checkCancelled, relocationSections);
					sharedLoad = shared.ok ? shared.value : {
						status: "unavailable",
						reason: shared.error
					};
				}
			}
			const shared = metadata.type === 3 ? { sharedLoad: sharedLoad ?? {
				status: "unavailable",
				reason: "MIPS shared image has no inspected program header table"
			} } : {};
			if (record === undefined) return ok({
				abiFlags: null,
				gnuAttributes,
				limitations,
				...shared
			});
			const abiFlags = {
				version: u16(record, 0),
				isaLevel: record.readUInt8(2),
				isaRevision: record.readUInt8(3),
				gprSize: record.readUInt8(4),
				cpr1Size: record.readUInt8(5),
				cpr2Size: record.readUInt8(6),
				fpAbi: record.readUInt8(7),
				isaExtension: u32(record, 8),
				ases: u32(record, 12),
				flags1: u32(record, 16),
				flags2: u32(record, 20)
			};
			if (gnuAttributes !== null && gnuAttributes.fpAbi !== null && gnuAttributes.fpAbi !== 0 && gnuAttributes.fpAbi !== abiFlags.fpAbi) return err("conflicting MIPS ABI flags and GNU floating-point ABI declarations");
			return ok({
				abiFlags,
				gnuAttributes,
				limitations,
				...shared
			});
		};
	})))();
}

//#endregion
//#region dist/domain/gamecubeDol.js
var DOL_HEADER_SIZE, DOL_TEXT_SECTION_COUNT, DOL_DATA_SECTION_COUNT, DOL_MEMORY_START, DOL_RAM_END, TEXT_FILE_OFFSET_TABLE, DATA_FILE_OFFSET_TABLE, TEXT_ADDRESS_TABLE, DATA_ADDRESS_TABLE, TEXT_SIZE_TABLE, DATA_SIZE_TABLE, BSS_ADDRESS_FIELD, BSS_SIZE_FIELD, ENTRY_POINT_FIELD, hex, readSlots, rangesOverlap, parseDolHeader;
function init_gamecubeDol() {
	return (init_gamecubeDol = __esmMin((() => {
		init_result();
		DOL_HEADER_SIZE = 256;
		DOL_TEXT_SECTION_COUNT = 7;
		DOL_DATA_SECTION_COUNT = 11;
		DOL_MEMORY_START = 2147483648;
		DOL_RAM_END = 2172649472;
		TEXT_FILE_OFFSET_TABLE = 0;
		DATA_FILE_OFFSET_TABLE = 28;
		TEXT_ADDRESS_TABLE = 72;
		DATA_ADDRESS_TABLE = 100;
		TEXT_SIZE_TABLE = 144;
		DATA_SIZE_TABLE = 172;
		BSS_ADDRESS_FIELD = 216;
		BSS_SIZE_FIELD = 220;
		ENTRY_POINT_FIELD = 224;
		hex = (value) => `0x${value.toString(16)}`;
		readSlots = (view, kind, count, tables) => Array.from({ length: count }, (_, index) => ({
			kind,
			index,
			fileOffset: view.getUint32(tables.fileOffset + index * 4, false),
			address: view.getUint32(tables.address + index * 4, false),
			size: view.getUint32(tables.size + index * 4, false)
		}));
		rangesOverlap = (startA, sizeA, startB, sizeB) => startA < startB + sizeB && startB < startA + sizeA;
		parseDolHeader = (bytes, fileSize = bytes.length) => {
			if (fileSize < 256) return err(`DOL header is truncated: needs ${256} bytes; the file has ${fileSize}`);
			if (bytes.length < 256) return err(`DOL header bytes are incomplete: needs ${256} bytes; ${bytes.length} were supplied`);
			const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
			const slots = [...readSlots(view, "text", 7, {
				fileOffset: TEXT_FILE_OFFSET_TABLE,
				address: TEXT_ADDRESS_TABLE,
				size: TEXT_SIZE_TABLE
			}), ...readSlots(view, "data", 11, {
				fileOffset: DATA_FILE_OFFSET_TABLE,
				address: DATA_ADDRESS_TABLE,
				size: DATA_SIZE_TABLE
			})];
			const used = slots.filter((slot) => slot.size > 0);
			const label = (slot) => `${slot.kind} ${slot.index}`;
			for (const slot of used) {
				const name = label(slot);
				const fileEnd = slot.fileOffset + slot.size;
				const addressEnd = slot.address + slot.size;
				if (slot.fileOffset < 256) return err(`${name}: file offset ${hex(slot.fileOffset)} overlaps the ${256}-byte DOL header`);
				if (fileEnd > fileSize) return err(`${name}: file range ${hex(slot.fileOffset)}..${hex(fileEnd)} exceeds the ${fileSize}-byte file`);
				if (slot.address < 2147483648) return err(`${name}: load address ${hex(slot.address)} is below ${hex(DOL_MEMORY_START)}`);
				if (addressEnd > 2172649472) return err(`${name}: load range ${hex(slot.address)}..${hex(addressEnd)} exceeds ${hex(DOL_RAM_END)}`);
			}
			for (const slot of used) {
				if (slot.kind !== "text") continue;
				for (const [field, value] of [
					["file offset", slot.fileOffset],
					["load address", slot.address],
					["size", slot.size]
				]) if (value % 4 !== 0) return err(`${label(slot)}: ${field} ${hex(value)} must be 4-byte aligned`);
			}
			const text = used.filter((slot) => slot.kind === "text");
			if (text.length === 0) return err("DOL has no used text section");
			for (const [i, a] of used.entries()) {
				for (const b of used.slice(i + 1)) {
					if (rangesOverlap(a.address, a.size, b.address, b.size)) return err(`${label(a)} and ${label(b)} overlap in load address range`);
					if (rangesOverlap(a.fileOffset, a.size, b.fileOffset, b.size)) return err(`${label(a)} and ${label(b)} overlap in file range`);
				}
			}
			const entryPoint = view.getUint32(ENTRY_POINT_FIELD, false);
			if (entryPoint % 4 !== 0) return err(`entry point ${hex(entryPoint)} must be 4-byte aligned`);
			const inText = text.some((slot) => entryPoint >= slot.address && entryPoint < slot.address + slot.size);
			if (!inText) return err(`entry point ${hex(entryPoint)} is outside every used text section`);
			const bssAddress = view.getUint32(BSS_ADDRESS_FIELD, false);
			const bssSize = view.getUint32(BSS_SIZE_FIELD, false);
			const bssOverlaps = [];
			const bssData = [];
			if (bssSize > 0) {
				if (bssAddress < 2147483648) return err(`bss: load address ${hex(bssAddress)} is below ${hex(DOL_MEMORY_START)}`);
				if (bssAddress + bssSize > 2172649472) return err(`bss: load range ${hex(bssAddress)}..${hex(bssAddress + bssSize)} exceeds ${hex(DOL_RAM_END)}`);
				for (const slot of used) {
					if (!rangesOverlap(bssAddress, bssSize, slot.address, slot.size)) continue;
					if (slot.kind === "text") return err(`bss and ${label(slot)} overlap in load address range`);
					bssOverlaps.push(slot.index);
					bssData.push(slot);
				}
			}
			const bssGaps = [];
			const bssEnd = bssAddress + bssSize;
			let cursor = bssAddress;
			for (const slot of bssData.sort((left, right) => left.address - right.address)) {
				if (cursor < slot.address) bssGaps.push({
					address: cursor,
					size: slot.address - cursor
				});
				cursor = Math.min(bssEnd, slot.address + slot.size);
			}
			if (cursor < bssEnd) bssGaps.push({
				address: cursor,
				size: bssEnd - cursor
			});
			return ok({
				sections: used.map(({ kind, index, fileOffset, address, size }) => ({
					kind,
					index,
					fileOffset,
					address,
					size
				})),
				bss: {
					address: bssAddress,
					size: bssSize
				},
				bssGaps,
				bssOverlaps,
				entryPoint
			});
		};
	})))();
}

//#endregion
//#region dist/domain/gamecubeDolAdmission.js
var GAMECUBE_DOL_ARCHITECTURE, admitGamecubeDol;
function init_gamecubeDolAdmission() {
	return (init_gamecubeDolAdmission = __esmMin((() => {
		init_gamecubeDol();
		init_rawBinary();
		init_result();
		GAMECUBE_DOL_ARCHITECTURE = "powerpc";
		admitGamecubeDol = (input) => {
			const parsed = parseDolHeader(input.bytes, input.fileSize ?? input.bytes.length);
			if (!parsed.ok) return err({
				reason: `gamecube-dol header rejected: ${parsed.error}`,
				constraint: "file_format_rejected"
			});
			const header = parsed.value;
			const entryPoint = `0x${header.entryPoint.toString(16)}`;
			if (input.entryPoint !== undefined) {
				if (typeof input.entryPoint !== "string") return err({
					reason: "gamecube-dol entry_point must be a hexadecimal address of the form 0x…",
					constraint: "load_selection_rejected"
				});
				const requested = parseRawBinaryEntryPoint(input.entryPoint);
				if (!requested.ok) return err({
					reason: requested.error,
					constraint: "load_selection_rejected"
				});
				if (requested.value.value !== BigInt(header.entryPoint)) return err({
					reason: `gamecube-dol entry_point ${requested.value.canonical} conflicts with the DOL header entry ${entryPoint}`,
					constraint: "load_selection_rejected"
				});
			}
			return ok({
				architecture: GAMECUBE_DOL_ARCHITECTURE,
				entryPoint,
				entryPointSource: "dol-header",
				header
			});
		};
	})))();
}

//#endregion
//#region dist/application/BinaryTargetResolver.js
var XML_PLIST_PROBE_CHUNK_BYTES, parseBinaryTarget, readOpenedBinaryTarget, finalizedTargetResolution, targetFileCleanupError, targetResolutionFailure, classifyBinaryTargetFilesystemFailure, classifyTargetFilesystemFailure, filesystemErrorCode, targetFailureReason, throwIfTargetResolutionCancelled, detectArtifactFormat, namedArtifactFormat, isArchiveFormat, claimsLeadingExecutableHeader, readHandleRange, readLeadingBytes, sha256Handle, resolveAppBundle, readExecutableMetadata, readElfMetadata, readElfDeclaredRanges, unresolvedMzHeaderFailure, readThinMachoMetadata, readMachoCommandFrames, readMachoSliceCommandFrames, readFatSliceHeaderEvidence, readPeMetadata, readPeCodeView;
function init_BinaryTargetResolver() {
	return (init_BinaryTargetResolver = __esmMin((() => {
		init_OwnedRegularFile();
		init_RegularFileRead();
		init_ArtifactReader();
		init_jsonValue();
		init_analysisErrorProjection();
		init_configurationErrors();
		init_RegularFile();
		init_analysisErrorCore();
		init_result();
		init_MipsElfMetadata();
		init_elfDeclaredRanges();
		init_AppBundleExecutable();
		init_dosCom();
		init_rawBinary();
		init_gamecubeDolAdmission();
		init_gamecubeDol();
		init_dosMz();
		init_appleArchiveFormat();
		init_godotPckFormat();
		init_zipPackageFormat();
		init_binaryTarget();
		init_machoContainer();
		init_jvmClassFile();
		init_machoLoadCommands();
		init_callerPath();
		XML_PLIST_PROBE_CHUNK_BYTES = 64 * 1024;
		parseBinaryTarget = async (input, options = {}) => {
			const cwd = options.cwd ?? process.cwd();
			const { signal } = options;
			const candidate = absoluteCallerPath(input, { cwd });
			let stage = "resolve";
			const resolve = async () => {
				throwIfTargetResolutionCancelled(signal);
				await access(candidate, constants.R_OK);
				throwIfTargetResolutionCancelled(signal);
				const canonical = await realpath(candidate);
				stage = "read";
				const sourcePath = process.platform === "win32" ? candidate : canonical;
				throwIfTargetResolutionCancelled(signal);
				const resolved = await resolveAppBundle(canonical);
				throwIfTargetResolutionCancelled(signal);
				if (!resolved.ok) return err(resolved.error);
				const { executable: path, infoPlist } = resolved.value;
				const bundle = infoPlist === undefined ? {} : { bundleInfoPlist: infoPlist };
				return withOwnedRegularFile(path, {
					symlinks: "reject",
					...signal === undefined ? {} : { signal }
				}, async (source) => {
					try {
						return await readOpenedBinaryTarget(source, {
							path,
							sourcePath,
							...bundle
						}, options);
					} catch (cause) {
						throw new OwnedRegularFileOperationFailure(cause);
					}
				});
			};
			try {
				const resolved = await (options.resources === undefined ? resolve() : options.resources.run(resolve));
				return finalizedTargetResolution(resolved, signal);
			} catch (cause) {
				if (signal?.aborted === true && cause === signal.reason) return err(new AnalysisCancelledError("resolve_binary_target", { cause }));
				if (cause instanceof RegularFileCleanupFailure) {
					const fileFailure = cause;
					if (options.resources === undefined) return err(targetFileCleanupError(new RetainedRegularFileCleanupFailure(fileFailure), candidate, stage));
					const retried = await retryRegularFileCleanup(fileFailure, options.resources, signal);
					if (retried.failure !== undefined) return err(targetFileCleanupError(retried.failure, candidate, stage));
					if (retried.outcome.kind === "failed") return targetResolutionFailure(fileFailure.operationFailure ?? retried.outcome.cause, candidate, stage, signal);
					return finalizedTargetResolution(retried.outcome.value, signal);
				}
				if (cause instanceof RegularFileCancelled) return finalizedTargetResolution(cause.outcome.value, signal);
				if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) {
					const error = new BinaryTargetError(candidate, "A previous target file could not be closed", {
						cause,
						cleanup: cause.cleanup,
						partialObservation: cause.partialObservation
					});
					bindRegularFileCleanup(cause, error);
					return err(error);
				}
				return targetResolutionFailure(cause, candidate, stage, signal);
			}
		};
		readOpenedBinaryTarget = async (source, selected, options) => {
			const { handle, initial: metadata } = source;
			const { path, sourcePath, bundleInfoPlist } = selected;
			const bundle = bundleInfoPlist === undefined ? {} : { bundleInfoPlist };
			const hostArchitecture = options.hostArchitecture ?? process.arch;
			const { targetKind, formatHint, signal, architecture, entryPoint } = options;
			throwIfTargetResolutionCancelled(signal);
			if (formatHint === "raw-binary") {
				if (targetKind !== undefined && targetKind !== "executable") return err(new BinaryTargetError(path, "raw-binary format requires an executable target kind", { constraint: "load_selection_rejected" }));
				const admitted = admitRawBinary({
					architecture,
					entryPoint,
					fileBytes: metadata.size
				});
				if (!admitted.ok) return err(new BinaryTargetError(path, admitted.error.reason, { constraint: admitted.error.constraint }));
				return ok({
					path,
					sourcePath,
					...bundle,
					sha256: await sha256Handle(handle, path, metadata, signal),
					kind: "executable",
					format: "raw-binary",
					architecture: admitted.value.architecture,
					availableArchitectures: [admitted.value.architecture],
					entryPoint: admitted.value.entryPoint,
					entryPointSource: admitted.value.entryPointSource
				});
			}
			const pairing = rawBinarySelectionError({
				...formatHint === undefined ? {} : { format: formatHint },
				architecture,
				entryPoint
			});
			if (pairing !== undefined) return err(new BinaryTargetError(path, pairing, { constraint: "load_selection_rejected" }));
			if (formatHint === "gamecube-dol") {
				if (targetKind !== undefined && targetKind !== "executable") return err(new BinaryTargetError(path, "gamecube-dol format requires an executable target kind", { constraint: "load_selection_rejected" }));
				const headerBytes = await readLeadingBytes(handle, Math.min(metadata.size, 256), path, signal);
				const admitted = admitGamecubeDol({
					bytes: headerBytes,
					fileSize: metadata.size,
					entryPoint
				});
				if (!admitted.ok) return err(new BinaryTargetError(path, admitted.error.reason, { constraint: admitted.error.constraint }));
				return ok({
					path,
					sourcePath,
					...bundle,
					sha256: await sha256Handle(handle, path, metadata, signal),
					kind: "executable",
					format: "gamecube-dol",
					architecture: admitted.value.architecture,
					availableArchitectures: [admitted.value.architecture],
					byteOrder: "big",
					bits: 32,
					entryPoint: admitted.value.entryPoint,
					entryPointSource: admitted.value.entryPointSource,
					dol: admitted.value.header
				});
			}
			if (formatHint === "dos-com") {
				if (targetKind !== undefined && targetKind !== "executable") return err(new BinaryTargetError(path, "DOS COM format requires an executable target kind", { constraint: "load_selection_rejected" }));
				const length = validateDosComLength(metadata.size);
				if (!length.ok) return err(new BinaryTargetError(path, length.error, { constraint: "file_format_rejected" }));
				return ok({
					path,
					sourcePath,
					...bundle,
					sha256: await sha256Handle(handle, path, metadata, signal),
					kind: "executable",
					format: "dos-com",
					architecture: "x86",
					availableArchitectures: ["x86"]
				});
			}
			const artifactFormat = targetKind === "database" ? undefined : await detectArtifactFormat(path, source, signal);
			if (targetKind === "database" || targetKind === undefined && path.toLowerCase().endsWith(".hop")) return ok({
				path,
				sourcePath,
				sha256: await sha256Handle(handle, path, metadata, signal),
				kind: "database",
				format: "analysis-database"
			});
			if (artifactFormat !== undefined) {
				const identity = {
					path,
					sourcePath,
					sha256: await sha256Handle(handle, path, metadata, signal)
				};
				return isArchiveFormat(artifactFormat) ? ok({
					...identity,
					kind: "archive",
					format: artifactFormat
				}) : ok({
					...identity,
					kind: "artifact",
					format: artifactFormat
				});
			}
			const detected = await readExecutableMetadata(source, hostArchitecture, signal);
			if (!detected.ok) {
				if (!await claimsLeadingExecutableHeader(handle, metadata.size, signal) && await locateTrailingZipArchive(metadata.size, (position, length) => readHandleRange(handle, position, length, signal)) !== undefined) return ok({
					path,
					sourcePath,
					sha256: await sha256Handle(handle, path, metadata, signal),
					kind: "archive",
					format: zipRootPackageFormat(path)
				});
				const reason = typeof detected.error === "string" ? detected.error : detected.error.reason;
				const diagnostics = typeof detected.error === "string" ? undefined : detected.error.diagnostics;
				return err(new BinaryTargetError(path, reason, {
					constraint: "file_format_rejected",
					...diagnostics === undefined ? {} : { diagnostics }
				}));
			}
			return ok({
				path,
				sourcePath,
				...bundle,
				sha256: await sha256Handle(handle, path, metadata, signal),
				kind: "executable",
				...detected.value
			});
		};
		finalizedTargetResolution = (result, signal) => {
			if (!result.ok || signal?.aborted !== true) return result;
			return err(new AnalysisCancelledError("resolve_binary_target", {
				cause: signal.reason,
				diagnostics: { completed_target: jsonValueSchema.parse(result.value) }
			}));
		};
		targetFileCleanupError = (failure, candidate, stage) => {
			const cancellation = regularFileCancellation(failure);
			const completed = failure.outcome.kind === "completed" ? failure.outcome.value : undefined;
			const completedTarget = completed?.ok === true ? jsonValueSchema.parse(completed.value) : undefined;
			let primary;
			if (failure.outcome.kind === "failed") {
				const physical = failure.outcome.cause;
				primary = physical instanceof BinaryTargetError || physical instanceof AnalysisCancelledError ? physical : cancellation !== undefined ? new AnalysisCancelledError("resolve_binary_target", { cause: cancellation.reason }) : classifyTargetFilesystemFailure(candidate, physical, stage) ?? new BinaryTargetError(failure.path, "Target read failed before file cleanup", { cause: physical });
			} else if (completed?.ok === false) primary = completed.error;
			else if (cancellation !== undefined) primary = new AnalysisCancelledError("resolve_binary_target", {
				cause: cancellation.reason,
				...completedTarget === undefined ? {} : { diagnostics: { completed_target: completedTarget } }
			});
			const error = new BinaryTargetError(failure.path, "The target file handle could not be closed", {
				cause: failure,
				cleanupPrimary: primary,
				cleanup: {
					reason: failure.cleanupCause instanceof Error ? failure.cleanupCause.message : String(failure.cleanupCause),
					resources: [failure.path]
				},
				diagnostics: {
					...primary === undefined ? {} : { primary_error: projectAnalysisError(primary) },
					...completedTarget === undefined ? {} : { completed_target: completedTarget }
				}
			});
			bindRegularFileCleanup(failure, error);
			return error;
		};
		targetResolutionFailure = (cause, candidate, stage, signal) => {
			const physical = cause instanceof OwnedRegularFileOperationFailure ? cause.operationCause : cause;
			if (physical instanceof AnalysisCancelledError || physical instanceof BinaryTargetError) return err(physical);
			if (!(cause instanceof OwnedRegularFileOperationFailure)) {
				const cancellation = regularFileCancellation(cause);
				if (cancellation !== undefined) return err(new AnalysisCancelledError("resolve_binary_target", { cause: cancellation.reason }));
			}
			if (signal?.aborted === true && physical === signal.reason) return err(new AnalysisCancelledError("resolve_binary_target", { cause: physical }));
			const failure = classifyTargetFilesystemFailure(candidate, physical, stage);
			if (failure === undefined) throw physical;
			return err(failure);
		};
		classifyBinaryTargetFilesystemFailure = (path, cause) => classifyTargetFilesystemFailure(path, cause, "read");
		classifyTargetFilesystemFailure = (path, cause, stage) => {
			if (!(cause instanceof Error)) return undefined;
			const code = filesystemErrorCode(cause);
			return code === undefined ? undefined : new BinaryTargetError(path, targetFailureReason(code, cause.message, stage), { cause });
		};
		filesystemErrorCode = (cause) => {
			const code = Reflect.get(cause, "code");
			return typeof code === "string" ? code : undefined;
		};
		targetFailureReason = (code, detail, stage) => {
			switch (code) {
				case "ENOENT":
				case "ENOTDIR": return `target does not exist or a path component is not a directory: ${detail}`;
				case "EACCES":
				case "EPERM": return `permission denied while reading target: ${detail}`;
				case "EISDIR": return `target is a directory, not a readable file: ${detail}`;
				case "ENOTFILE": return "target is not a regular file";
				case "ELOOP": return stage === "resolve" ? `target path could not be resolved: too many symbolic links or a symbolic link loop: ${detail}` : `target changed while being opened: ${detail}`;
				default: return `target could not be read (${code}): ${detail}`;
			}
		};
		throwIfTargetResolutionCancelled = (signal) => {
			if (signal?.aborted === true) throw new AnalysisCancelledError("resolve_binary_target", { cause: signal.reason });
		};
		detectArtifactFormat = async (path, source, signal) => {
			const { handle, initial } = source;
			throwIfTargetResolutionCancelled(signal);
			const lower = path.toLowerCase();
			const magic = Buffer.alloc(4096);
			const observed = await handle.read(magic, 0, magic.length, 0);
			throwIfTargetResolutionCancelled(signal);
			if (observed.bytesRead >= 8 && magic.subarray(0, 8).equals(Buffer.from([
				0,
				97,
				115,
				109,
				1,
				0,
				0,
				0
			]))) throw new BinaryTargetError(path, "WebAssembly v1 artifacts are not supported by the native opening route", { constraint: "wasm_requires_static_inspection" });
			if (hasZipSignature(magic.subarray(0, observed.bytesRead))) return zipRootPackageFormat(lower);
			if (hasGodotPckHeader(magic.subarray(0, observed.bytesRead))) return "godot-pck";
			if (hasBinaryPlistSignature(magic.subarray(0, observed.bytesRead))) return "plist";
			const named = namedArtifactFormat(lower);
			if (named !== undefined) return named;
			if (lower.endsWith(".pkg") && observed.bytesRead >= 4 && magic.subarray(0, 4).equals(Buffer.from("xar!"))) return "pkg";
			if (lower.endsWith(".dmg")) {
				throwIfTargetResolutionCancelled(signal);
				const size = initial.size;
				if (size >= 512) {
					const trailer = Buffer.alloc(4);
					const read = await handle.read(trailer, 0, trailer.length, size - 512);
					throwIfTargetResolutionCancelled(signal);
					if (read.bytesRead === 4 && trailer.equals(Buffer.from("koly"))) return "dmg";
				}
			}
			const xmlProbe = createXmlPlistSignatureProbe();
			let xmlState = xmlProbe.write(magic.subarray(0, observed.bytesRead));
			if (xmlState === "matched") return "plist";
			const chunk = Buffer.alloc(XML_PLIST_PROBE_CHUNK_BYTES);
			let bytesRead = observed.bytesRead;
			while (xmlState === "pending" && bytesRead < 1048576) {
				throwIfTargetResolutionCancelled(signal);
				const read = await handle.read(chunk, 0, Math.min(chunk.length, MAX_XML_PLIST_PROBE_BYTES - bytesRead), bytesRead);
				throwIfTargetResolutionCancelled(signal);
				if (read.bytesRead === 0) break;
				bytesRead += read.bytesRead;
				xmlState = xmlProbe.write(chunk.subarray(0, read.bytesRead));
				if (xmlState === "matched") return "plist";
			}
			if (bytesRead === 1048576) {
				const { size } = initial;
				throwIfTargetResolutionCancelled(signal);
				if (size > bytesRead) throw new BinaryTargetError(path, "XML plist prolog was not found within the 1 MiB format probe limit", { constraint: "file_format_rejected" });
			}
			return undefined;
		};
		namedArtifactFormat = (lowerPath) => {
			if (lowerPath.endsWith(".asar")) return "asar";
			if (lowerPath.endsWith(".plist")) return "plist";
			if (lowerPath.endsWith(".map")) return "source-map";
			return /\.(?:m?js|cjs)$/u.test(lowerPath) ? "javascript" : undefined;
		};
		isArchiveFormat = (format) => isZipPackageFormat(format) || [
			"asar",
			"godot-pck",
			"dmg",
			"pkg"
		].includes(format);
		claimsLeadingExecutableHeader = async (handle, size, signal) => claimsExecutableHeader(Buffer.from(await readHandleRange(handle, 0, Math.min(size, 4096), signal)), size);
		readHandleRange = async (handle, position, length, signal) => {
			throwIfTargetResolutionCancelled(signal);
			const bytes = Buffer.alloc(length);
			const observed = await handle.read(bytes, 0, length, position);
			throwIfTargetResolutionCancelled(signal);
			return bytes.subarray(0, observed.bytesRead);
		};
		readLeadingBytes = async (handle, size, path, signal) => {
			const bytes = Buffer.allocUnsafe(size);
			let position = 0;
			while (position < size) {
				throwIfTargetResolutionCancelled(signal);
				const observed = await handle.read(bytes, position, size - position, position);
				if (observed.bytesRead === 0) throw new BinaryTargetError(path, "target changed while being read");
				position += observed.bytesRead;
			}
			return bytes;
		};
		sha256Handle = async (handle, path, initial, signal) => {
			const hash = createHash("sha256");
			const chunk = Buffer.allocUnsafe(64 * 1024);
			let position = 0;
			while (true) {
				throwIfTargetResolutionCancelled(signal);
				const observed = await handle.read(chunk, 0, Math.min(chunk.length, initial.size - position + 1), position);
				throwIfTargetResolutionCancelled(signal);
				if (observed.bytesRead === 0) break;
				hash.update(chunk.subarray(0, observed.bytesRead));
				position += observed.bytesRead;
				if (position > initial.size) throw new BinaryTargetError(path, "target grew while being read");
			}
			throwIfTargetResolutionCancelled(signal);
			const [opened, currentPath] = await Promise.all([handle.stat(), lstat(path)]);
			if (!sameRegularFileState(initial, opened) || !sameRegularFileState(initial, currentPath) || position !== initial.size) throw new BinaryTargetError(path, "target changed while being read");
			return hash.digest("hex");
		};
		resolveAppBundle = async (path) => {
			const metadata = await stat(path);
			if (!metadata.isDirectory()) return ok({ executable: path });
			if (extname(path).toLowerCase() !== ".app") return err(new BinaryTargetError(path, "this opening route requires a file or app bundle", { constraint: "directory_requires_file" }));
			return resolveAppBundleExecutable(path);
		};
		readExecutableMetadata = async (source, hostArchitecture, signal) => {
			const { handle, initial } = source;
			throwIfTargetResolutionCancelled(signal);
			const prefix = Buffer.alloc(4096);
			const prefixRead = await handle.read(prefix, 0, prefix.length, 0);
			throwIfTargetResolutionCancelled(signal);
			const bytes = prefix.subarray(0, prefixRead.bytesRead);
			const fileSize = initial.size;
			if (bytes.length >= 2 && bytes[0] === 77 && bytes[1] === 90) {
				let evidence = parseMzHeaderEvidence(bytes, fileSize);
				let signatureEvidence;
				if (evidence.windowsHeader.state === "signature-needed") {
					const { offset } = evidence.windowsHeader;
					const signature = Buffer.alloc(Math.min(4, fileSize - offset));
					const observedSignature = await handle.read(signature, 0, signature.length, offset);
					throwIfTargetResolutionCancelled(signal);
					signatureEvidence = {
						offset,
						bytes: signature.subarray(0, observedSignature.bytesRead)
					};
					evidence = parseMzHeaderEvidence(bytes, fileSize, signatureEvidence);
				}
				const { windowsHeader } = evidence;
				if (windowsHeader.state === "declared") {
					const limitation = mzWindowsHeaderLayoutLimitation(windowsHeader);
					if (limitation !== undefined) return err({
						reason: limitation,
						diagnostics: {
							unsupported_layout: true,
							mz_windows_header: { ...windowsHeader }
						}
					});
					return readPeMetadata(handle, windowsHeader.offset, bytes, fileSize, signal);
				}
				const tableEnd = bytes.length >= 28 ? bytes.readUInt16LE(24) + bytes.readUInt16LE(6) * 4 : 0;
				const headerBytes = bytes.length >= 28 ? bytes.readUInt16LE(8) * 16 : 0;
				if (tableEnd > bytes.length && tableEnd <= headerBytes && tableEnd <= fileSize) {
					const table = Buffer.alloc(tableEnd);
					const observed = await handle.read(table, 0, table.length, 0);
					throwIfTargetResolutionCancelled(signal);
					evidence = parseMzHeaderEvidence(table.subarray(0, observed.bytesRead), fileSize, signatureEvidence);
					if (evidence.windowsHeader.state === "candidate") return err(unresolvedMzHeaderFailure(evidence.windowsHeader, evidence.dos));
					return parseExecutableHeader(table.subarray(0, observed.bytesRead), hostArchitecture, fileSize, signatureEvidence);
				}
				if (windowsHeader.state === "candidate") return err(unresolvedMzHeaderFailure(windowsHeader, evidence.dos));
				return parseExecutableHeader(bytes, hostArchitecture, fileSize, signatureEvidence);
			}
			if (bytes.length >= 4 && bytes.toString("hex", 0, 4) === "7f454c46") return readElfMetadata(handle, bytes, {
				fileSize,
				hostArchitecture,
				signal
			});
			const thin = await readThinMachoMetadata(handle, bytes, {
				fileSize,
				hostArchitecture,
				signal
			});
			if (thin !== null) return thin;
			const hasJvmMagic = bytes.length >= 4 && bytes.readUInt32BE(0) === 3405691582;
			if (hasJvmMagic && fileSize > bytes.length && fileSize <= 16777216) {
				const complete = await readHandleRange(handle, 0, fileSize, signal);
				if (complete.byteLength === fileSize && isJvmClassFile(complete)) return err("unsupported binary format");
			}
			const fatEvidence = await readFatSliceHeaderEvidence(handle, bytes, fileSize, signal);
			if (hasJvmMagic && fileSize > 16777216 && fatEvidence !== undefined && classifyFatContainerIdentity(fatEvidence.header, (offset) => fatEvidence.sliceHeadersByOffset.get(offset)?.magic).state === "malformed") return err(JVM_CLASS_IDENTITY_LIMIT_REASON);
			const parsed = parseExecutableHeader(bytes, hostArchitecture, fileSize, undefined, fatEvidence);
			if (parsed.ok && parsed.value.format === "mach-o-universal" && fatEvidence !== undefined) {
				for (const slice of fatEvidence.header.slices) {
					const framed = await readMachoSliceCommandFrames(handle, slice, signal);
					if (!framed.ok) return framed;
				}
			}
			return parsed;
		};
		readElfMetadata = async (handle, bytes, options) => {
			const { fileSize, hostArchitecture, signal } = options;
			const parsed = parseExecutableHeader(bytes, hostArchitecture, fileSize);
			if (!parsed.ok || parsed.value.format !== "elf") return parsed;
			const ranges = await readElfDeclaredRanges(handle, bytes, fileSize, signal);
			if (!ranges.ok) return ranges;
			if (parsed.value.architecture !== "mips" || parsed.value.mips.elfClass !== 32) return parsed;
			const declarations = await readMipsElfMetadata(handle, parsed.value.mips, () => throwIfTargetResolutionCancelled(signal));
			if (!declarations.ok) return declarations;
			return ok({
				...parsed.value,
				mips: {
					...parsed.value.mips,
					abiFlags: declarations.value.abiFlags,
					gnuAttributes: declarations.value.gnuAttributes,
					...declarations.value.sharedLoad === undefined ? {} : { sharedLoad: declarations.value.sharedLoad },
					...declarations.value.limitations.length === 0 ? {} : { limitations: declarations.value.limitations }
				}
			});
		};
		readElfDeclaredRanges = async (handle, prefix, fileSize, signal) => {
			const ranges = validateElfDeclaredRanges(prefix, fileSize);
			let next = ranges.next();
			let window;
			while (!next.done) {
				throwIfTargetResolutionCancelled(signal);
				const { offset, size } = next.value;
				let bytes;
				if (offset + size <= prefix.length) bytes = prefix.subarray(offset, offset + size);
				else {
					window ??= Buffer.allocUnsafe(64 * 1024);
					bytes = window.subarray(0, size);
					let length = 0;
					while (length < size) {
						const read = await handle.read(bytes, length, size - length, offset + length);
						throwIfTargetResolutionCancelled(signal);
						if (read.bytesRead === 0) break;
						length += read.bytesRead;
					}
					bytes = bytes.subarray(0, length);
				}
				next = ranges.next(bytes);
			}
			return next.value;
		};
		unresolvedMzHeaderFailure = (windowsHeader, dos) => {
			return {
				reason: "MZ Windows new-header candidate is unresolved",
				diagnostics: {
					mz_windows_header: {
						state: windowsHeader.state,
						offset: windowsHeader.offset,
						signature: windowsHeader.signature
					},
					mz_dos: dos.ok ? {
						state: "valid",
						header_bytes: dos.value.headerBytes,
						image_bytes: dos.value.imageBytes,
						module_bytes: dos.value.moduleBytes,
						overlay_bytes: dos.value.overlayBytes,
						relocation_count: dos.value.relocationCount,
						relocation_table_offset: dos.value.relocationTableOffset,
						entry_segment: dos.value.entrySegment,
						entry_offset: dos.value.entryOffset
					} : {
						state: "invalid",
						reason: dos.error
					}
				}
			};
		};
		readThinMachoMetadata = async (handle, prefix, input) => {
			const table = readMachoLoadCommandTableHeader(prefix, input.fileSize);
			if (!table.ok) return table;
			if (table.value === null) return null;
			const parsed = parseExecutableHeader(prefix.subarray(0, table.value.headerSize), input.hostArchitecture, input.fileSize);
			if (!parsed.ok) return parsed;
			const framed = await readMachoCommandFrames(handle, table.value, {
				prefix,
				fileSize: input.fileSize,
				signal: input.signal
			});
			return framed.ok ? parsed : framed;
		};
		readMachoCommandFrames = async (handle, table, input) => {
			const commands = new MachoLoadCommandCursor(table);
			let window = input.prefix;
			let windowOffset = 0;
			while (commands.nextOffset !== null) {
				const offset = table.headerSize + commands.nextOffset;
				if (offset + 8 <= input.fileSize && (offset < windowOffset || offset + 8 > windowOffset + window.length)) {
					window = Buffer.alloc(Math.min(4096, input.fileSize - offset));
					windowOffset = offset;
					const observed = await handle.read(window, 0, window.length, (input.fileOffset ?? 0) + offset);
					throwIfTargetResolutionCancelled(input.signal);
					window = window.subarray(0, observed.bytesRead);
				}
				const relative = offset - windowOffset;
				const frame = commands.read(relative >= 0 ? window.subarray(relative, relative + 8) : Buffer.alloc(0));
				if (!frame.ok) return frame;
			}
			return commands.finish();
		};
		readMachoSliceCommandFrames = async (handle, slice, signal) => {
			const prefix = Buffer.alloc(Math.min(4096, slice.size));
			const observed = await handle.read(prefix, 0, prefix.length, slice.offset);
			throwIfTargetResolutionCancelled(signal);
			const bytes = prefix.subarray(0, observed.bytesRead);
			const table = readMachoLoadCommandTableHeader(bytes, slice.size);
			if (!table.ok) return table;
			if (table.value === null) return err("FAT slice does not identify a thin Mach-O image");
			return readMachoCommandFrames(handle, table.value, {
				prefix: bytes,
				fileSize: slice.size,
				fileOffset: slice.offset,
				signal
			});
		};
		readFatSliceHeaderEvidence = async (handle, prefix, fileSize, signal) => {
			let header = readFatContainerHeader(prefix, fileSize);
			if (header.state === "needs-data") {
				const table = Buffer.alloc(header.requiredBytes);
				let bytesRead = 0;
				while (bytesRead < table.length) {
					throwIfTargetResolutionCancelled(signal);
					const read = await handle.read(table, bytesRead, table.length - bytesRead, bytesRead);
					throwIfTargetResolutionCancelled(signal);
					if (read.bytesRead === 0) break;
					bytesRead += read.bytesRead;
				}
				header = readFatContainerHeader(table.subarray(0, bytesRead), fileSize);
			}
			if (header.state !== "parsed") return undefined;
			const sliceHeadersByOffset = new Map();
			for (let index = 0; index < header.slices.length; index += 1) {
				const slice = header.slices[index];
				if (slice === undefined) continue;
				if (header.rangeIssues[index] !== null) {
					sliceHeadersByOffset.set(slice.offset, readMachoHeaderPrefixFacts(Buffer.alloc(0)));
					continue;
				}
				const observedLength = Math.min(12, slice.size);
				const thinHeader = Buffer.alloc(observedLength);
				let bytesRead = 0;
				while (bytesRead < thinHeader.length) {
					throwIfTargetResolutionCancelled(signal);
					const read = await handle.read(thinHeader, bytesRead, thinHeader.length - bytesRead, slice.offset + bytesRead);
					throwIfTargetResolutionCancelled(signal);
					if (read.bytesRead === 0) break;
					bytesRead += read.bytesRead;
				}
				sliceHeadersByOffset.set(slice.offset, readMachoHeaderPrefixFacts(thinHeader.subarray(0, bytesRead)));
			}
			return {
				header,
				sliceHeadersByOffset
			};
		};
		readPeMetadata = async (handle, offset, mzPrefix, fileSize, signal) => {
			throwIfTargetResolutionCancelled(signal);
			const fileHeader = Buffer.alloc(24);
			const fileHeaderRead = await handle.read(fileHeader, 0, fileHeader.length, offset);
			throwIfTargetResolutionCancelled(signal);
			if (fileHeaderRead.bytesRead !== fileHeader.length) return err("invalid or truncated PE header");
			const windowsHeader = observeMzWindowsHeader(mzPrefix, fileSize, {
				offset,
				bytes: fileHeader.subarray(0, 4)
			});
			if (windowsHeader.state !== "declared") return err("invalid Windows new-header signature in MZ image");
			if ([
				"NE",
				"LE",
				"LX"
			].includes(windowsHeader.signature)) return err(`unsupported ${windowsHeader.signature} executable in MZ image`);
			const optionalHeaderSize = fileHeader.readUInt16LE(20);
			if (optionalHeaderSize > 4096) return err("invalid PE optional header size");
			const numberOfSections = fileHeader.readUInt16LE(6);
			const record = Buffer.alloc(24 + optionalHeaderSize);
			const recordRead = await handle.read(record, 0, record.length, offset);
			throwIfTargetResolutionCancelled(signal);
			if (recordRead.bytesRead !== record.length) return err("invalid or truncated PE header");
			const codeView = await readPeCodeView(handle, offset, numberOfSections, record.subarray(24), optionalHeaderSize, signal);
			return parsePeRecord(record, codeView);
		};
		readPeCodeView = async (handle, peOffset, numberOfSections, optionalHeader, optionalHeaderSize, signal) => {
			throwIfTargetResolutionCancelled(signal);
			const debugDir = peDebugDirectoryEntry(optionalHeader);
			if (debugDir === undefined || numberOfSections > 96) return undefined;
			const sectionTableOffset = peOffset + 24 + optionalHeaderSize;
			const sectionTableSize = numberOfSections * 40;
			const sectionTable = Buffer.alloc(sectionTableSize);
			const sectionRead = await handle.read(sectionTable, 0, sectionTableSize, sectionTableOffset);
			throwIfTargetResolutionCancelled(signal);
			if (sectionRead.bytesRead !== sectionTableSize) return undefined;
			const debugFileOffset = peRvaToFileOffset(debugDir.debugRva, sectionTable, numberOfSections, debugDir.sizeOfHeaders, Math.min(debugDir.debugSize, 4096));
			if (debugFileOffset === undefined) return undefined;
			const maxDebugSize = Math.min(debugDir.debugSize, 4096);
			const debugDirectoryBuffer = Buffer.alloc(maxDebugSize);
			const debugDirRead = await handle.read(debugDirectoryBuffer, 0, maxDebugSize, debugFileOffset);
			throwIfTargetResolutionCancelled(signal);
			const numEntries = Math.floor(debugDirRead.bytesRead / 28);
			for (let j = 0; j < numEntries; j++) {
				const entryOffset = j * 28;
				const type = debugDirectoryBuffer.readUInt32LE(entryOffset + 12);
				if (type !== 2) continue;
				const sizeOfData = debugDirectoryBuffer.readUInt32LE(entryOffset + 16);
				let pointerToRawData = debugDirectoryBuffer.readUInt32LE(entryOffset + 24);
				if (pointerToRawData === 0) {
					const addressOfRawData = debugDirectoryBuffer.readUInt32LE(entryOffset + 20);
					const mapped = peRvaToFileOffset(addressOfRawData, sectionTable, numberOfSections, debugDir.sizeOfHeaders, Math.min(sizeOfData, 4096));
					if (mapped === undefined) continue;
					pointerToRawData = mapped;
				}
				if (sizeOfData < 16) continue;
				const maxCodeViewRead = Math.min(sizeOfData, 4096);
				const codeViewBuffer = Buffer.alloc(maxCodeViewRead);
				const codeViewRead = await handle.read(codeViewBuffer, 0, maxCodeViewRead, pointerToRawData);
				throwIfTargetResolutionCancelled(signal);
				const parsed = parseCodeViewData(codeViewBuffer.subarray(0, codeViewRead.bytesRead), sizeOfData);
				if (parsed !== undefined) return parsed;
			}
			return undefined;
		};
	})))();
}

//#endregion
export { classifyBinaryTargetFilesystemFailure, findAppBundleResourceRoot, init_AppBundleExecutable, init_BinaryTargetResolver, init_elfDeclaredRanges, parseBinaryTarget, readElfTableDeclarations, resolveAppBundleResourceRoot };