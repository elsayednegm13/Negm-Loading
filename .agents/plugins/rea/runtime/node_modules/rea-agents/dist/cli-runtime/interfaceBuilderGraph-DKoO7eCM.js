import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { BINARY_ARCHITECTURES, analysisStringSchema, compareUnicodeCodePoints, compositeKey, init_binaryTargetTypes, init_evidence, init_hopperValues, init_nativeCallReference, init_nativeSymbol, init_unicodeCodePointOrder, isMachOFormat, nativeCallReferenceSchema, nativeSymbolMetadataSchema, providerSchema } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { init_jsonValue, jsonValueSchema } from "./jsonLines-Gf10X4s1.js";
import { z } from "zod";

//#region dist/domain/apple/machoTargetSelection.js
var machoTargetSelectionSchema, profileMachoTargetSelection, MACHO_CPU_TYPES, machoSliceArchitectureSchema, machoTargetSelectionMatchesArchitecture, machoSelectionContainsRange, machoTargetSelectionMatchesFormat, sameMachoTargetSelection, metadataReportSubjectFormat, selectedSliceAgreesWithReport;
function init_machoTargetSelection() {
	return (init_machoTargetSelection = __esmMin((() => {
		machoTargetSelectionSchema = z.strictObject({
			kind: z.literal("macho-selected-image-v1"),
			container: z.enum(["thin", "fat"]),
			offset: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
			byte_length: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
			cpu_type: z.number().int().nonnegative().max(4294967295),
			/** Keep the complete raw subtype, including capability bits. */
			cpu_subtype: z.number().int().nonnegative().max(4294967295),
			container_table_sha256: z.string().regex(/^[a-f0-9]{64}$/u).nullable()
		}).superRefine((selection, context) => {
			if (selection.container === "thin" && (selection.offset !== 0 || selection.container_table_sha256 !== null) || selection.container === "fat" && selection.container_table_sha256 === null) context.addIssue({
				code: "custom",
				message: "Invalid Mach-O container identity"
			});
		});
		profileMachoTargetSelection = (profile) => {
			const raw = profile?.parameters.target_selection;
			if (raw === undefined) return undefined;
			const parsed = machoTargetSelectionSchema.safeParse(raw);
			return parsed.success ? parsed.data : undefined;
		};
		MACHO_CPU_TYPES = {
			x86: 7,
			x86_64: 16777223,
			arm: 12,
			arm64: 16777228
		};
		machoSliceArchitectureSchema = z.enum([
			"x86",
			"x86_64",
			"arm",
			"arm64"
		]).describe("CPU family of the slice to read from a universal (FAT) Mach-O. Required for universal files and rejected for every other image.");
		machoTargetSelectionMatchesArchitecture = (selection, architecture) => {
			const cpuTypes = MACHO_CPU_TYPES;
			return cpuTypes[architecture] === selection.cpu_type;
		};
		machoSelectionContainsRange = (selection, fileBytes, offset, bytes) => selection.offset + selection.byte_length <= fileBytes && offset >= selection.offset && bytes <= selection.offset + selection.byte_length - offset;
		machoTargetSelectionMatchesFormat = (selection, format) => selection.container === (format === "mach-o" ? "thin" : "fat");
		sameMachoTargetSelection = (left, right) => left !== undefined && right !== undefined && left.container === right.container && left.offset === right.offset && left.byte_length === right.byte_length && left.cpu_type === right.cpu_type && left.cpu_subtype === right.cpu_subtype && left.container_table_sha256 === right.container_table_sha256;
		metadataReportSubjectFormat = (report) => report.format !== "macho" ? report.format : report.selected_slice === undefined ? "mach-o" : "mach-o-universal";
		selectedSliceAgreesWithReport = (selection, format, architecture) => selection.container === "fat" && format === "macho" && architecture !== undefined && machoTargetSelectionMatchesArchitecture(selection, architecture);
	})))();
}

//#endregion
//#region dist/domain/native/nativeInventory.js
var addressedValueSchema, nativeInventoryRowsSchemas, NATIVE_INVENTORY_OPERATIONS, nativeInventoryOperationSchema, isNativeInventoryOperation;
function init_nativeInventory() {
	return (init_nativeInventory = __esmMin((() => {
		init_nativeSymbol();
		init_hopperValues();
		addressedValueSchema = z.object({
			address: z.string(),
			value: z.string(),
			symbol: nativeSymbolMetadataSchema.exactOptional(),
			objc_class_label: z.literal("hopper_legacy_class_object").exactOptional(),
			procedure: z.object({
				external: z.boolean(),
				thunk: z.boolean(),
				thunk_target: z.string().nullable()
			}).exactOptional(),
			string: z.object({
				encoding: z.string(),
				termination: z.enum(["missing", "present_or_not_required"]),
				byte_length: z.number().int().min(0)
			}).exactOptional()
		});
		nativeInventoryRowsSchemas = {
			names: z.array(addressedValueSchema),
			strings: z.array(analysisStringSchema)
		};
		NATIVE_INVENTORY_OPERATIONS = [
			"list_procedures",
			"search_procedures",
			"list_strings",
			"search_strings",
			"list_names"
		];
		nativeInventoryOperationSchema = z.enum(NATIVE_INVENTORY_OPERATIONS);
		isNativeInventoryOperation = (operation) => NATIVE_INVENTORY_OPERATIONS.some((supported) => supported === operation);
	})))();
}

//#endregion
//#region dist/domain/apple/bundleResourceRoot.js
var bundleResourceRootSchema, bundleResourceBoundResultSchema;
function init_bundleResourceRoot() {
	return (init_bundleResourceRoot = __esmMin((() => {
		bundleResourceRootSchema = z.strictObject({
			caller_path: z.string().min(1),
			canonical_path: z.string().min(1),
			info_plist_path: z.string().min(1),
			layout: z.enum(["contents", "root"]),
			executable_sha256: z.string().regex(/^[a-f0-9]{64}$/u).nullable()
		});
		bundleResourceBoundResultSchema = (executableSha256, fields) => z.union([z.strictObject({
			target_sha256: executableSha256,
			resource_root: bundleResourceRootSchema.optional(),
			...fields
		}), z.strictObject({
			target_sha256: z.null(),
			resource_root: bundleResourceRootSchema,
			...fields
		})]);
	})))();
}

//#endregion
//#region dist/domain/apple/plistUid.js
var plistUidValues, markPlistDictionary, copyPlistUidIdentity, plistUidValue;
function init_plistUid() {
	return (init_plistUid = __esmMin((() => {
		plistUidValues = new WeakMap();
		markPlistDictionary = (value, uid) => {
			plistUidValues.set(value, uid);
		};
		copyPlistUidIdentity = (source, projected) => {
			if (plistUidValues.has(source)) plistUidValues.set(projected, plistUidValues.get(source));
		};
		plistUidValue = (value) => {
			if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
			if (plistUidValues.has(value)) return plistUidValues.get(value);
			const fields = Object.keys(value);
			if (fields.length !== 1) return undefined;
			const key = fields[0];
			if (key !== "CF$UID") return undefined;
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			return typeof descriptor?.value === "number" ? descriptor.value : undefined;
		};
	})))();
}

//#endregion
//#region dist/domain/apple/plistNumbers.js
var incompletePlistNumberLimitation, createPlistNumberCollector, createPlistNumberProjection;
function init_plistNumbers() {
	return (init_plistNumbers = __esmMin((() => {
		init_plistUid();
		incompletePlistNumberLimitation = "Property-list number metadata could not be completely observed; decoded numbers may lose integer precision and exact integer/real association is unavailable.";
		createPlistNumberCollector = () => {
			const integers = new Map();
			const reals = new Set();
			let unsafeIntegerLiterals = 0;
			return {
				integer: (exact) => {
					if (exact >= BigInt(Number.MIN_SAFE_INTEGER) && exact <= BigInt(Number.MAX_SAFE_INTEGER)) return;
					unsafeIntegerLiterals++;
					const rounded = Number(exact);
					integers.set(rounded, (integers.get(rounded) ?? new Set()).add(exact.toString()));
				},
				real: (value) => {
					reals.add(value);
				},
				result: (incomplete = false) => ({
					integers,
					reals,
					unsafeIntegerLiterals,
					incomplete
				})
			};
		};
		createPlistNumberProjection = (literals) => {
			let exactIntegerCount = 0;
			let ambiguousNumberCount = 0;
			const mapNumber = (item) => {
				if (Number.isSafeInteger(item) || !Number.isInteger(item)) return item;
				if (literals.incomplete) {
					ambiguousNumberCount += 1;
					return item;
				}
				const decimals = literals.integers.get(item);
				if (decimals === undefined) {
					if (!literals.reals.has(item)) ambiguousNumberCount += 1;
					return item;
				}
				const [decimal] = decimals;
				if (decimals.size !== 1 || decimal === undefined || literals.reals.has(item)) {
					ambiguousNumberCount += 1;
					return item;
				}
				exactIntegerCount += 1;
				return {
					$plist_type: "integer",
					decimal
				};
			};
			const map = (item) => {
				if (typeof item === "number") return mapNumber(item);
				if (Array.isArray(item)) return item.map(map);
				if (item !== null && typeof item === "object") {
					const marker = plistUidValue(item);
					const reference = marker !== undefined;
					if (reference) {
						if (typeof marker === "number" && !Number.isSafeInteger(marker) && (literals.integers.has(marker) || !literals.reals.has(marker))) ambiguousNumberCount += 1;
						return item;
					}
					return Object.fromEntries(Object.entries(item).map(([key, child]) => [key, map(child)]));
				}
				return item;
			};
			return {
				project: map,
				limitations: () => [
					...literals.incomplete ? [incompletePlistNumberLimitation] : [],
					...literals.unsafeIntegerLiterals === 0 ? [] : [`${String(literals.unsafeIntegerLiterals)} observed integer literal(s) in the original archive exceed the exact range of a JSON number. Decoded numbers may lose integer precision unless represented as { "$plist_type": "integer", "decimal": "<exact digits>" }; the original archive bytes retain those literals.`],
					...exactIntegerCount === 0 ? [] : [`${String(exactIntegerCount)} unambiguous integer value(s) are reported with exact decimal text as { "$plist_type": "integer", "decimal": "<exact digits>" }.`],
					...ambiguousNumberCount === 0 ? [] : [`${String(ambiguousNumberCount)} number(s) beyond the exact integer range remain as decoded because their source integer/real type or reference marker cannot be associated unambiguously; integer precision loss remains possible.`]
				]
			};
		};
	})))();
}

//#endregion
//#region dist/domain/apple/interfaceBuilderKeyedArchive.js
var recordSchema, objectNode, connection, APPKIT_SINGLE_OBJECT_ANNOTATION_CONNECTORS, isUIKitRuntimeConnectionClass, isInterfaceBuilderConnectionClass, isSourceLessAppKitAnnotationConnector, interfaceBuilderConnectionFieldNames, interfaceBuilderRuntimeClassName, requireInterfaceBuilderArchive, parseInterfaceBuilderRecords, archiveUid, HIERARCHY_KEY, keyedArchiveTable, parseKeyedArchive, record, firstString, archivedKindBases, classifyObject, classifyConnection, jsonSafeRecord;
function init_interfaceBuilderKeyedArchive() {
	return (init_interfaceBuilderKeyedArchive = __esmMin((() => {
		init_plistUid();
		init_jsonValue();
		recordSchema = z.record(z.string(), z.unknown());
		objectNode = z.strictObject({
			id: z.string().min(1),
			kind: z.enum([
				"view_controller",
				"view",
				"control",
				"constraint",
				"layout_guide",
				"resource",
				"placeholder",
				"external_object",
				"other"
			]),
			class_name: z.string().nullable(),
			name: z.string().min(1),
			attributes: z.record(z.string(), jsonValueSchema)
		});
		connection = z.strictObject({
			id: z.string().min(1),
			kind: z.enum([
				"outlet",
				"action",
				"segue",
				"other"
			]),
			source_id: z.string().min(1),
			destination_id: z.string().nullable(),
			label: z.string().nullable(),
			attributes: z.record(z.string(), jsonValueSchema)
		});
		APPKIT_SINGLE_OBJECT_ANNOTATION_CONNECTORS = new Set([
			"NSIBHelpConnector",
			"NSNibAXAttributeConnector",
			"NSIBUserDefinedRuntimeAttributesConnector"
		]);
		isUIKitRuntimeConnectionClass = (className) => /^UIRuntime\w*Connection$/u.test(className);
		isInterfaceBuilderConnectionClass = (className) => isUIKitRuntimeConnectionClass(className) || className.startsWith("NS") && className.endsWith("Connector");
		isSourceLessAppKitAnnotationConnector = (className, values) => APPKIT_SINGLE_OBJECT_ANNOTATION_CONNECTORS.has(className) && !Object.hasOwn(values, "NSSource");
		interfaceBuilderConnectionFieldNames = (className) => isUIKitRuntimeConnectionClass(className) ? {
			source: "UISource",
			destination: "UIDestination",
			label: "UILabel"
		} : {
			source: "NSSource",
			destination: "NSDestination",
			label: "NSLabel"
		};
		interfaceBuilderRuntimeClassName = (archivedClass, authoredName) => {
			switch (archivedClass) {
				case "NSClassSwapper":
				case "NSCustomObject":
				case "NSCustomResource": return authoredName("NSClassName") ?? archivedClass;
				case "UIClassSwapper": return authoredName("UIClassName") ?? archivedClass;
				default: return archivedClass;
			}
		};
		requireInterfaceBuilderArchive = (value) => {
			const root = record(value);
			if (root.$archiver === "NSKeyedArchiver" && Array.isArray(root.$objects)) return;
			if ([
				"objects",
				"connections",
				"hierarchy",
				"classes"
			].some((facet) => Object.hasOwn(root, `com.apple.ibtool.document.${facet}`))) return;
			throw new TypeError("Property list is not a recognized Interface Builder archive");
		};
		parseInterfaceBuilderRecords = (value) => {
			requireInterfaceBuilderArchive(value);
			const root = record(value);
			const keyed = parseKeyedArchive(root);
			if (keyed !== null) return keyed;
			const objectsRaw = record(root["com.apple.ibtool.document.objects"]);
			const connectionsRaw = record(root["com.apple.ibtool.document.connections"]);
			const hierarchyRaw = root["com.apple.ibtool.document.hierarchy"];
			const classesRaw = record(root["com.apple.ibtool.document.classes"]);
			const objects = [];
			const connections = [];
			let omittedConnections = 0;
			const objectEntries = Object.entries(objectsRaw);
			for (const [id, raw] of objectEntries.slice(0, 2e4)) {
				const attributes = record(raw);
				const className = firstString(attributes["customClass"], attributes["class"], attributes["isa"]);
				const label = firstString(attributes["label"], attributes["title"], attributes["name"], className);
				const carried = new Set();
				if (attributes["customClass"] === className) carried.add("customClass");
				if (attributes["label"] === label) carried.add("label");
				if (attributes["objectID"] === id) carried.add("objectID");
				objects.push(objectNode.parse({
					id,
					kind: classifyObject(className),
					class_name: className,
					name: label ?? id,
					attributes: jsonSafeRecord(Object.fromEntries(Object.entries(attributes).filter(([key]) => !carried.has(key))))
				}));
			}
			for (const [sourceId, rawConnections] of Object.entries(connectionsRaw)) {
				if (!Array.isArray(rawConnections)) continue;
				for (const [index, raw] of rawConnections.entries()) {
					if (connections.length >= 4e4) {
						omittedConnections += rawConnections.length - index;
						break;
					}
					const item = record(raw);
					const type = firstString(item.type, item.connectionType) ?? "unknown";
					const destination = firstString(item["destination-id"], item.destinationId);
					const label = firstString(item.label, item.selector, item.identifier);
					connections.push(connection.parse({
						id: `${sourceId}:connection:${index}`,
						kind: classifyConnection(type),
						source_id: sourceId,
						destination_id: destination,
						label,
						attributes: jsonSafeRecord(item)
					}));
				}
			}
			return {
				objects,
				connections,
				hierarchy: Array.isArray(hierarchyRaw) ? hierarchyRaw : [],
				classes: classesRaw,
				objectCount: objectEntries.length,
				omittedObjects: Math.max(0, objectEntries.length - 2e4),
				omittedConnections,
				unresolvedConnections: 0,
				omittedHierarchyReferences: 0
			};
		};
		archiveUid = (value) => {
			const uid = plistUidValue(value);
			return uid !== undefined && Number.isInteger(uid) ? uid : undefined;
		};
		HIERARCHY_KEY = /(?:subviews|contentview|childviewcontrollers|children|views)$/iu;
		keyedArchiveTable = (objectTable) => {
			const classFactsByUid = new Map();
			const parseClassFacts = (value) => {
				const descriptor = record(value);
				const rawSuperclasses = Array.isArray(descriptor.$classes) ? descriptor.$classes : [];
				if (!Object.hasOwn(descriptor, "$classname") && rawSuperclasses.length === 0) return null;
				return {
					name: firstString(descriptor.$classname),
					rawSuperclasses,
					superclasses: rawSuperclasses.filter((name) => typeof name === "string")
				};
			};
			const classFactsForUid = (uid) => {
				const cached = classFactsByUid.get(uid);
				if (cached !== undefined) return cached;
				if (!Number.isInteger(uid) || uid < 0 || uid >= objectTable.length) return null;
				const facts = parseClassFacts(objectTable[uid]);
				if (facts !== null) classFactsByUid.set(uid, facts);
				return facts;
			};
			const classFactsOfReference = (reference) => {
				const uid = archiveUid(reference);
				return uid === undefined ? parseClassFacts(reference) : classFactsForUid(uid);
			};
			const classFactsOfObject = (value) => classFactsOfReference(record(value).$class);
			const classNameOf = (value) => classFactsOfObject(value)?.name ?? null;
			const hasClassSuperclass = (value, superclass) => classFactsOfObject(value)?.superclasses.includes(superclass) ?? false;
			/** The class and superclass names an object's descriptor declares in `$classes`. */
			const classChainOf = (value) => classFactsOfObject(value)?.superclasses ?? [];
			/** The string an archived string object holds, if it is one. */
			const archivedString = (target) => {
				if (typeof target === "string") return target;
				const text = record(target)["NS.string"];
				return typeof text === "string" && /^NS(?:Mutable)?String$/u.test(classNameOf(target) ?? "") ? text : undefined;
			};
			/** Only an encoded UID proves which archived object a connector names. */
			const objectReference = (...values) => {
				for (const value of values) {
					const uid = archiveUid(value);
					if (uid !== undefined && uid !== 0 && Object.hasOwn(record(objectTable[uid]), "$class")) return String(uid);
				}
				return null;
			};
			const reference = (uid) => {
				const target = uid === 0 ? null : objectTable[uid];
				if (target === undefined || target === null) return null;
				if (typeof target !== "object") return target;
				const string = archivedString(target);
				if (string !== undefined) return string;
				return {
					archiveUID: uid,
					className: classNameOf(target)
				};
			};
			/** Resolve one object's own fields, leaving references to other objects as stubs. */
			const resolve = (value) => {
				const uid = archiveUid(value);
				if (uid !== undefined) return reference(uid);
				if (Array.isArray(value)) return value.map(resolve);
				if (typeof value !== "object" || value === null) return value;
				const output = {};
				for (const [key, child] of Object.entries(value)) {
					if (key !== "$class") output[key] = resolve(child);
				}
				return output;
			};
			const hierarchy = (start) => {
				let omittedReferences = 0;
				const visited = new Set();
				const root = [];
				const pending = [{
					value: start,
					output: root
				}];
				const appendNode = (item, uid, output) => {
					const children = [];
					output.push({
						objectID: String(uid),
						children
					});
					for (const [key, child] of Object.entries(item).reverse()) if (HIERARCHY_KEY.test(key)) pending.push({
						value: child,
						output: children
					});
				};
				while (pending.length > 0) {
					const entry = pending.pop();
					if (entry === undefined) break;
					const { value, output } = entry;
					const uid = archiveUid(value);
					if (uid !== undefined) {
						if (uid === 0) continue;
						const target = objectTable[uid];
						if (target === undefined) {
							omittedReferences += 1;
							continue;
						}
						if (visited.has(uid)) continue;
						visited.add(uid);
						if (Array.isArray(target)) {
							for (let index = target.length - 1; index >= 0; index -= 1) {
								const child = target[index];
								if (child !== undefined) pending.push({
									value: child,
									output
								});
							}
							continue;
						}
						if (typeof target !== "object" || target === null) continue;
						const item = record(target);
						if (archivedArrayClass(item.$class)) {
							const members = item["NS.objects"];
							if (Array.isArray(members)) for (let index = members.length - 1; index >= 0; index -= 1) {
								const child = members[index];
								if (child !== undefined) pending.push({
									value: child,
									output
								});
							}
							continue;
						}
						appendNode(item, uid, output);
						continue;
					}
					if (Array.isArray(value)) {
						for (let index = value.length - 1; index >= 0; index -= 1) {
							const child = value[index];
							if (child !== undefined) pending.push({
								value: child,
								output
							});
						}
					} else if (typeof value === "object" && value !== null) {
						omittedReferences += 1;
						for (const [key, child] of Object.entries(value).reverse()) if (HIERARCHY_KEY.test(key)) pending.push({
							value: child,
							output
						});
					}
				}
				return {
					items: root,
					omittedReferences
				};
			};
			const archivedArrayClass = (classReference) => {
				const superclasses = classFactsOfReference(classReference)?.superclasses ?? [];
				return superclasses.includes("NSArray") || superclasses.includes("NSMutableArray");
			};
			const classTable = () => Object.fromEntries(objectTable.flatMap((_, uid) => {
				const facts = classFactsForUid(uid);
				return facts === null || facts.name === null ? [] : [[facts.name, { superclasses: facts.rawSuperclasses }]];
			}));
			return {
				resolve,
				hierarchy,
				classNameOf,
				hasClassSuperclass,
				classChainOf,
				classTable,
				objectReference
			};
		};
		parseKeyedArchive = (root) => {
			if (root.$archiver !== "NSKeyedArchiver" || !Array.isArray(root.$objects)) return null;
			const objectTable = root.$objects;
			const { resolve, hierarchy: toHierarchy, classNameOf, hasClassSuperclass, classChainOf, classTable, objectReference } = keyedArchiveTable(objectTable);
			const objects = [];
			const connections = [];
			let objectCount = 0;
			let omittedConnections = 0;
			let unresolvedConnections = 0;
			for (const [index, raw] of objectTable.entries()) {
				if (index === 0) continue;
				const resolved = record(resolve(raw));
				const archivedClassName = classNameOf(raw);
				if (archivedClassName === null && !Object.hasOwn(record(raw), "$class")) continue;
				objectCount += 1;
				const fields = { ...resolved };
				const className = interfaceBuilderRuntimeClassName(archivedClassName, (field) => firstString(fields[field]));
				if (className !== archivedClassName) fields.interface_builder_archived_class_name = archivedClassName;
				if (className === null) fields.$class = record(raw).$class;
				const objectId = String(index);
				const kind = classifyObject(className, classChainOf(raw));
				if (objects.length < 2e4) objects.push(objectNode.parse({
					id: objectId,
					kind,
					class_name: className,
					name: firstString(fields.label, fields.title, fields.identifier, fields.accessibilityLabel, className) ?? `object ${String(index)}`,
					attributes: jsonSafeRecord(fields)
				}));
				if (className !== null && (isInterfaceBuilderConnectionClass(className) || hasClassSuperclass(raw, "NSNibConnector"))) {
					const controlAction = /ControlConnector/iu.test(className);
					const uiKit = isUIKitRuntimeConnectionClass(className);
					const connectionFields = interfaceBuilderConnectionFieldNames(className);
					if (isSourceLessAppKitAnnotationConnector(className, fields)) continue;
					const rawFields = record(raw);
					const source = uiKit ? objectReference(rawFields[connectionFields.source]) : objectReference(controlAction ? rawFields.destination : rawFields.source, rawFields[connectionFields.source], controlAction ? rawFields.to : rawFields.from, controlAction ? rawFields.target : rawFields.owner);
					if (source === null) {
						unresolvedConnections += 1;
						continue;
					}
					const kind = controlAction ? "action" : classifyConnection(className);
					const parsedConnection = connection.parse({
						id: `archive:${objectId}`,
						kind,
						source_id: source,
						destination_id: uiKit ? objectReference(rawFields[connectionFields.destination]) : objectReference(controlAction ? rawFields.source : rawFields.destination, rawFields[connectionFields.destination], controlAction ? rawFields.from : rawFields.to, controlAction ? rawFields.owner : rawFields.target),
						label: uiKit ? firstString(fields[connectionFields.label]) : firstString(fields.label, fields[connectionFields.label], fields.selector, fields.identifier, fields.action),
						attributes: jsonSafeRecord(fields)
					});
					if (connections.length < 4e4) connections.push(parsedConnection);
					else omittedConnections += 1;
				}
			}
			const top = record(root.$top);
			const hierarchy = toHierarchy(Object.hasOwn(top, "UINibTopLevelObjectsKey") ? top.UINibTopLevelObjectsKey : top.root);
			const classes = classTable();
			return {
				objects,
				connections,
				hierarchy: hierarchy.items,
				classes,
				objectCount,
				omittedObjects: Math.max(0, objectCount - 2e4),
				omittedConnections,
				unresolvedConnections,
				omittedHierarchyReferences: hierarchy.omittedReferences
			};
		};
		record = (value) => recordSchema.safeParse(value).data ?? {};
		firstString = (...values) => {
			for (const value of values) if (typeof value === "string" && value.length > 0) return value;
			return null;
		};
		archivedKindBases = [
			["view_controller", [
				"UIViewController",
				"NSViewController",
				"NSWindowController"
			]],
			["control", ["UIControl", "NSControl"]],
			["view", [
				"UIView",
				"NSView",
				"UIWindow",
				"NSWindow"
			]]
		];
		classifyObject = (className, classChain = []) => {
			if (isInterfaceBuilderConnectionClass(className ?? "") || classChain.includes("NSNibConnector")) return "other";
			for (const [kind, bases] of archivedKindBases) if (bases.some((base) => classChain.includes(base))) return kind;
			const value = className?.toLowerCase() ?? "";
			if (value.includes("constraint")) return "constraint";
			if (value.includes("layoutguide")) return "layout_guide";
			if (value.includes("placeholder") || value.includes("firstresponder") || value === "uiproxyobject") return "placeholder";
			if (value.includes("external")) return "external_object";
			if (value.includes("viewcontroller") || value.includes("windowcontroller")) return "view_controller";
			if (value.includes("button") || value.includes("control") || value.includes("textfield") || value.includes("slider") || value.includes("menuitem") || value.includes("colorwell")) return "control";
			if (value.includes("view") || value.includes("window") || value.includes("cell")) return "view";
			if (value.includes("image") || value.includes("color") || value.includes("font")) return "resource";
			return "other";
		};
		classifyConnection = (type) => {
			const value = type.toLowerCase();
			if (value.includes("outlet")) return "outlet";
			if (value.includes("action") || value.includes("eventconnection")) return "action";
			if (value.includes("segue")) return "segue";
			return "other";
		};
		jsonSafeRecord = (value) => Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
			try {
				const serialized = JSON.stringify(item);
				if (serialized === undefined) return [];
				const parsed = jsonValueSchema.safeParse(JSON.parse(serialized));
				return parsed.success ? [[key, parsed.data]] : [];
			} catch (cause) {
				void cause;
				return [];
			}
		}));
	})))();
}

//#endregion
//#region dist/domain/objcClassSymbol.js
var objcClassSymbol;
function init_objcClassSymbol() {
	return (init_objcClassSymbol = __esmMin((() => {
		objcClassSymbol = (name) => {
			const namespace = name.lastIndexOf("::");
			const leaf = namespace < 0 ? name : name.slice(namespace + 2);
			const match = /^_?(OBJC_(META)?CLASS_\$_([^\s]+))$/u.exec(leaf);
			if (match?.[1] === undefined || match[3] === undefined) return undefined;
			return {
				name: match[3],
				symbol: match[1],
				metaclass: match[2] !== undefined
			};
		};
	})))();
}

//#endregion
//#region dist/domain/swiftSymbolClassification.js
var LEGACY_CATEGORIES, NOMINAL_CATEGORIES, classifySwiftSymbol, SWIFT_MANGLING_PREFIXES, isSwiftMangledSymbolName, identifierEnd;
function init_swiftSymbolClassification() {
	return (init_swiftSymbolClassification = __esmMin((() => {
		LEGACY_CATEGORIES = [
			["_TtC", "classes"],
			["_TtV", "structs"],
			["_TtO", "enums"],
			["_TtP", "protocols"],
			["_TtE", "extensions"]
		];
		NOMINAL_CATEGORIES = new Map([
			["C", "classes"],
			["V", "structs"],
			["O", "enums"],
			["P", "protocols"]
		]);
		classifySwiftSymbol = (name) => {
			const prefix = /^_?(?:\$[sS]|_T0)/u.exec(name);
			if (prefix === null) {
				if (!name.startsWith("_Tt")) return undefined;
				return {
					category: LEGACY_CATEGORIES.find(([prefix]) => name.startsWith(prefix))?.[1] ?? null,
					protocolIdentity: name.startsWith("_TtP")
				};
			}
			const mangling = name.slice(prefix[0].length);
			let offset = identifierEnd(mangling, 0);
			if (offset === undefined) return {
				category: null,
				protocolIdentity: false
			};
			let category = null;
			let protocolIdentity = false;
			for (;;) {
				const end = identifierEnd(mangling, offset);
				if (end === undefined) {
					protocolIdentity = category === "protocols" && mangling.slice(offset) === "Mp";
					if (mangling.charAt(offset) === "0" || mangling.startsWith("AA", offset)) category = null;
					break;
				}
				const kind = mangling.charAt(end);
				const nominal = NOMINAL_CATEGORIES.get(kind);
				if (nominal === undefined) {
					if (mangling.slice(end) === "Mp") {
						category = "protocols";
						protocolIdentity = true;
					} else if (kind === "E" && category !== null) category = "extensions";
					break;
				}
				category = nominal;
				offset = end + 1;
			}
			return {
				category,
				protocolIdentity
			};
		};
		SWIFT_MANGLING_PREFIXES = [
			"_T0",
			"$S",
			"_$S",
			"$s",
			"_$s",
			"@__swiftmacro_",
			"$e",
			"_$e"
		];
		isSwiftMangledSymbolName = (name) => SWIFT_MANGLING_PREFIXES.some((prefix) => name.startsWith(prefix));
		identifierEnd = (mangling, offset) => {
			const lengthToken = /^[1-9][0-9]*/u.exec(mangling.slice(offset))?.[0];
			if (lengthToken === undefined) return undefined;
			const start = offset + lengthToken.length;
			const end = start + Number(lengthToken);
			if (!Number.isSafeInteger(end) || end > mangling.length || !/^[A-Za-z_][A-Za-z0-9_]*$/u.test(mangling.slice(start, end))) return undefined;
			return end;
		};
	})))();
}

//#endregion
//#region dist/domain/native/nativeAddress.js
var nativeAddressObservationSchema, nativeAddressSchema, nativeAddressCoordinateInputSchema, nativeAddressInputSchema;
function init_nativeAddress() {
	return (init_nativeAddress = __esmMin((() => {
		nativeAddressObservationSchema = z.string().regex(/^(?:(?:[A-Za-z0-9._~\x2d]|%[0-9A-F]{2})+:)?0x[0-9a-f]+$/u);
		nativeAddressSchema = z.string().regex(/^(?:(?:[A-Za-z0-9._~\x2d]|%[0-9A-F]{2})+:)?0x(?:0|[1-9a-f][0-9a-f]*)$/u);
		nativeAddressCoordinateInputSchema = z.string().regex(/^(?:(?:[A-Za-z0-9._~\x2d]|%[0-9a-fA-F]{2})+:)?0[xX][0-9a-fA-F]+$/u).transform((address) => {
			const separator = address.lastIndexOf(":") + 1;
			const space = separator === 0 ? null : address.slice(0, separator - 1).replace(/%[0-9a-fA-F]{2}/gu, (escape) => escape.toUpperCase());
			return {
				space,
				offset: BigInt(address.slice(separator))
			};
		});
		nativeAddressInputSchema = nativeAddressCoordinateInputSchema.transform(({ space, offset }) => `${space === null ? "" : `${space}:`}0x${offset.toString(16)}`);
	})))();
}

//#endregion
//#region dist/domain/native/objcSwiftMetadata.js
var isAppleDispatchMetadataTarget, objcMethodTypeSchema, objcPropertyAttributeSchema, objcMethodSchema, objcPropertySchema, objcProtocolSchema, objcClassSchema, nativeMetadataLocationSchema, nativeMetadataDecodeSchema, nativeMetadataEvidenceSchema, objcIvarSchema, objcProtocolRecordSchema, objcDispatchImplementationSchema, projectObjcClassMethods, objcCategorySchema, machoImportBindingSchema, swiftConformanceSchema, swiftDispatchSlotSchema, relativePointerSchema, swiftSymbolSchema, nativeMetadataCoverageSchema, objcClassImportIdentitySchema, objcClassImportBindingCoverageSchema, swiftDeclKindSchema, swiftDeclSchema, dbOperationSchema, dbSaveResultSchema, objcSwiftMetadataSchema, DEFAULT_DISPATCH_METADATA_INPUT_BYTES, MAXIMUM_DISPATCH_METADATA_INPUT_BYTES, MAX_DISPATCH_METADATA_RECORDS, DEFAULT_DISPATCH_METADATA_RECORDS, nativeDispatchMetadataInputSchema, dispatchMetadataInputAdmissionSchema, nativeDispatchMetadataResultSchema, inspectNativeDispatchMetadata, parseMetadataAddress;
function init_objcSwiftMetadata() {
	return (init_objcSwiftMetadata = __esmMin((() => {
		init_objcClassSymbol();
		init_binaryTargetTypes();
		init_evidence();
		init_swiftSymbolClassification();
		init_nativeCallReference();
		init_machoTargetSelection();
		init_nativeAddress();
		init_unicodeCodePointOrder();
		isAppleDispatchMetadataTarget = (target) => target.kind === "executable" && isMachOFormat(target.format);
		objcMethodTypeSchema = z.enum([
			"instance",
			"class",
			"ivar_getter",
			"ivar_setter"
		]);
		objcPropertyAttributeSchema = z.strictObject({
			name: z.string().min(1),
			value: z.string()
		});
		objcMethodSchema = z.strictObject({
			selector: z.string().min(1),
			method_type: objcMethodTypeSchema,
			address: z.int().nullable().describe("Unique unqualified implementation address; null if unknown, ambiguous, or not a safe integer."),
			is_required: z.boolean().nullable(),
			is_optional: z.boolean().nullable()
		});
		objcPropertySchema = z.strictObject({
			name: z.string().min(1),
			type_encoding: z.string().nullable(),
			attributes: z.array(objcPropertyAttributeSchema),
			atomicity: z.enum(["atomic", "nonatomic"]).nullable(),
			is_readonly: z.boolean().nullable(),
			getter: z.string().nullable(),
			setter: z.string().nullable()
		});
		objcProtocolSchema = z.strictObject({
			name: z.string().min(1),
			methods: z.array(objcMethodSchema).default([]),
			optional_methods: z.array(objcMethodSchema).default([]),
			properties: z.array(objcPropertySchema).default([])
		});
		objcClassSchema = z.strictObject({
			name: z.string().min(1),
			super_class: z.string().nullable(),
			is_meta_class: z.boolean().nullable(),
			is_root_class: z.boolean().nullable(),
			methods: z.array(objcMethodSchema).default([]),
			properties: z.array(objcPropertySchema).default([]),
			protocols: z.array(z.string()).default([]),
			ivar_count: z.int().nonnegative().nullable(),
			instance_size: z.int().nonnegative().nullable(),
			location: z.object({
				address: z.string().nullable(),
				file_offset: z.int().nonnegative().nullable()
			}).optional(),
			superclass_address: z.string().nullable().optional(),
			metaclass_address: z.string().nullable().optional(),
			decode: z.object({
				status: z.enum([
					"decoded",
					"partial",
					"unsupported",
					"invalid"
				]),
				reason: z.string().nullable()
			}).optional(),
			evidence: z.array(z.object({
				kind: z.literal("binary_metadata"),
				description: z.string(),
				location: z.object({
					address: z.string().nullable(),
					file_offset: z.int().nonnegative().nullable()
				}),
				artifact_path: z.string(),
				artifact_sha256: z.string()
			})).optional()
		});
		nativeMetadataLocationSchema = z.strictObject({
			address: z.string().nullable(),
			file_offset: z.int().nonnegative().nullable()
		});
		nativeMetadataDecodeSchema = z.strictObject({
			status: z.enum([
				"decoded",
				"partial",
				"unsupported",
				"invalid"
			]),
			reason: z.string().nullable()
		});
		nativeMetadataEvidenceSchema = z.strictObject({
			kind: z.enum([
				"binary_metadata",
				"interface_builder_resource",
				"symbol",
				"reference",
				"decompiler"
			]),
			description: z.string().min(1),
			provider: providerSchema.optional(),
			location: nativeMetadataLocationSchema,
			/** Preserve a provider's source value when it does not establish a location. */
			reported_address: z.string().optional(),
			call_reference: nativeCallReferenceSchema.exactOptional(),
			artifact_path: z.string().min(1).nullable().default(null),
			artifact_sha256: z.string().regex(/^[a-f0-9]{64}$/u).nullable().default(null)
		});
		objcIvarSchema = z.strictObject({
			class_name: z.string().min(1),
			name: z.string().min(1),
			type_encoding: z.string().nullable(),
			offset: z.int().nonnegative().nullable(),
			size: z.int().nonnegative().nullable().default(null),
			alignment: z.int().positive().nullable().default(null),
			location: nativeMetadataLocationSchema,
			decode: nativeMetadataDecodeSchema,
			evidence: z.array(nativeMetadataEvidenceSchema).min(1)
		});
		objcProtocolRecordSchema = z.strictObject({
			name: z.string(),
			adopted_protocols: z.array(z.string()),
			methods: z.array(objcMethodSchema),
			optional_methods: z.array(objcMethodSchema),
			location: nativeMetadataLocationSchema,
			decode: nativeMetadataDecodeSchema,
			evidence: z.array(nativeMetadataEvidenceSchema).min(1)
		});
		objcDispatchImplementationSchema = z.strictObject({
			class_name: z.string().min(1),
			selector: z.string().min(1),
			method_type: z.enum(["instance", "class"]),
			implementation_address: z.string().nullable(),
			/** Category that adds this method, when it is not defined by the class itself. */
			category: z.string().nullable().optional(),
			location: nativeMetadataLocationSchema,
			decode: nativeMetadataDecodeSchema,
			evidence: z.array(nativeMetadataEvidenceSchema).min(1)
		});
		projectObjcClassMethods = (implementations) => {
			const methods = new Map();
			for (const implementation of implementations) {
				const key = compositeKey([implementation.selector, implementation.method_type]);
				const address = parseMetadataAddress(implementation.implementation_address);
				const previous = methods.get(key);
				if (previous !== undefined) {
					if (previous.address !== address) previous.address = null;
					continue;
				}
				methods.set(key, {
					selector: implementation.selector,
					method_type: implementation.method_type,
					address,
					is_required: null,
					is_optional: null
				});
			}
			return [...methods.values()];
		};
		objcCategorySchema = z.strictObject({
			name: z.string().min(1),
			/** Extended class; external classes come from the category's bind symbol. */
			class_name: z.string().min(1).nullable(),
			class_source: z.enum([
				"local",
				"external",
				"unresolved"
			]),
			instance_methods: z.array(z.string()),
			class_methods: z.array(z.string()),
			protocols: z.array(z.string()),
			properties: z.array(objcPropertySchema),
			location: nativeMetadataLocationSchema,
			decode: nativeMetadataDecodeSchema,
			evidence: z.array(nativeMetadataEvidenceSchema).min(1)
		});
		machoImportBindingSchema = z.strictObject({
			requested_address: z.string().min(1),
			symbol: z.string().min(1),
			binding_source: z.enum([
				"chained",
				"bind",
				"weak",
				"lazy"
			]),
			library_ordinal: z.number().int().min(-3).max(Number.MAX_SAFE_INTEGER),
			library: z.string().nullable(),
			weak: z.boolean(),
			addend: z.string().regex(/^-?\d+$/u)
		});
		swiftConformanceSchema = z.strictObject({
			type_name: z.string().min(1).nullable(),
			/** Raw three-bit Swift ABI type-reference kind; absent in older Evidence. */
			type_reference_kind: z.number().int().min(0).max(7).optional(),
			/** Address of the descriptor, class-name string, or resolved ObjC class reference. */
			type_reference_target: nativeMetadataLocationSchema.optional(),
			type_binding: machoImportBindingSchema.nullable().optional(),
			protocol_name: z.string().min(1).nullable(),
			/** Resolved protocol descriptor address, retained when its bytes are unavailable. */
			protocol_target: nativeMetadataLocationSchema.optional(),
			protocol_binding: machoImportBindingSchema.nullable().optional(),
			module: z.string().nullable(),
			witness_table: nativeMetadataLocationSchema,
			location: nativeMetadataLocationSchema,
			decode: nativeMetadataDecodeSchema,
			evidence: z.array(nativeMetadataEvidenceSchema).min(1)
		});
		swiftDispatchSlotSchema = z.strictObject({
			owner: z.string().min(1),
			table_kind: z.enum(["witness_table", "class_vtable"]),
			slot_index: z.int().nonnegative(),
			requirement: z.string().nullable(),
			implementation: z.string().nullable(),
			implementation_address: z.string().nullable(),
			implementation_binding: machoImportBindingSchema.nullable().optional(),
			thunk_address: z.string().nullable(),
			location: nativeMetadataLocationSchema,
			decode: nativeMetadataDecodeSchema,
			evidence: z.array(nativeMetadataEvidenceSchema).min(1)
		});
		relativePointerSchema = z.strictObject({
			field: nativeMetadataLocationSchema,
			target: nativeMetadataLocationSchema,
			displacement: z.int(),
			indirectable: z.boolean(),
			indirect: z.boolean().nullable(),
			encoding_tag: z.number().int().nonnegative().optional(),
			binding: machoImportBindingSchema.optional(),
			decode: nativeMetadataDecodeSchema,
			evidence: z.array(nativeMetadataEvidenceSchema).min(1)
		});
		swiftSymbolSchema = z.strictObject({
			mangled_name: z.string().min(1),
			address: z.string().min(1).nullable(),
			decode: nativeMetadataDecodeSchema,
			evidence: z.array(nativeMetadataEvidenceSchema).min(1)
		});
		nativeMetadataCoverageSchema = z.strictObject({
			facet: z.string().min(1),
			status: z.enum([
				"complete",
				"partial",
				"unsupported",
				"not_requested"
			]),
			reason: z.string().nullable(),
			examined: z.int().nonnegative(),
			decoded: z.int().nonnegative()
		});
		objcClassImportIdentitySchema = machoImportBindingSchema.omit({ requested_address: true });
		objcClassImportBindingCoverageSchema = z.strictObject({
			facet: z.literal("objc_class_import_bindings"),
			status: z.enum([
				"complete",
				"partial",
				"unsupported",
				"not_requested"
			]),
			reason: z.string().nullable(),
			examined: z.number().int().nonnegative(),
			decoded: z.number().int().nonnegative()
		});
		swiftDeclKindSchema = z.enum([
			"class",
			"struct",
			"enum",
			"actor"
		]);
		swiftDeclSchema = z.strictObject({
			kind: swiftDeclKindSchema,
			name: z.string().min(1),
			qualified_name: z.string().min(1).nullable(),
			module: z.string().min(1).nullable(),
			generic: z.boolean(),
			/** A private or local declaration context was omitted from `qualified_name`. */
			anonymous_context: z.boolean(),
			accessor_address: z.string().min(1).nullable(),
			location: nativeMetadataLocationSchema,
			decode: nativeMetadataDecodeSchema,
			evidence: z.array(nativeMetadataEvidenceSchema).min(1)
		});
		dbOperationSchema = z.enum([
			"save",
			"readback",
			"open_database",
			"close_database",
			"export",
			"import"
		]);
		dbSaveResultSchema = z.strictObject({
			operation: dbOperationSchema,
			succeeded: z.boolean(),
			preserved_names: z.int().nonnegative().default(0),
			preserved_comments: z.int().nonnegative().default(0),
			preserved_bookmarks: z.int().nonnegative().default(0),
			database_path: z.string().nullable(),
			error: z.string().nullable()
		});
		objcSwiftMetadataSchema = z.strictObject({
			objc_classes: z.array(objcClassSchema).default([]),
			objc_protocols: z.array(objcProtocolSchema).default([]),
			objc_categories: z.array(objcCategorySchema).default([]),
			swift_decls: z.array(swiftDeclSchema).default([]),
			objc_ivars: z.array(objcIvarSchema).default([]),
			objc_protocol_records: z.array(objcProtocolRecordSchema).default([]),
			objc_dispatch_implementations: z.array(objcDispatchImplementationSchema).default([]),
			swift_conformances: z.array(swiftConformanceSchema).default([]),
			swift_dispatch_slots: z.array(swiftDispatchSlotSchema).default([]),
			swift_symbols: z.array(swiftSymbolSchema).default([]),
			objc_class_import_bindings: z.array(machoImportBindingSchema).optional(),
			objc_class_import_binding_coverage: objcClassImportBindingCoverageSchema.optional(),
			target_selection: machoTargetSelectionSchema.optional(),
			relative_pointers: z.array(relativePointerSchema).default([]),
			coverage: z.array(nativeMetadataCoverageSchema).default([]),
			db_save_result: dbSaveResultSchema.nullable()
		});
		DEFAULT_DISPATCH_METADATA_INPUT_BYTES = 64 * 1024 * 1024;
		MAXIMUM_DISPATCH_METADATA_INPUT_BYTES = 1024 * 1024 * 1024;
		MAX_DISPATCH_METADATA_RECORDS = 2e4;
		DEFAULT_DISPATCH_METADATA_RECORDS = 5e3;
		nativeDispatchMetadataInputSchema = z.strictObject({
			max_records: z.number().int().min(1).max(MAX_DISPATCH_METADATA_RECORDS).default(DEFAULT_DISPATCH_METADATA_RECORDS),
			objc_class_import_addresses: z.array(z.string()).max(MAX_DISPATCH_METADATA_RECORDS).describe("Optional exact pointer-slot addresses from the selected name inventory; used to report decoded Objective-C class import bindings.").optional(),
			objc_class_import_addresses_complete: z.boolean().describe("Whether the candidate addresses include every selected class-label row; false keeps binding coverage partial when the existing record budget truncates the scan.").optional(),
			max_input_bytes: z.number().int().min(1).max(MAXIMUM_DISPATCH_METADATA_INPUT_BYTES).optional().describe("Largest target file REA reads into memory for binary metadata, in bytes. Omitted: 67108864 (64 MiB). The whole file counts, including every slice of a universal Mach-O. At most 1073741824 (1 GiB).")
		});
		dispatchMetadataInputAdmissionSchema = z.strictObject({
			maximum_bytes: z.number().int().min(1).max(MAXIMUM_DISPATCH_METADATA_INPUT_BYTES),
			source: z.enum(["default", "caller"]),
			retained_bytes: z.number().int().nonnegative()
		});
		nativeDispatchMetadataResultSchema = z.strictObject({
			target_sha256: z.string().regex(/^[a-f0-9]{64}$/u).nullable(),
			target_architecture: z.enum(BINARY_ARCHITECTURES).nullable().optional(),
			provider: z.strictObject({
				id: z.string().min(1),
				name: z.string().min(1),
				version: z.string().nullable()
			}),
			analysis_profile_digest: z.string().min(1).nullable(),
			/** Present when REA read the target bytes itself; symbol-only inventories have none. */
			input_admission: dispatchMetadataInputAdmissionSchema.exactOptional(),
			result: objcSwiftMetadataSchema
		});
		inspectNativeDispatchMetadata = (names, maxRecords) => {
			const symbolEvidence = (entry, address) => [{
				kind: "symbol",
				description: `Provider symbol ${entry.name}`,
				location: {
					address,
					file_offset: null
				},
				...address === null ? { reported_address: entry.address } : {},
				artifact_path: null,
				artifact_sha256: null
			}];
			const classNames = new Set();
			const implementations = new Map();
			const swiftSymbols = [];
			const examinedNames = names.slice(0, maxRecords);
			for (const entry of examinedNames) {
				const parsedAddress = nativeAddressInputSchema.safeParse(entry.address);
				const address = parsedAddress.success ? parsedAddress.data : null;
				const sourceAddress = parsedAddress.success ? entry.address : null;
				const classSymbol = objcClassSymbol(entry.name);
				if (classSymbol !== undefined) classNames.add(classSymbol.name);
				const methodMatch = /^([+-])\[([^\s\]]+)\s+([^\]]+)\]$/u.exec(entry.name);
				if (methodMatch?.[1] !== undefined && methodMatch[2] && methodMatch[3]) {
					const methodType = methodMatch[1] === "+" ? "class" : "instance";
					const selector = methodMatch[3];
					const key = parsedAddress.success ? compositeKey([
						methodMatch[2],
						selector,
						methodType,
						parsedAddress.data
					]) : Symbol();
					const evidence = symbolEvidence(entry, sourceAddress);
					const previous = implementations.get(key);
					if (previous !== undefined) previous.evidence.push(...evidence);
					else implementations.set(key, {
						class_name: methodMatch[2],
						selector,
						method_type: methodType,
						implementation_address: address,
						location: {
							address,
							file_offset: null
						},
						decode: {
							status: "partial",
							reason: "symbol_name_only"
						},
						evidence
					});
					classNames.add(methodMatch[2]);
				}
				if (isSwiftMangledSymbolName(entry.name) || entry.name.startsWith("_Tt")) swiftSymbols.push({
					mangled_name: entry.name,
					address,
					decode: {
						status: "partial",
						reason: "mangled_symbol_not_demangled"
					},
					evidence: symbolEvidence(entry, sourceAddress)
				});
			}
			const implementationsByClass = new Map();
			for (const implementation of implementations.values()) {
				const candidates = implementationsByClass.get(implementation.class_name) ?? [];
				candidates.push(implementation);
				implementationsByClass.set(implementation.class_name, candidates);
			}
			const classes = [...classNames].sort().map((name) => ({
				name,
				super_class: null,
				is_meta_class: null,
				is_root_class: null,
				methods: projectObjcClassMethods(implementationsByClass.get(name) ?? []),
				properties: [],
				protocols: [],
				ivar_count: null,
				instance_size: null
			}));
			const decodedImplementations = [...implementations.values()].sort((left, right) => compareUnicodeCodePoints(compositeKey([
				left.class_name,
				left.selector,
				left.method_type,
				left.implementation_address ?? ""
			]), compositeKey([
				right.class_name,
				right.selector,
				right.method_type,
				right.implementation_address ?? ""
			])));
			const swift = swiftSymbols.length > 0;
			return objcSwiftMetadataSchema.parse({
				objc_classes: classes,
				objc_dispatch_implementations: decodedImplementations,
				swift_symbols: swiftSymbols,
				coverage: [
					{
						facet: "objc_class_symbols",
						status: "partial",
						reason: names.length > examinedNames.length ? "record_limit_reached_and_symbol_names_are_not_runtime_class_metadata" : "symbol_names_do_not_recover_all_runtime_class_metadata",
						examined: examinedNames.length,
						decoded: classes.length
					},
					{
						facet: "objc_dispatch_implementations",
						status: decodedImplementations.length > 0 ? "partial" : "unsupported",
						reason: names.length > examinedNames.length ? "record_limit_reached_and_only_symbolized_methods_are_resolved" : decodedImplementations.length > 0 ? "only_symbolized_methods_are_resolved" : "provider_name_inventory_has_no_supported_objc_method_symbols",
						examined: examinedNames.length,
						decoded: decodedImplementations.length
					},
					{
						facet: "objc_class_definitions",
						status: "unsupported",
						reason: "symbol_inventory_does_not_establish_class_definitions_import_origins_or_namespace_declarations",
						examined: examinedNames.length,
						decoded: 0
					},
					{
						facet: "objc_ivar_layouts",
						status: "unsupported",
						reason: "symbol_inventory_does_not_expose_runtime_ivar_layouts",
						examined: 0,
						decoded: 0
					},
					{
						facet: "swift_declarations",
						status: swift ? "partial" : "unsupported",
						reason: swift ? "symbols_are_not_demangled_declarations" : "no_swift_symbols_observed",
						examined: swiftSymbols.length,
						decoded: 0
					},
					{
						facet: "swift_dispatch_tables",
						status: "unsupported",
						reason: "provider_name_inventory_does_not_decode_witness_or_class_vtables",
						examined: 0,
						decoded: 0
					},
					{
						facet: "relative_pointers",
						status: "unsupported",
						reason: "provider_name_inventory_does_not_decode_binary_relative_pointers",
						examined: 0,
						decoded: 0
					}
				],
				db_save_result: null
			});
		};
		parseMetadataAddress = (address) => {
			const parsed = nativeAddressCoordinateInputSchema.safeParse(address);
			return parsed.success && parsed.data.space === null && parsed.data.offset <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(parsed.data.offset) : null;
		};
	})))();
}

//#endregion
//#region dist/domain/native/nativeInvestigationGraph.js
var nativeInvestigationNodeKindSchema, nativeInvestigationNodeSchema, nativeInvestigationRelationSchema, nativeInvestigationEdgeSchema, nativeInvestigationCoverageSchema, nativeInvestigationProviderSchema, nativeInvestigationGraphSchema, nativeInvestigationTraceLimitsSchema, nativeInvestigationTraceSchema, traceNativeInvestigationGraph, joinInterfaceBuilderDispatch;
function init_nativeInvestigationGraph() {
	return (init_nativeInvestigationGraph = __esmMin((() => {
		init_objcSwiftMetadata();
		init_jsonValue();
		nativeInvestigationNodeKindSchema = z.enum([
			"storyboard",
			"scene",
			"view_controller",
			"view",
			"control",
			"constraint",
			"layout_guide",
			"resource",
			"placeholder",
			"external_object",
			"outlet",
			"action",
			"segue",
			"objc_class",
			"objc_selector",
			"swift_declaration",
			"swift_requirement",
			"dispatch_table",
			"dispatch_slot",
			"thunk",
			"function",
			"state_value",
			"global_value",
			"field",
			"branch_condition",
			"sink",
			"unknown"
		]);
		nativeInvestigationNodeSchema = z.strictObject({
			id: z.string().min(1),
			kind: nativeInvestigationNodeKindSchema,
			name: z.string().min(1),
			location: nativeMetadataLocationSchema.nullable(),
			attributes: z.record(z.string(), jsonValueSchema),
			evidence: z.array(nativeMetadataEvidenceSchema)
		});
		nativeInvestigationRelationSchema = z.enum([
			"contains",
			"outlet_to",
			"target_action",
			"segue_to",
			"objc_dispatch",
			"swift_witness_dispatch",
			"swift_vtable_dispatch",
			"thunk_to",
			"direct_call",
			"indirect_call",
			"provider_call",
			"reads",
			"writes",
			"flows_to",
			"controls"
		]);
		nativeInvestigationEdgeSchema = z.discriminatedUnion("resolution", [z.strictObject({
			id: z.string().min(1),
			from: z.string().min(1),
			to: z.string().min(1),
			relation: nativeInvestigationRelationSchema,
			resolution: z.enum([
				"observed",
				"inferred",
				"resolved",
				"ambiguous"
			]),
			evidence: z.array(nativeMetadataEvidenceSchema).min(1),
			limitations: z.array(z.string())
		}), z.strictObject({
			id: z.string().min(1),
			from: z.string().min(1),
			to: z.null(),
			relation: nativeInvestigationRelationSchema,
			resolution: z.literal("unresolved"),
			reason: z.string().min(1),
			evidence: z.array(nativeMetadataEvidenceSchema),
			limitations: z.array(z.string())
		})]);
		nativeInvestigationCoverageSchema = z.strictObject({
			facet: z.string().min(1),
			status: z.enum([
				"complete",
				"partial",
				"unsupported",
				"not_requested"
			]),
			reason: z.string().nullable(),
			examined: z.int().nonnegative(),
			omitted: z.int().nonnegative()
		});
		nativeInvestigationProviderSchema = z.strictObject({
			id: z.string().min(1),
			version: z.string().nullable(),
			tool_version: z.string().min(1)
		});
		nativeInvestigationGraphSchema = z.strictObject({
			target_sha256: z.string().regex(/^[a-f0-9]{64}$/u).nullable(),
			provider: nativeInvestigationProviderSchema,
			nodes: z.array(nativeInvestigationNodeSchema),
			edges: z.array(nativeInvestigationEdgeSchema),
			coverage: z.array(nativeInvestigationCoverageSchema),
			truncated: z.boolean()
		});
		nativeInvestigationTraceLimitsSchema = z.strictObject({
			max_depth: z.int().min(0).max(32).default(8),
			max_nodes: z.int().min(1).max(2e3).default(250),
			max_edges: z.int().min(1).max(5e3).default(500)
		});
		nativeInvestigationTraceSchema = z.strictObject({
			target_sha256: z.string().regex(/^[a-f0-9]{64}$/u).nullable(),
			provider: nativeInvestigationProviderSchema,
			start: z.string().min(1),
			direction: z.enum(["forward", "backward"]),
			nodes: z.array(nativeInvestigationNodeSchema),
			edges: z.array(nativeInvestigationEdgeSchema),
			unresolved: z.array(nativeInvestigationEdgeSchema),
			reached_depth: z.int().nonnegative(),
			truncated: z.boolean(),
			reason: z.string().nullable(),
			coverage: z.array(nativeInvestigationCoverageSchema),
			limitations: z.array(z.string().min(1))
		});
		traceNativeInvestigationGraph = (graph, input) => {
			const start = graph.nodes.find(({ id }) => id === input.start);
			if (start === undefined) return {
				target_sha256: graph.target_sha256,
				provider: graph.provider,
				start: input.start,
				direction: input.direction ?? "forward",
				nodes: [],
				edges: [],
				unresolved: [],
				reached_depth: 0,
				truncated: false,
				reason: "start_node_missing",
				coverage: graph.coverage,
				limitations: ["The requested start node is absent from the supplied graph."]
			};
			const limits = nativeInvestigationTraceLimitsSchema.parse(input.limits ?? {});
			const direction = input.direction ?? "forward";
			const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
			const visited = new Set([start.id]);
			const selectedEdges = new Map();
			const unresolved = new Map();
			const queue = [{
				id: start.id,
				depth: 0
			}];
			let reachedDepth = 0;
			let truncated = false;
			let reason = null;
			const adjacency = new Map();
			for (const edge of graph.edges) {
				const nodeId = direction === "forward" ? edge.from : edge.to;
				if (nodeId === null) continue;
				const entries = adjacency.get(nodeId);
				if (entries === undefined) adjacency.set(nodeId, [edge]);
				else entries.push(edge);
			}
			while (queue.length > 0) {
				const current = queue.shift();
				if (current === undefined) break;
				const adjacent = adjacency.get(current.id) ?? [];
				for (const edge of adjacent) {
					if (selectedEdges.size + unresolved.size >= limits.max_edges) {
						truncated = true;
						reason = "max_edges_reached";
						break;
					}
					if (edge.resolution === "unresolved") {
						unresolved.set(edge.id, edge);
						continue;
					}
					const nextId = direction === "forward" ? edge.to : edge.from;
					const alreadyVisited = visited.has(nextId);
					if (!alreadyVisited && current.depth >= limits.max_depth) {
						truncated = true;
						reason ??= "max_depth_reached";
						continue;
					}
					if (!alreadyVisited && visited.size >= limits.max_nodes) {
						truncated = true;
						reason = "max_nodes_reached";
						break;
					}
					selectedEdges.set(edge.id, edge);
					if (alreadyVisited) continue;
					if (!nodeById.has(nextId)) {
						truncated = true;
						reason ??= "edge_target_missing_from_graph";
						continue;
					}
					visited.add(nextId);
					reachedDepth = Math.max(reachedDepth, current.depth + 1);
					queue.push({
						id: nextId,
						depth: current.depth + 1
					});
				}
				if (reason === "max_edges_reached" || reason === "max_nodes_reached") break;
			}
			return {
				target_sha256: graph.target_sha256,
				provider: graph.provider,
				start: start.id,
				direction,
				nodes: [...visited].flatMap((id) => {
					const node = nodeById.get(id);
					return node === undefined ? [] : [node];
				}),
				edges: [...selectedEdges.values()],
				unresolved: [...unresolved.values()],
				reached_depth: reachedDepth,
				truncated,
				reason,
				coverage: graph.coverage,
				limitations: ["Static analysis does not prove that an authored UI action is reachable or executed at runtime.", "Provider call graphs may omit unresolved indirect dispatch."]
			};
		};
		joinInterfaceBuilderDispatch = (graph, metadata) => {
			const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
			const edges = [...graph.edges];
			const existingEdgeIds = new Set(edges.map(({ id }) => id));
			const selectorNodesByAction = new Map();
			for (const edge of edges) {
				if (edge.resolution === "observed" && edge.relation === "target_action" && nodes.get(edge.to)?.kind === "objc_selector") selectorNodesByAction.set(edge.from, edge.to);
			}
			let examined = 0;
			let resolved = 0;
			let inferredWithoutOwnerClass = 0;
			for (const action of nodes.values()) {
				if (action.kind !== "action") continue;
				const selector = action.attributes.selector;
				if (typeof selector !== "string" || selector.length === 0) continue;
				const selectorNodeId = selectorNodesByAction.get(action.id);
				if (selectorNodeId === undefined) continue;
				examined += 1;
				const destinationEdge = edges.find((edge) => edge.resolution === "observed" && edge.relation === "target_action" && edge.from === action.id && edge.to !== selectorNodeId && nodes.has(edge.to));
				if (destinationEdge === undefined || destinationEdge.resolution !== "observed") {
					const edgeId = `dispatch:${selectorNodeId}:${action.id}:receiver`;
					if (!existingEdgeIds.has(edgeId)) {
						existingEdgeIds.add(edgeId);
						edges.push({
							id: edgeId,
							from: selectorNodeId,
							to: null,
							relation: "objc_dispatch",
							resolution: "unresolved",
							reason: "authored_action_receiver_unresolved",
							evidence: action.evidence,
							limitations: ["The authored action has no resolved receiver; a selector match alone cannot establish its implementation."]
						});
					}
					continue;
				}
				const owner = nodes.get(destinationEdge.to);
				const declaredClass = owner?.attributes.class_name;
				const className = typeof declaredClass === "string" && declaredClass.length > 0 && owner?.kind !== "placeholder" && owner?.kind !== "external_object" ? declaredClass : null;
				const candidates = metadata.objc_dispatch_implementations.filter((candidate) => candidate.method_type === "instance" && candidate.selector === selector && (className === null || candidate.class_name.replace(/\([^)]*\)$/u, "") === className));
				const implementation = candidates.length === 1 ? candidates[0] : undefined;
				const edgeId = `dispatch:${selectorNodeId}:${className ?? owner?.id ?? "unknown"}:${selector}`;
				if (existingEdgeIds.has(edgeId)) continue;
				existingEdgeIds.add(edgeId);
				if (implementation === undefined || implementation.implementation_address === null) {
					edges.push({
						id: edgeId,
						from: selectorNodeId,
						to: null,
						relation: "objc_dispatch",
						resolution: "unresolved",
						reason: candidates.length > 1 ? "selector_has_multiple_candidate_implementations" : "implementation_not_resolved_from_binary_metadata_or_provider_symbols",
						evidence: [...action.evidence, ...candidates.flatMap(({ evidence }) => evidence)],
						limitations: ["A missing or ambiguous symbol match does not prove that the runtime implementation is absent."]
					});
					continue;
				}
				const functionId = `native:function:${implementation.implementation_address}`;
				if (!nodes.has(functionId)) nodes.set(functionId, {
					id: functionId,
					kind: "function",
					name: `${implementation.class_name} ${selector}`,
					location: {
						address: implementation.implementation_address,
						file_offset: implementation.location.file_offset
					},
					attributes: {
						class_name: implementation.class_name,
						selector,
						method_type: implementation.method_type
					},
					evidence: implementation.evidence
				});
				edges.push({
					id: edgeId,
					from: selectorNodeId,
					to: functionId,
					relation: "objc_dispatch",
					resolution: className !== null && implementation.decode.status === "decoded" ? "resolved" : "inferred",
					evidence: [...action.evidence, ...implementation.evidence],
					limitations: className === null ? ["The selector uniquely matches a encoded or symbolized method, but the Interface Builder receiver is an unresolved placeholder; runtime dispatch was not observed."] : ["The Interface Builder target and encoded or symbolized method agree on class and selector; runtime dispatch and dynamically supplied targets were not observed."]
				});
				resolved += 1;
				if (className === null) inferredWithoutOwnerClass += 1;
			}
			return nativeInvestigationGraphSchema.parse({
				...graph,
				provider: {
					id: "rea-native-investigation",
					version: null,
					tool_version: "rea-native-investigation/1"
				},
				nodes: [...nodes.values()],
				edges,
				coverage: [...graph.coverage, {
					facet: "ui_to_objc_dispatch",
					status: examined === resolved && inferredWithoutOwnerClass === 0 ? "complete" : "partial",
					reason: examined === resolved && inferredWithoutOwnerClass === 0 ? null : inferredWithoutOwnerClass > 0 ? "some_action_receivers_remain_placeholders" : "some_action_implementations_not_resolved",
					examined,
					omitted: examined - resolved + inferredWithoutOwnerClass
				}]
			});
		};
	})))();
}

//#endregion
//#region dist/domain/apple/interfaceBuilderGraph.js
var interfaceBuilderDocumentSchema, interfaceBuilderAnalysisSchema, buildInterfaceBuilderAnalysis, interfaceBuilderLimitsSchema;
function init_interfaceBuilderGraph() {
	return (init_interfaceBuilderGraph = __esmMin((() => {
		init_bundleResourceRoot();
		init_plistNumbers();
		init_interfaceBuilderKeyedArchive();
		init_nativeInvestigationGraph();
		interfaceBuilderDocumentSchema = z.strictObject({
			relative_path: z.string().min(1),
			archive_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
			document_kind: z.enum(["nib", "storyboard_scene"]),
			object_count: z.int().nonnegative(),
			connection_count: z.int().nonnegative(),
			hierarchy_complete: z.boolean()
		});
		interfaceBuilderAnalysisSchema = bundleResourceBoundResultSchema(z.string().regex(/^[a-f0-9]{64}$/u), {
			documents: z.array(interfaceBuilderDocumentSchema).max(64),
			graph: nativeInvestigationGraphSchema,
			limitations: z.array(z.string())
		});
		buildInterfaceBuilderAnalysis = (input) => {
			const nodes = new Map();
			const edges = [];
			const coverage = [];
			const summaries = [];
			const numberLimitations = [];
			let truncated = false;
			let omittedObjects = 0;
			let omittedConnections = 0;
			let omittedGraphNodes = 0;
			let omittedHierarchyReferences = 0;
			for (const document of input.documents.slice(0, input.limits.max_documents)) {
				const parsed = parseInterfaceBuilderRecords(document.raw);
				const numbers = document.numberLiterals === undefined ? undefined : createPlistNumberProjection(document.numberLiterals);
				const prefix = `ib:${JSON.stringify(document.relativePath)}:`;
				const graphId = (kind, parts = []) => `${prefix}${kind}:${JSON.stringify(parts)}`;
				const rootId = `${prefix}root`;
				const objectIds = new Set(parsed.objects.map(({ id }) => id));
				const evidenceFor = (description) => [{
					kind: "interface_builder_resource",
					description,
					location: {
						address: null,
						file_offset: null
					},
					artifact_path: document.relativePath,
					artifact_sha256: document.archiveSha256
				}];
				const addNode = (node) => {
					if (nodes.has(node.id)) return true;
					if (nodes.size >= input.limits.max_objects) {
						truncated = true;
						omittedGraphNodes += 1;
						return false;
					}
					nodes.set(node.id, numbers === undefined ? node : {
						...node,
						attributes: Object.fromEntries(Object.entries(node.attributes).map(([key, value]) => [key, numbers.project(value)]))
					});
					return true;
				};
				const rootNode = {
					id: rootId,
					kind: document.documentKind === "nib" ? "scene" : "storyboard",
					name: document.relativePath,
					location: null,
					attributes: { document_kind: document.documentKind },
					evidence: evidenceFor("compiled document")
				};
				addNode(rootNode);
				let documentObjectCount = 0;
				for (const object of parsed.objects.slice(0, input.limits.max_objects)) {
					const id = graphId("object", [object.id]);
					const kind = object.kind === "other" ? "unknown" : object.kind;
					if (!addNode({
						id,
						kind,
						name: object.name,
						location: null,
						attributes: {
							...object.attributes,
							interface_builder_object_id: object.id,
							class_name: object.class_name
						},
						evidence: evidenceFor(`object ${object.id}`)
					})) {
						break;
					}
					documentObjectCount += 1;
				}
				let connectionEdgeCount = 0;
				let hierarchyEdgeCount = 0;
				let documentOmittedConnections = 0;
				let connectionObjectLimit = false;
				let documentOmittedHierarchyEdges = 0;
				let hierarchyTruncated = false;
				const objectNodeId = (objectId) => graphId("object", [objectId]);
				const addEdge = (edge, isHierarchy) => {
					if (isHierarchy ? hierarchyEdgeCount >= input.limits.max_objects : connectionEdgeCount >= input.limits.max_connections * 3) {
						truncated = true;
						if (isHierarchy) {
							hierarchyTruncated = true;
							documentOmittedHierarchyEdges += 1;
						} else {
							omittedConnections += 1;
							documentOmittedConnections += 1;
						}
						return;
					}
					edges.push(edge);
					if (isHierarchy) hierarchyEdgeCount += 1;
					else connectionEdgeCount += 1;
				};
				const connect = (category, id, from, to, relation, description, reason) => {
					const isHierarchy = category === "hierarchy";
					if (!nodes.has(from)) {
						truncated = true;
						if (isHierarchy) {
							hierarchyTruncated = true;
							documentOmittedHierarchyEdges += 1;
						} else {
							omittedConnections += 1;
							documentOmittedConnections += 1;
							connectionObjectLimit = true;
						}
						return;
					}
					const evidence = evidenceFor(description);
					const unresolvedEndpoint = to !== null && !nodes.has(to);
					if (unresolvedEndpoint) {
						truncated = true;
						if (isHierarchy) hierarchyTruncated = true;
						else connectionObjectLimit = true;
					}
					const edgeTo = unresolvedEndpoint ? null : to;
					const edgeReason = unresolvedEndpoint ? "endpoint_omitted_by_object_limit" : reason ?? "destination_unresolved";
					addEdge(edgeTo === null ? {
						id,
						from,
						to: null,
						relation,
						resolution: "unresolved",
						reason: edgeReason,
						evidence,
						limitations: []
					} : {
						id,
						from,
						to: edgeTo,
						relation,
						resolution: "observed",
						evidence,
						limitations: []
					}, isHierarchy);
				};
				let hierarchyCount = 0;
				let documentOmittedHierarchyNodes = 0;
				const visitHierarchy = (initial, initialParentId) => {
					const pending = [{
						value: initial,
						parentId: initialParentId
					}];
					while (pending.length > 0) {
						const entry = pending.pop();
						if (entry === undefined) break;
						const { value, parentId } = entry;
						if (Array.isArray(value)) {
							for (let index = value.length - 1; index >= 0; index -= 1) {
								const child = value[index];
								if (child !== undefined) pending.push({
									value: child,
									parentId
								});
							}
							continue;
						}
						if (typeof value !== "object" || value === null) continue;
						const item = record(value);
						const objectId = firstString(item.objectID, item["object-id"], item.id, typeof item.archiveUID === "number" ? String(item.archiveUID) : null);
						let nextParent = parentId;
						if (objectId !== null && hierarchyCount >= input.limits.max_objects) {
							truncated = true;
							hierarchyTruncated = true;
							documentOmittedHierarchyNodes += 1;
						} else if (objectId !== null) {
							const known = objectIds.has(objectId);
							const childId = known ? objectNodeId(objectId) : graphId("unknown", [objectId]);
							if (!known && !addNode({
								id: childId,
								kind: "unknown",
								name: firstString(item.label, item.name) ?? objectId,
								location: null,
								attributes: { interface_builder_object_id: objectId },
								evidence: evidenceFor(`hierarchy item ${objectId}`)
							})) hierarchyTruncated = true;
							connect("hierarchy", graphId("hierarchy", [parentId, childId]), parentId, childId, "contains", `hierarchy ${objectId}`);
							nextParent = childId;
							hierarchyCount += 1;
						}
						pending.push({
							value: item.children,
							parentId: nextParent
						});
					}
				};
				for (const hierarchy of parsed.hierarchy) visitHierarchy(hierarchy, rootId);
				for (const [index, item] of parsed.connections.slice(0, input.limits.max_connections).entries()) {
					const sourceId = objectNodeId(item.source_id);
					if (!nodes.has(sourceId)) addNode({
						id: sourceId,
						kind: "unknown",
						name: item.source_id,
						location: null,
						attributes: { interface_builder_object_id: item.source_id },
						evidence: evidenceFor(`connection source ${item.source_id}`)
					});
					const destinationId = item.destination_id === null ? null : objectNodeId(item.destination_id);
					if (item.kind === "action") {
						const actionId = graphId("action", [item.id]);
						const selectorId = item.label === null ? null : graphId("selector", [item.destination_id, item.label]);
						addNode({
							id: actionId,
							kind: "action",
							name: item.label ?? "unlabeled action",
							location: null,
							attributes: {
								selector: item.label,
								destination_id: item.destination_id,
								...item.attributes
							},
							evidence: evidenceFor(`action ${item.id}`)
						});
						connect("connection", graphId("action-edge", [item.id, "source"]), sourceId, actionId, "target_action", `action source ${item.source_id}`);
						if (selectorId !== null) {
							addNode({
								id: selectorId,
								kind: "objc_selector",
								name: item.label ?? "unknown selector",
								location: null,
								attributes: { destination_id: item.destination_id },
								evidence: evidenceFor(`selector ${item.label}`)
							});
							connect("connection", graphId("action-edge", [item.id, "selector"]), actionId, selectorId, "target_action", `selector ${item.label}`);
						}
						if (destinationId === null || !nodes.has(destinationId)) connect("connection", graphId("action-edge", [item.id, "destination"]), actionId, null, "target_action", `action destination ${item.destination_id ?? "missing"}`, "destination_object_missing_or_external");
						else connect("connection", graphId("action-edge", [item.id, "destination"]), actionId, destinationId, "target_action", `action destination ${item.destination_id}`);
					} else if (item.kind === "outlet") {
						const outletId = graphId("outlet", [item.id]);
						addNode({
							id: outletId,
							kind: "outlet",
							name: item.label ?? item.id,
							location: null,
							attributes: item.attributes,
							evidence: evidenceFor(`outlet ${item.id}`)
						});
						connect("connection", graphId("outlet-edge", [item.id, "source"]), sourceId, outletId, "contains", `outlet source ${item.source_id}`);
						if (destinationId === null || !nodes.has(destinationId)) connect("connection", graphId("outlet-edge", [item.id, "destination"]), outletId, null, "outlet_to", `outlet ${item.label ?? item.id}`, "destination_object_missing_or_external");
						else connect("connection", graphId("outlet-edge", [item.id, "destination"]), outletId, destinationId, "outlet_to", `outlet ${item.label ?? item.id}`);
					} else if (item.kind === "segue") {
						if (destinationId === null || !nodes.has(destinationId)) connect("connection", graphId("segue", [index]), sourceId, null, "segue_to", `segue ${item.label ?? item.id}`, "destination_scene_missing");
						else connect("connection", graphId("segue", [index]), sourceId, destinationId, "segue_to", `segue ${item.label ?? item.id}`);
					} else {
						connect("connection", graphId("unknown-connection", [index]), sourceId, null, "contains", `connection type ${item.kind}`, "unsupported_connection_type");
					}
				}
				const objectsTruncated = parsed.omittedObjects > 0 || parsed.objects.length > documentObjectCount;
				const parserOmittedHierarchyReferences = parsed.omittedHierarchyReferences;
				const omittedSerializedHierarchyReferences = document.omittedSerializedHierarchyReferences ?? 0;
				omittedHierarchyReferences += parserOmittedHierarchyReferences + omittedSerializedHierarchyReferences;
				const parserOmittedConnections = parsed.omittedConnections;
				const connectionsTruncated = parserOmittedConnections > 0 || parsed.connections.length > input.limits.max_connections;
				const connectionsUnresolved = parsed.unresolvedConnections > 0;
				const unsupportedConnections = parsed.connections.some(({ kind }) => kind === "other");
				omittedObjects += parsed.omittedObjects + Math.max(0, parsed.objects.length - documentObjectCount);
				omittedConnections += Math.max(0, parsed.connections.length - input.limits.max_connections) + parserOmittedConnections + parsed.unresolvedConnections;
				const hierarchyStatus = parserOmittedHierarchyReferences > 0 || omittedSerializedHierarchyReferences > 0 ? "partial" : parsed.hierarchy.length === 0 ? "unsupported" : hierarchyTruncated ? "partial" : "complete";
				numberLimitations.push(...(numbers?.limitations() ?? []).map((note) => `${document.relativePath}: ${note}`));
				summaries.push({
					relative_path: document.relativePath,
					archive_sha256: document.archiveSha256,
					document_kind: document.documentKind,
					object_count: parsed.objectCount,
					connection_count: parsed.connections.length + parserOmittedConnections + parsed.unresolvedConnections,
					hierarchy_complete: hierarchyStatus === "complete"
				});
				coverage.push({
					facet: `objects:${document.relativePath}`,
					status: objectsTruncated ? "partial" : "complete",
					reason: objectsTruncated ? "object_limit_reached" : null,
					examined: documentObjectCount,
					omitted: parsed.omittedObjects + Math.max(0, parsed.objects.length - documentObjectCount)
				}, {
					facet: `connections:${document.relativePath}`,
					status: connectionsTruncated || documentOmittedConnections > 0 || connectionObjectLimit || connectionsUnresolved || unsupportedConnections ? "partial" : "complete",
					reason: connectionObjectLimit ? "object_limit_reached" : connectionsTruncated || documentOmittedConnections > 0 ? "connection_limit_reached" : connectionsUnresolved ? "connection_unresolved" : unsupportedConnections ? "unsupported_connection_type" : null,
					examined: Math.min(parsed.connections.length, input.limits.max_connections),
					omitted: Math.max(0, parsed.connections.length - input.limits.max_connections) + documentOmittedConnections + parserOmittedConnections + parsed.unresolvedConnections
				}, {
					facet: `hierarchy:${document.relativePath}`,
					status: hierarchyStatus,
					reason: parserOmittedHierarchyReferences > 0 ? "archive_hierarchy_references_missing" : omittedSerializedHierarchyReferences > 0 ? "serialized_view_hierarchy_incomplete" : parsed.hierarchy.length === 0 ? "archive_hierarchy_not_decoded" : hierarchyTruncated ? "graph_limit_reached" : null,
					examined: hierarchyCount,
					omitted: documentOmittedHierarchyNodes + documentOmittedHierarchyEdges + parserOmittedHierarchyReferences + omittedSerializedHierarchyReferences
				}, {
					facet: `classes:${document.relativePath}`,
					status: Object.keys(parsed.classes).length > 0 ? "complete" : "unsupported",
					reason: Object.keys(parsed.classes).length > 0 ? null : "archive_class_table_not_decoded",
					examined: Object.keys(parsed.classes).length,
					omitted: 0
				});
			}
			if (input.documents.length > input.limits.max_documents) {
				truncated = true;
				coverage.push({
					facet: "documents",
					status: "partial",
					reason: "document_limit_reached",
					examined: input.limits.max_documents,
					omitted: input.documents.length - input.limits.max_documents
				});
			}
			if (omittedGraphNodes > 0) coverage.push({
				facet: "graph_nodes",
				status: "partial",
				reason: "max_objects_reached",
				examined: nodes.size,
				omitted: omittedGraphNodes
			});
			return interfaceBuilderAnalysisSchema.parse({
				target_sha256: input.targetSha256,
				...input.resourceRoot === undefined ? {} : { resource_root: input.resourceRoot },
				documents: summaries,
				graph: {
					target_sha256: input.targetSha256,
					provider: {
						id: "rea-artifact-graph",
						version: "1",
						tool_version: input.toolVersion
					},
					nodes: [...nodes.values()],
					edges,
					coverage,
					truncated: truncated || omittedObjects > 0 || omittedConnections > 0 || omittedHierarchyReferences > 0
				},
				limitations: [
					...numberLimitations,
					"The graph reflects recognized Interface Builder archive fields and connections; omitted private or unrecognized archive fields remain unknown.",
					"A target-action selector is an Interface Builder observation and does not prove that the binary contains a matching implementation.",
					"Decoded constraints, runtime visibility, dynamic UI creation, and pixel geometry are not inferred from these archives."
				]
			});
		};
		interfaceBuilderLimitsSchema = z.strictObject({
			max_documents: z.int().min(1).max(64).default(64),
			max_objects: z.int().min(1).max(2e4).default(2e4),
			max_connections: z.int().min(1).max(4e4).default(4e4),
			trace: nativeInvestigationTraceLimitsSchema.default({
				max_depth: 8,
				max_nodes: 250,
				max_edges: 500
			})
		});
	})))();
}

//#endregion
export { DEFAULT_DISPATCH_METADATA_INPUT_BYTES, MACHO_CPU_TYPES, MAXIMUM_DISPATCH_METADATA_INPUT_BYTES, MAX_DISPATCH_METADATA_RECORDS, NATIVE_INVENTORY_OPERATIONS, addressedValueSchema, buildInterfaceBuilderAnalysis, bundleResourceBoundResultSchema, bundleResourceRootSchema, classifySwiftSymbol, copyPlistUidIdentity, createPlistNumberCollector, createPlistNumberProjection, incompletePlistNumberLimitation, init_bundleResourceRoot, init_interfaceBuilderGraph, init_interfaceBuilderKeyedArchive, init_machoTargetSelection, init_nativeAddress, init_nativeInventory, init_nativeInvestigationGraph, init_objcClassSymbol, init_objcSwiftMetadata, init_plistNumbers, init_plistUid, init_swiftSymbolClassification, inspectNativeDispatchMetadata, interfaceBuilderAnalysisSchema, interfaceBuilderConnectionFieldNames, interfaceBuilderDocumentSchema, interfaceBuilderLimitsSchema, interfaceBuilderRuntimeClassName, isAppleDispatchMetadataTarget, isInterfaceBuilderConnectionClass, isNativeInventoryOperation, isSourceLessAppKitAnnotationConnector, isSwiftMangledSymbolName, isUIKitRuntimeConnectionClass, joinInterfaceBuilderDispatch, machoSelectionContainsRange, machoSliceArchitectureSchema, machoTargetSelectionMatchesArchitecture, machoTargetSelectionMatchesFormat, machoTargetSelectionSchema, markPlistDictionary, metadataReportSubjectFormat, nativeAddressCoordinateInputSchema, nativeAddressInputSchema, nativeAddressObservationSchema, nativeAddressSchema, nativeDispatchMetadataInputSchema, nativeDispatchMetadataResultSchema, nativeInventoryOperationSchema, nativeInventoryRowsSchemas, nativeInvestigationCoverageSchema, nativeInvestigationEdgeSchema, nativeInvestigationGraphSchema, nativeInvestigationNodeSchema, nativeInvestigationProviderSchema, nativeInvestigationTraceSchema, objcClassImportIdentitySchema, objcClassSymbol, objcSwiftMetadataSchema, plistUidValue, profileMachoTargetSelection, projectObjcClassMethods, requireInterfaceBuilderArchive, sameMachoTargetSelection, selectedSliceAgreesWithReport, traceNativeInvestigationGraph };