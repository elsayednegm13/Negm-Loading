import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { i as init_configurationErrors, n as ConfigurationError } from "./configurationErrors-B8zPbKDE.js";
import { n as init_result, r as ok, t as err } from "./result-Dbqc_peo.js";
import { n as init_canonicalDigest, t as digestCanonicalValue } from "./canonicalDigest-BTvxtxxs.js";
import { a as evidenceSchema, c as init_evidence } from "./evidence-CctoaA7x.js";
import { resolve } from "node:path";
import { z } from "zod";
import { isDeepStrictEqual } from "node:util";

//#region dist/process/CurrentEntrypointPath.js
var normalizeEntrypointPath, CURRENT_ENTRYPOINT_PATH;
function init_CurrentEntrypointPath() {
	return (init_CurrentEntrypointPath = __esmMin((() => {
		normalizeEntrypointPath = (entrypoint) => entrypoint === undefined || entrypoint.length === 0 ? undefined : resolve(entrypoint);
		CURRENT_ENTRYPOINT_PATH = normalizeEntrypointPath(process.argv[1]);
	})))();
}

//#endregion
//#region dist/config/mcpInputSchemaProfile.js
var COMPACT_INPUT_SCHEMA_BUDGET_BYTES, mcpInputSchemaProfileSchema, resolveMcpInputSchemaProfile, compactPresentationForMcpInputSchemaProfile, profileConstraint, parseMcpInputSchemaProfile;
function init_mcpInputSchemaProfile() {
	return (init_mcpInputSchemaProfile = __esmMin((() => {
		init_configurationErrors();
		init_result();
		COMPACT_INPUT_SCHEMA_BUDGET_BYTES = 13 * 1024;
		mcpInputSchemaProfileSchema = z.enum(["full", "compact"]);
		resolveMcpInputSchemaProfile = (profile) => profile ?? "compact";
		compactPresentationForMcpInputSchemaProfile = (profile) => resolveMcpInputSchemaProfile(profile) === "full" ? undefined : { budgetBytes: COMPACT_INPUT_SCHEMA_BUDGET_BYTES };
		profileConstraint = "REA_MCP_INPUT_SCHEMA_PROFILE must be \"compact\" (default) or \"full\". The compact profile advertises bounded input schemas with fewer nested annotations; full preserves complete advertised input guidance.";
		parseMcpInputSchemaProfile = (value) => {
			if (value === undefined) return ok(undefined);
			const parsed = mcpInputSchemaProfileSchema.safeParse(value);
			return parsed.success ? ok(parsed.data) : err(new ConfigurationError(profileConstraint, { settings: [{
				setting: "REA_MCP_INPUT_SCHEMA_PROFILE",
				constraint: profileConstraint
			}] }));
		};
	})))();
}

//#endregion
//#region dist/contracts/jsonSchemaKeywords.js
var schemaMaps, schemaArrays, schemaChildren, schemaLiteralValues;
function init_jsonSchemaKeywords() {
	return (init_jsonSchemaKeywords = __esmMin((() => {
		schemaMaps = new Set([
			"$defs",
			"definitions",
			"properties",
			"patternProperties",
			"dependentSchemas",
			"dependencies"
		]);
		schemaArrays = new Set([
			"allOf",
			"anyOf",
			"oneOf",
			"prefixItems"
		]);
		schemaChildren = new Set([
			"items",
			"additionalItems",
			"contains",
			"additionalProperties",
			"unevaluatedProperties",
			"unevaluatedItems",
			"propertyNames",
			"not",
			"if",
			"then",
			"else"
		]);
		schemaLiteralValues = new Set([
			"const",
			"enum",
			"default",
			"examples"
		]);
	})))();
}

//#endregion
//#region dist/contracts/jsonSchemaReferences.js
var isObject$1, dialectOf, JsonSchemaReferences;
function init_jsonSchemaReferences() {
	return (init_jsonSchemaReferences = __esmMin((() => {
		init_jsonSchemaKeywords();
		isObject$1 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
		dialectOf = (schema, inherited) => schema.$schema === undefined ? inherited : schema.$schema === "http://json-schema.org/draft-07/schema#" || schema.$schema === "http://json-schema.org/draft-07/schema" ? "draft-07" : schema.$schema === "https://json-schema.org/draft/2020-12/schema" ? "draft-2020-12" : undefined;
		JsonSchemaReferences = class {
			rootScope;
			#scopes = new WeakMap();
			#referenceSites = [];
			#identities = new Map();
			#relativeIdentities = new WeakMap();
			#ambiguous = new WeakSet();
			constructor(root) {
				let baseUri;
				if (typeof root.$id === "string" && URL.canParse(root.$id)) {
					const url = new URL(root.$id);
					url.hash = "";
					baseUri = url.href;
				}
				this.rootScope = {
					root,
					baseUri,
					dialect: dialectOf(root, "draft-2020-12")
				};
				if (baseUri !== undefined) this.#identities.set(baseUri, this.rootScope);
				const pending = [{
					value: root,
					scope: this.rootScope
				}];
				const visited = new WeakMap();
				while (pending.length > 0) {
					const { value, scope: parent } = pending.pop();
					if (!isObject$1(value)) continue;
					const scope = this.#scope(value, parent);
					if (scope === undefined) continue;
					let seen = visited.get(scope);
					if (seen === undefined) {
						seen = new WeakSet();
						visited.set(scope, seen);
					}
					if (seen.has(value)) continue;
					seen.add(value);
					for (const keyword of [
						"$ref",
						"$dynamicRef",
						"$recursiveRef"
					]) {
						const reference = value[keyword];
						if (typeof reference !== "string") continue;
						this.#referenceSites.push({
							scope,
							reference,
							keyword
						});
						if (keyword !== "$ref") continue;
						const target = this.resolve(scope, reference);
						if (target.kind === "target") pending.push({
							value: target.value,
							scope
						});
					}
					for (const [key, child] of Object.entries(value)) {
						if (schemaMaps.has(key) && isObject$1(child)) {
							for (const item of Object.values(child)) pending.push({
								value: item,
								scope
							});
						} else if ((schemaArrays.has(key) || schemaChildren.has(key)) && Array.isArray(child)) {
							for (const item of child) pending.push({
								value: item,
								scope
							});
						} else if (schemaChildren.has(key)) pending.push({
							value: child,
							scope
						});
					}
				}
			}
			enter(schema, parent) {
				if (parent === undefined) return undefined;
				const scope = this.#scope(schema, parent);
				for (let current = scope; current !== undefined; current = current.parent) if (this.#ambiguous.has(current)) return undefined;
				return scope?.dialect === undefined ? undefined : scope;
			}
			#scope(schema, parent) {
				if (schema === parent.root) return parent;
				if (schema.$id === undefined) return parent;
				let cached = this.#scopes.get(schema);
				if (cached?.has(parent)) return cached.get(parent);
				if (cached === undefined) {
					cached = new WeakMap();
					this.#scopes.set(schema, cached);
				}
				let scope;
				if (typeof schema.$id === "string" && schema.$id !== "" && (!schema.$id.includes("#") || schema.$id !== "#" && schema.$id.indexOf("#") === schema.$id.length - 1)) {
					let baseUri;
					try {
						if (parent.baseUri !== undefined || URL.canParse(schema.$id)) {
							const url = new URL(schema.$id, parent.baseUri);
							url.hash = "";
							baseUri = url.href;
						}
						scope = {
							root: schema,
							baseUri,
							dialect: dialectOf(schema, parent.dialect),
							parent
						};
						if (baseUri !== undefined) {
							const existing = this.#identities.get(baseUri);
							if (existing !== undefined && existing.root !== schema) {
								this.#ambiguous.add(existing);
								this.#ambiguous.add(scope);
							} else if (existing !== undefined) scope = existing;
							else this.#identities.set(baseUri, scope);
						} else {
							let identities = this.#relativeIdentities.get(parent);
							if (identities === undefined) {
								identities = new Map();
								this.#relativeIdentities.set(parent, identities);
							}
							const identity = schema.$id.replace(/#$/u, "");
							const existing = identities.get(identity);
							if (existing !== undefined && existing.root !== schema) {
								this.#ambiguous.add(existing);
								this.#ambiguous.add(scope);
							} else if (existing !== undefined) scope = existing;
							else identities.set(identity, scope);
						}
					} catch {}
				}
				cached.set(parent, scope);
				return scope;
			}
			*references() {
				for (const { scope, reference, keyword } of this.#referenceSites) yield {
					scope,
					target: keyword === "$ref" ? this.resolve(scope, reference) : {
						kind: "unresolved",
						reason: "dynamic"
					}
				};
			}
			resolve(scope, reference) {
				if (scope === undefined || this.enter(scope.root, scope) === undefined) return {
					kind: "unresolved",
					reason: "scope"
				};
				if (!reference.startsWith("#")) return {
					kind: "unresolved",
					reason: "external"
				};
				let fragment;
				try {
					fragment = decodeURIComponent(reference.slice(1));
				} catch {
					return {
						kind: "unresolved",
						reason: "fragment"
					};
				}
				if (fragment === "") return {
					kind: "target",
					value: scope.root,
					path: []
				};
				if (!fragment.startsWith("/")) return { kind: "anchor" };
				let value = scope.root;
				const path = [];
				for (const token of fragment.slice(1).split("/")) {
					if (/~(?:[^01]|$)/u.test(token)) return {
						kind: "unresolved",
						reason: "pointer"
					};
					const key = token.replaceAll("~1", "/").replaceAll("~0", "~");
					if (value === null || typeof value !== "object" || !Object.hasOwn(value, key) || Array.isArray(value) && !/^(?:0|[1-9][0-9]*)$/u.test(key)) return {
						kind: "unresolved",
						reason: "pointer"
					};
					if (value !== scope.root && isObject$1(value) && "$id" in value) return {
						kind: "unresolved",
						reason: "resource-boundary"
					};
					path.push(key);
					value = Reflect.get(value, key);
				}
				return {
					kind: "target",
					value,
					path
				};
			}
		};
	})))();
}

//#endregion
//#region dist/contracts/compactInputSchema.js
var annotationKeys, definitionKeys, jsonValueTypes, jsonValueSchema, enumValueTypes, isSchemaObject, serializedBytes, schemaDepth, COMPACT_SCHEMA_MAX_DEPTH, rebuildSchemaPositions, stripAnnotations, stripChildAnnotations, inlineWithinBudget, detectedTypes, typeArrayItemUnions, hasGatewayIncompatibleShape, containsGatewayCombinator, schemaChildrenAndMaps, REDUCED_ANNOTATION, reduceToShallowProperties, compactAdvertisedInputSchema, presentAdvertisedInputSchema;
function init_compactInputSchema() {
	return (init_compactInputSchema = __esmMin((() => {
		init_jsonSchemaReferences();
		init_jsonSchemaKeywords();
		annotationKeys = new Set([
			"description",
			"examples",
			"default",
			"title"
		]);
		definitionKeys = new Set(["$defs", "definitions"]);
		jsonValueTypes = [
			"null",
			"boolean",
			"object",
			"array",
			"number",
			"string"
		];
		jsonValueSchema = () => ({
			type: [...jsonValueTypes],
			items: {}
		});
		enumValueTypes = (values) => [...new Set(values.map((value) => {
			if (value === null) return "null";
			if (Array.isArray(value)) return "array";
			if (typeof value === "object") return "object";
			return typeof value;
		}))];
		isSchemaObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		serializedBytes = (value) => Buffer.byteLength(JSON.stringify(value), "utf8");
		schemaDepth = (value, depth = 0) => {
			if (Array.isArray(value)) return Math.max(depth, ...value.map((child) => schemaDepth(child, depth + 1)));
			if (!isSchemaObject(value)) return depth;
			return Math.max(depth, ...Object.values(value).map((child) => schemaDepth(child, depth + 1)));
		};
		COMPACT_SCHEMA_MAX_DEPTH = 10;
		rebuildSchemaPositions = (node, rebuild) => {
			if (Array.isArray(node)) return node.map((child) => rebuild(child));
			if (!isSchemaObject(node)) return node;
			const out = {};
			for (const [key, value] of Object.entries(node)) {
				if (schemaLiteralValues.has(key)) {
					out[key] = value;
					continue;
				}
				if (schemaMaps.has(key) && isSchemaObject(value)) {
					out[key] = Object.fromEntries(Object.entries(value).map(([name, child]) => [name, rebuild(child)]));
					continue;
				}
				if (schemaArrays.has(key) && Array.isArray(value)) {
					out[key] = value.map((child) => rebuild(child));
					continue;
				}
				if (schemaChildren.has(key)) {
					out[key] = Array.isArray(value) ? value.map((child) => rebuild(child)) : rebuild(value);
					continue;
				}
				out[key] = value;
			}
			return out;
		};
		stripAnnotations = (schema) => {
			const rebuilt = rebuildSchemaPositions(schema, stripChildAnnotations);
			const out = {};
			for (const [key, value] of Object.entries(rebuilt)) {
				if (annotationKeys.has(key) && key !== "description") continue;
				out[key] = value;
			}
			return out;
		};
		stripChildAnnotations = (child) => {
			const rebuilt = rebuildSchemaPositions(child, stripChildAnnotations);
			if (!isSchemaObject(rebuilt)) return rebuilt;
			const kept = {};
			for (const [key, value] of Object.entries(rebuilt)) if (!annotationKeys.has(key)) kept[key] = value;
			return kept;
		};
		inlineWithinBudget = (root, budgetBytes) => {
			const references = new JsonSchemaReferences(root);
			const identity = Object.fromEntries([
				"$id",
				"$anchor",
				"$schema"
			].flatMap((key) => Object.hasOwn(root, key) ? [[key, root[key]]] : []));
			const identityBytes = Object.keys(identity).length === 0 ? 0 : serializedBytes(identity) - 2;
			if (identityBytes > budgetBytes) return undefined;
			let resolved = true;
			function* serialize(value, position, scope, active) {
				if (Array.isArray(value)) {
					yield "[";
					for (const [index, child] of value.entries()) {
						if (index > 0) yield ",";
						yield* serialize(child, position, scope, active);
					}
					yield "]";
				} else if (isSchemaObject(value)) {
					const currentScope = position === "schema" ? references.enter(value, scope) : scope;
					if (position === "schema" && (currentScope === undefined || currentScope.dialect !== references.rootScope.dialect || [
						"$dynamicRef",
						"$recursiveRef",
						"$dynamicAnchor",
						"$recursiveAnchor"
					].some((key) => Object.hasOwn(value, key)))) {
						resolved = false;
						return;
					}
					if (position === "schema" && Object.keys(value).length === 0) {
						yield JSON.stringify(jsonValueSchema());
						return;
					}
					if (position === "schema" && typeof value.$ref === "string") {
						const target = references.resolve(currentScope, value.$ref);
						if (target.kind !== "target" || currentScope === undefined || active.get(currentScope)?.has(value.$ref)) {
							resolved = false;
							return;
						}
						const { $ref, $id: _id, $anchor: _anchor, $schema: _schema, ...siblings } = value;
						const nextActive = new Map(active);
						nextActive.set(currentScope, new Set([...active.get(currentScope) ?? [], $ref]));
						if (currentScope.dialect === "draft-07" && Object.keys(siblings).length > 0) {
							resolved = false;
							return;
						}
						const expanded = Object.keys(siblings).length === 0 ? target.value : { allOf: [target.value, siblings] };
						yield* serialize(expanded, "schema", currentScope, nextActive);
						return;
					}
					yield "{";
					let first = true;
					for (const [key, child] of Object.entries(value)) {
						if (position === "schema" && (definitionKeys.has(key) || key === "$id" || key === "$anchor" || key === "$schema")) continue;
						if (!first) yield ",";
						first = false;
						yield JSON.stringify(key) + ":";
						const childPosition = position === "map" ? "schema" : position === "schema" && schemaMaps.has(key) ? "map" : position === "schema" && (schemaArrays.has(key) || schemaChildren.has(key)) ? "schema" : "data";
						yield* serialize(child, childPosition, currentScope, active);
					}
					yield "}";
				} else {
					yield JSON.stringify(value);
				}
			}
			const chunks = [];
			let bytes = identityBytes;
			for (const chunk of serialize(root, "schema", references.rootScope, new Map())) {
				bytes += Buffer.byteLength(chunk, "utf8");
				if (bytes > budgetBytes || !resolved) return undefined;
				chunks.push(chunk);
			}
			if (!resolved) return undefined;
			const expanded = JSON.parse(chunks.join(""));
			if (!isSchemaObject(expanded)) return undefined;
			const schema = {
				...identity,
				...expanded
			};
			return serializedBytes(schema) <= budgetBytes ? schema : undefined;
		};
		detectedTypes = (schema, references, inherited, active = new Set()) => {
			if (!isSchemaObject(schema)) return undefined;
			const scope = references.enter(schema, inherited);
			if (scope === undefined) return undefined;
			if (typeof schema.$ref === "string") {
				if (active.has(schema)) return undefined;
				const target = references.resolve(scope, schema.$ref);
				return target.kind === "target" ? detectedTypes(target.value, references, scope, new Set([...active, schema])) : undefined;
			}
			if (typeof schema.type === "string") return [schema.type];
			if (Array.isArray(schema.type) && schema.type.every((type) => typeof type === "string")) return schema.type;
			if (Array.isArray(schema.enum) && schema.enum.length > 0) {
				const enumTypes = enumValueTypes(schema.enum);
				if (enumTypes.every((type) => jsonValueTypes.includes(type))) return enumTypes;
			}
			const alternatives = Array.isArray(schema.anyOf) ? schema.anyOf : Array.isArray(schema.oneOf) ? schema.oneOf : [];
			if (alternatives.length === 0) return undefined;
			const types = alternatives.map((branch) => detectedTypes(branch, references, scope, active));
			if (types.some((type) => type === undefined)) return undefined;
			return [...new Set(types.flatMap((type) => type ?? []))];
		};
		typeArrayItemUnions = (schema) => {
			const references = new JsonSchemaReferences(schema);
			const visit = (node) => {
				const rebuilt = rebuildSchemaPositions(node, visit);
				if (!isSchemaObject(rebuilt) || rebuilt.type !== "array") return rebuilt;
				const items = rebuilt.items;
				if (!isSchemaObject(items) || items.type !== undefined || !Array.isArray(items.oneOf) && !Array.isArray(items.anyOf)) return rebuilt;
				const types = detectedTypes(items, references, references.rootScope);
				return types?.length === 1 ? {
					...rebuilt,
					items: {
						...items,
						type: types[0]
					}
				} : rebuilt;
			};
			return visit(schema);
		};
		hasGatewayIncompatibleShape = (schema) => {
			if (Array.isArray(schema)) return schema.some(hasGatewayIncompatibleShape);
			if (!isSchemaObject(schema)) return false;
			if (Array.isArray(schema.anyOf) && schema.anyOf.length === 0) return true;
			if (schema.type === "array" && isSchemaObject(schema.items) && schema.items.type === undefined && (Array.isArray(schema.items.oneOf) || Array.isArray(schema.items.anyOf))) return true;
			if (Array.isArray(schema.required) && isSchemaObject(schema.properties)) {
				for (const name of schema.required) {
					const property = schema.properties[name];
					if (isSchemaObject(property) && containsGatewayCombinator(property)) return true;
				}
			}
			if (Array.isArray(schema.enum) && schema.enum.length > 0 && schema.type === undefined) {
				const types = enumValueTypes(schema.enum);
				if (types.length === 1 && types.every((type) => [
					"string",
					"number",
					"boolean",
					"null"
				].includes(type))) return true;
			}
			return schemaChildrenAndMaps(schema).some(hasGatewayIncompatibleShape);
		};
		containsGatewayCombinator = (schema) => {
			if (Array.isArray(schema)) return schema.some(containsGatewayCombinator);
			if (!isSchemaObject(schema)) return false;
			if (schema.oneOf !== undefined || schema.allOf !== undefined) return true;
			return schemaChildrenAndMaps(schema).some(containsGatewayCombinator);
		};
		schemaChildrenAndMaps = (schema) => Object.entries(schema).flatMap(([key, value]) => {
			if (schemaMaps.has(key) && isSchemaObject(value)) return Object.values(value);
			if (schemaArrays.has(key) && Array.isArray(value)) return value;
			if (schemaChildren.has(key)) return Array.isArray(value) ? value : [value];
			return [];
		});
		REDUCED_ANNOTATION = "Advertised in reduced form by the compact input schema profile; the server still validates complete canonical inputs.";
		reduceToShallowProperties = (schema) => {
			const properties = isSchemaObject(schema.properties) ? schema.properties : {};
			const description = [
				typeof schema.description === "string" ? schema.description : undefined,
				...Object.entries(isSchemaObject(schema.dependentRequired) ? schema.dependentRequired : isSchemaObject(schema.dependencies) ? schema.dependencies : {}).flatMap(([property, partners]) => Array.isArray(partners) && partners.every((partner) => typeof partner === "string") ? [`When ${property} is provided, also provide ${partners.join(" and ")}.`] : []),
				REDUCED_ANNOTATION
			].filter((text) => text !== undefined).join(" ");
			const references = new JsonSchemaReferences(schema);
			const shallow = Object.fromEntries(Object.entries(properties).map(([name, value]) => {
				const types = detectedTypes(value, references, references.rootScope);
				const type = types?.length === 1 ? types[0] : types;
				const description = isSchemaObject(value) && typeof value.description === "string" ? { description: value.description } : {};
				return [name, {
					...type === undefined ? {} : { type },
					...types?.includes("array") ? { items: jsonValueSchema() } : {},
					...description
				}];
			}));
			return {
				...typeof schema.$schema === "string" ? { $schema: schema.$schema } : {},
				type: "object",
				description,
				properties: shallow,
				...Array.isArray(schema.required) ? { required: [...schema.required] } : {},
				...typeof schema.minProperties === "number" ? { minProperties: schema.minProperties } : {},
				...schema.additionalProperties === false ? { additionalProperties: false } : {}
			};
		};
		compactAdvertisedInputSchema = (schema, budgetBytes) => {
			const expanded = inlineWithinBudget(stripAnnotations(schema), budgetBytes);
			const inline = expanded === undefined ? undefined : typeArrayItemUnions(expanded);
			if (inline !== undefined && serializedBytes(inline) <= budgetBytes && schemaDepth(inline) <= COMPACT_SCHEMA_MAX_DEPTH && !hasGatewayIncompatibleShape(inline)) return {
				schema: inline,
				presentation: "inline"
			};
			const reduced = reduceToShallowProperties(schema);
			if (serializedBytes(reduced) <= budgetBytes) return {
				schema: reduced,
				presentation: "reduced"
			};
			return {
				schema: reduceToShallowProperties({
					type: "object",
					description: (typeof schema.description === "string" ? `${schema.description} ` : "") + REDUCED_ANNOTATION
				}),
				presentation: "reduced"
			};
		};
		presentAdvertisedInputSchema = (schema, compactPresentation) => compactPresentation === undefined ? schema : compactAdvertisedInputSchema(schema, compactPresentation.budgetBytes).schema;
	})))();
}

//#endregion
//#region dist/contracts/advertisedInputExamples.js
var evidenceRecordId, referenceEmbeddedEvidence, advertisedInputExamples;
function init_advertisedInputExamples() {
	return (init_advertisedInputExamples = __esmMin((() => {
		init_evidence();
		evidenceRecordId = (value) => typeof value.evidence_id === "string" && Object.hasOwn(value, "normalized_result") && evidenceSchema.safeParse(value).success ? value.evidence_id : undefined;
		referenceEmbeddedEvidence = (value) => {
			if (Array.isArray(value)) {
				const items = value.map(referenceEmbeddedEvidence);
				return {
					value: items.map((item) => item.value),
					embedsEvidence: items.some((item) => item.embedsEvidence)
				};
			}
			if (value === null || typeof value !== "object") return {
				value,
				embedsEvidence: false
			};
			const evidenceId = evidenceRecordId(value);
			if (evidenceId !== undefined) return {
				value: {
					kind: "retained-evidence",
					evidence_id: evidenceId
				},
				embedsEvidence: true
			};
			const entries = Object.entries(value).map(([key, child]) => [key, referenceEmbeddedEvidence(child)]);
			return {
				value: Object.fromEntries(entries.map(([key, child]) => [key, child.value])),
				embedsEvidence: entries.some(([, child]) => child.embedsEvidence)
			};
		};
		advertisedInputExamples = (contract) => {
			const advertised = new Map();
			for (const { input } of contract.examples) {
				const projection = referenceEmbeddedEvidence(input);
				if (projection.embedsEvidence && !contract.inputSchema.safeParse(projection.value).success) continue;
				advertised.set(JSON.stringify(projection.value), projection.value);
			}
			return [...advertised.values()];
		};
	})))();
}

//#endregion
//#region dist/contracts/inputSchemaPresentation.js
var isObject, referencedDescription, describeSchema, objectBranch, requiredProperties, sharedRequiredProperties, inputGroup, isBooleanLiteralSchema, isBooleanSchema, preserveSharedDefault, normalizeAdvertisedSchema, flattenRootObjectUnion, presentDiscriminatedRoot, presentInputJsonSchema;
function init_inputSchemaPresentation() {
	return (init_inputSchemaPresentation = __esmMin((() => {
		init_jsonSchemaReferences();
		init_jsonSchemaKeywords();
		isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		referencedDescription = (references, schema, inherited) => {
			let value = schema;
			let scope = inherited;
			const active = new Set();
			while (isObject(value)) {
				scope = references.enter(value, scope);
				if (typeof value.description === "string" && (typeof value.$ref !== "string" || scope?.dialect !== "draft-07")) return value.description;
				if (typeof value.$ref !== "string" || active.has(value)) return undefined;
				active.add(value);
				const target = references.resolve(scope, value.$ref);
				if (target.kind !== "target") return undefined;
				value = target.value;
			}
			return undefined;
		};
		describeSchema = (schema, references, inherited, describeProperty) => {
			if (!isObject(schema)) return schema;
			const scope = references.enter(schema, inherited);
			return Object.fromEntries(Object.entries(schema).map(([key, value]) => {
				if (schemaMaps.has(key) && isObject(value)) return [key, Object.fromEntries(Object.entries(value).map(([name, child]) => {
					const described = describeSchema(child, references, scope, describeProperty);
					if (key !== "properties" || !isObject(described) || !isObject(child)) return [name, described];
					const description = referencedDescription(references, child, scope) ?? describeProperty(name);
					return [name, description === undefined ? described : {
						...described,
						description
					}];
				}))];
				if (schemaArrays.has(key) && Array.isArray(value)) return [key, value.map((child) => describeSchema(child, references, scope, describeProperty))];
				if (schemaChildren.has(key)) return [key, Array.isArray(value) ? value.map((child) => describeSchema(child, references, scope, describeProperty)) : describeSchema(value, references, scope, describeProperty)];
				return [key, value];
			}));
		};
		objectBranch = (references, branch) => {
			let resolved = branch;
			if (isObject(branch) && typeof branch.$ref === "string") {
				if (Object.keys(branch).length !== 1) return undefined;
				const target = references.resolve(references.rootScope, branch.$ref);
				if (target.kind !== "target") return undefined;
				resolved = target.value;
			}
			return isObject(resolved) && references.enter(resolved, references.rootScope) === references.rootScope && ![
				"$id",
				"$schema",
				"$anchor",
				"$dynamicAnchor",
				"$recursiveAnchor",
				"$dynamicRef",
				"$recursiveRef"
			].some((key) => Object.hasOwn(resolved, key)) && resolved.type === "object" && isObject(resolved.properties) ? resolved : undefined;
		};
		requiredProperties = (branch) => Array.isArray(branch.required) ? branch.required.filter((name) => typeof name === "string") : [];
		sharedRequiredProperties = (branches) => {
			const [first = [], ...others] = branches.map(requiredProperties);
			return first.filter((name) => others.every((names) => names.includes(name)));
		};
		inputGroup = (branch) => {
			const required = requiredProperties(branch);
			const optional = Object.keys(branch.properties ?? {}).filter((name) => !required.includes(name)).map((name) => `[${name}]`);
			return [...required, ...optional].join(" + ");
		};
		isBooleanLiteralSchema = (schema) => isObject(schema) && (typeof schema.const === "boolean" || Array.isArray(schema.enum) && schema.enum.length > 0 && schema.enum.every((value) => typeof value === "boolean"));
		isBooleanSchema = (schema) => isObject(schema) && (schema.type === "boolean" || isBooleanLiteralSchema(schema));
		preserveSharedDefault = (schema, branches) => {
			if (schema.default !== undefined) return;
			const defaults = branches.filter(isObject).map((branch) => branch.default).filter((value) => value !== undefined);
			if (defaults.length > 0 && defaults.every((value) => isDeepStrictEqual(value, defaults[0]))) schema.default = defaults[0];
		};
		normalizeAdvertisedSchema = (value) => {
			if (!isObject(value)) return {
				schema: value,
				changed: false
			};
			const node = { ...value };
			let changed = false;
			const normalizeMap = (map) => Object.fromEntries(Object.entries(map).map(([name, child]) => {
				const result = normalizeAdvertisedSchema(child);
				changed ||= result.changed;
				return [name, result.schema];
			}));
			const normalizeList = (list) => list.map((child) => {
				const result = normalizeAdvertisedSchema(child);
				changed ||= result.changed;
				return result;
			});
			for (const [key, child] of Object.entries(value)) {
				if (schemaMaps.has(key) && isObject(child)) {
					node[key] = normalizeMap(child);
				} else if (schemaArrays.has(key) && key !== "anyOf" && key !== "oneOf" && Array.isArray(child)) {
					node[key] = normalizeList(child).map((result) => result.schema);
				} else if (schemaChildren.has(key) && key !== "not" && key !== "if" && key !== "then" && key !== "else") {
					const results = Array.isArray(child) ? normalizeList(child) : [normalizeAdvertisedSchema(child)];
					const nestedChanged = results.some((result) => result.changed);
					if (key === "contains" && nestedChanged && value.maxContains !== undefined) {
						delete node.contains;
						delete node.minContains;
						delete node.maxContains;
						changed = true;
					} else {
						node[key] = Array.isArray(child) ? results.map((result) => result.schema) : results[0]?.schema;
						changed ||= nestedChanged;
					}
				}
			}
			if (typeof node.const === "boolean") {
				delete node.const;
				if (node.type === undefined) node.type = "boolean";
				changed = true;
			}
			if (node.const === "") {
				delete node.const;
				if (node.type === undefined) node.type = "string";
				changed = true;
			}
			if (Array.isArray(node.enum) && node.enum.length > 0 && node.enum.every((item) => typeof item === "boolean")) {
				delete node.enum;
				if (node.type === undefined) node.type = "boolean";
				changed = true;
			}
			if (Array.isArray(node.enum) && node.enum.includes("")) {
				const values = node.enum;
				delete node.enum;
				if (node.type === undefined && values.every((item) => typeof item === "string")) node.type = "string";
				changed = true;
			}
			const negated = Object.hasOwn(value, "not") ? normalizeAdvertisedSchema(value.not) : undefined;
			if (negated?.changed) {
				changed = true;
				delete node.not;
			} else if (negated !== undefined) {
				node.not = negated.schema;
			}
			const conditional = Object.hasOwn(value, "if") ? normalizeAdvertisedSchema(value.if) : undefined;
			const thenBranch = Object.hasOwn(value, "then") ? normalizeAdvertisedSchema(value.then) : undefined;
			const elseBranch = Object.hasOwn(value, "else") ? normalizeAdvertisedSchema(value.else) : undefined;
			if (conditional?.changed) {
				changed = true;
				delete node.if;
				delete node.then;
				delete node.else;
			} else {
				if (conditional !== undefined) node.if = conditional.schema;
				if (thenBranch !== undefined) {
					node.then = thenBranch.schema;
					changed ||= thenBranch.changed;
				}
				if (elseBranch !== undefined) {
					node.else = elseBranch.schema;
					changed ||= elseBranch.changed;
				}
			}
			for (const combinator of ["anyOf", "oneOf"]) {
				const branches = value[combinator];
				if (!Array.isArray(branches)) continue;
				const normalized = normalizeList(branches);
				const schemas = normalized.map((result) => result.schema);
				const branchesChanged = normalized.some((result) => result.changed);
				if (combinator === "oneOf" && branchesChanged) {
					const booleanLiteralsOnly = branches.every(isBooleanLiteralSchema);
					if (booleanLiteralsOnly) {
						node.type = "boolean";
						preserveSharedDefault(node, schemas);
						delete node.oneOf;
						changed = true;
						continue;
					}
					delete node.oneOf;
					if (Array.isArray(node.anyOf)) {
						const existingAllOf = Array.isArray(node.allOf) ? node.allOf : [];
						node.allOf = [...existingAllOf, { anyOf: schemas }];
					} else {
						node.anyOf = schemas;
					}
					changed = true;
					continue;
				}
				if (branchesChanged && schemas.length > 0 && schemas.every(isBooleanSchema)) {
					node.type = "boolean";
					preserveSharedDefault(node, schemas);
					delete node[combinator];
					changed = true;
					continue;
				}
				node[combinator] = schemas;
				changed ||= branchesChanged;
			}
			return {
				schema: node,
				changed
			};
		};
		flattenRootObjectUnion = (root, references) => {
			const { anyOf, oneOf, ...rest } = root;
			const alternatives = Array.isArray(anyOf) ? anyOf : oneOf;
			if (!Array.isArray(alternatives) || alternatives.length === 0 || root.properties !== undefined) return root;
			for (const { scope, target } of references.references()) if (target.kind === "unresolved" && target.reason === "dynamic" || scope === references.rootScope && (target.kind !== "target" || target.path.length === 0 || target.path[0] === "anyOf" || target.path[0] === "oneOf")) return root;
			const branches = alternatives.map((branch) => objectBranch(references, branch));
			if (!branches.every((branch) => branch !== undefined)) return root;
			const variants = new Map();
			for (const branch of branches) for (const [name, schema] of Object.entries(branch.properties ?? {})) {
				const known = variants.get(name) ?? [];
				if (!known.some((seen) => isDeepStrictEqual(seen, schema))) known.push(schema);
				variants.set(name, known);
			}
			const required = sharedRequiredProperties(branches);
			for (const [name, schemas] of variants) {
				const defaults = branches.map((branch) => {
					const property = isObject(branch.properties) ? branch.properties[name] : undefined;
					return isObject(property) ? property.default : undefined;
				});
				if (defaults.every((value) => value !== undefined && isDeepStrictEqual(value, defaults[0]))) continue;
				const withoutDefaults = [];
				for (const schema of schemas) {
					let withoutDefault = schema;
					if (isObject(schema) && Object.hasOwn(schema, "default")) {
						const { default: _default, ...rest } = schema;
						withoutDefault = rest;
					}
					if (!withoutDefaults.some((known) => isDeepStrictEqual(known, withoutDefault))) withoutDefaults.push(withoutDefault);
				}
				variants.set(name, withoutDefaults);
			}
			const fewestRequired = Math.min(...branches.map((branch) => requiredProperties(branch).length));
			const groups = [...new Set(branches.map(inputGroup))];
			const description = [typeof rest.description === "string" ? rest.description : undefined, groups.length > 1 ? `Provide a complete input group: ${groups.join("; ")}.` : undefined].filter((text) => text !== undefined);
			const { dependencies: _dependencies, dependentRequired: _dependentRequired, ...presentation } = rest;
			return {
				...presentation,
				type: "object",
				...description.length > 0 ? { description: description.join(" ") } : {},
				properties: Object.fromEntries([...variants].map(([name, schemas]) => [name, schemas.length === 1 ? schemas[0] : { anyOf: schemas }])),
				...required.length > 0 ? { required } : {},
				...fewestRequired > 0 ? { minProperties: fewestRequired } : {},
				...branches.every((branch) => branch.additionalProperties === false) ? { additionalProperties: false } : {}
			};
		};
		presentDiscriminatedRoot = (root) => {
			const { "x-rea-root-discriminator": discriminator, ...canonical } = root;
			const references = new JsonSchemaReferences(canonical);
			const flattened = flattenRootObjectUnion(canonical, references);
			if (typeof discriminator !== "string" || flattened === canonical) return flattened;
			const alternatives = canonical.anyOf ?? canonical.oneOf;
			if (!Array.isArray(alternatives) || alternatives.length !== 2) throw new TypeError("A presented root discriminator requires two object alternatives");
			const branches = alternatives.map((alternative) => {
				const branch = objectBranch(references, alternative);
				if (branch === undefined || branch.additionalProperties !== false) throw new TypeError("A presented root discriminator requires strict objects");
				return branch;
			});
			const requiredBranch = branches.find((branch) => requiredProperties(branch).includes(discriminator));
			const fallback = branches.find((branch) => !requiredProperties(branch).includes(discriminator));
			const literal = (branch) => {
				const properties = branch?.properties;
				const schema = isObject(properties) ? properties[discriminator] : undefined;
				return isObject(schema) ? schema.const : undefined;
			};
			const selected = literal(requiredBranch), otherwise = literal(fallback);
			if (requiredBranch === undefined || fallback === undefined || typeof selected !== "string" || typeof otherwise !== "string" || selected === otherwise) throw new TypeError("A presented root discriminator requires distinct literals and one default alternative");
			const properties = Object.fromEntries(Object.entries(isObject(flattened.properties) ? flattened.properties : {}).map(([key, schema]) => {
				if (!isObject(schema) || !Array.isArray(schema.anyOf)) return [key, schema];
				const possible = schema.anyOf.filter((alternative) => alternative !== false && !(isObject(alternative) && isObject(alternative.not) && Object.keys(alternative.not).length === 0));
				return [key, possible.length === 1 ? possible[0] : schema];
			}));
			const commonRequired = new Set(requiredProperties(flattened));
			const constraints = (branch) => {
				const own = isObject(branch.properties) ? branch.properties : {};
				const differences = Object.fromEntries(Object.entries(properties).flatMap(([key, schema]) => {
					if (key === discriminator || isDeepStrictEqual(schema, own[key])) return [];
					return [[key, Object.hasOwn(own, key) ? own[key] : false]];
				}));
				const required = requiredProperties(branch).filter((key) => !commonRequired.has(key));
				return {
					...Object.keys(differences).length === 0 ? {} : { properties: differences },
					...required.length === 0 ? {} : { required }
				};
			};
			const { description: _description, ...presentation } = flattened;
			return {
				...presentation,
				properties,
				...canonical.description === undefined ? {} : { description: canonical.description },
				if: {
					properties: { [discriminator]: { const: selected } },
					required: [discriminator]
				},
				then: constraints(requiredBranch),
				else: constraints(fallback)
			};
		};
		presentInputJsonSchema = (root, describeProperty) => {
			const flattened = presentDiscriminatedRoot(root);
			const references = new JsonSchemaReferences(flattened);
			const described = describeSchema(flattened, references, references.rootScope, describeProperty);
			if (!isObject(described)) return normalizeAdvertisedSchema(flattened).schema;
			const { dependencies: _dependencies, dependentRequired: _dependentRequired, ...presentation } = described;
			const rootDependencies = isObject(described.dependentRequired) ? described.dependentRequired : isObject(described.dependencies) ? described.dependencies : undefined;
			const dependencyGuidance = rootDependencies === undefined ? [] : Object.entries(rootDependencies).flatMap(([property, partners]) => Array.isArray(partners) && partners.every((partner) => typeof partner === "string") ? [`When ${property} is provided, also provide ${partners.join(" and ")}.`] : []);
			if (dependencyGuidance.length === 0) return normalizeAdvertisedSchema(presentation).schema;
			const description = [typeof presentation.description === "string" ? presentation.description : undefined, ...dependencyGuidance].filter((text) => text !== undefined);
			return normalizeAdvertisedSchema({
				...presentation,
				description: description.join(" ")
			}).schema;
		};
	})))();
}

//#endregion
//#region dist/contracts/toolSchemaMetadata.js
var PROPERTY_DESCRIPTIONS, toolInputSchemaWithMetadata, advertisedInputJsonSchema, toolOutputSchemaWithMetadata, transformAdvertisedInputJsonSchema, hasRelativeSchemaReference, withAdvertisedJsonSchema, memoizeByTarget, isSchemaRecord, fallbackPropertyDescription;
function init_toolSchemaMetadata() {
	return (init_toolSchemaMetadata = __esmMin((() => {
		init_jsonSchemaReferences();
		init_advertisedInputExamples();
		init_inputSchemaPresentation();
		init_jsonSchemaKeywords();
		init_canonicalDigest();
		PROPERTY_DESCRIPTIONS = {
			addresses: "Ordered provider-normalized procedure addresses to analyze.",
			after: "The later or right-hand observation to compare.",
			before: "The earlier or left-hand observation to compare.",
			boundary_id: "Exact reconstruction boundary identifier to evaluate.",
			case_sensitive: "Whether text matching distinguishes uppercase and lowercase.",
			cdp_endpoint: "Literal loopback Chrome DevTools Protocol endpoint.",
			comment: "Exact analyst comment text to write.",
			comparisons: "Validated comparison Evidence records to aggregate.",
			coverage: "Exact reconstruction-coverage commitment to verify.",
			direction: "Direction in which to traverse or compare relationships.",
			document: "Exact provider document or program identity.",
			error: "Structured, caller-actionable error when the operation fails.",
			evidence: "Evidence record produced by this operation.",
			evidence_id: "Stable identifier of the recorded Evidence observation.",
			executable: "Command name or executable path to run.",
			format: "Declared input artifact format.",
			name: "Exact name used by this operation.",
			pattern: "Literal text or regular expression used to filter matching results.",
			phase: "Current plan or execution phase of the operation.",
			plan: "Content-bound execution plan and its digest commitment.",
			query: "Non-empty feature or text query to investigate.",
			question: "Concrete unresolved question to retain for later investigation.",
			result: "Primary structured result returned by this operation.",
			left: "Left-hand input used for comparison or differential execution.",
			limits: "Resource budgets that bound execution and retained output for this operation.",
			mode: "Operation mode that selects the requested behavior.",
			overwrite: "Whether an existing destination may be replaced.",
			path: "Local filesystem path used by this operation.",
			provider_id: "Exact deep-analysis provider ID, or automatic selection when omitted.",
			right: "Right-hand input used for comparison or differential execution.",
			source_evidence: "Evidence records supporting the prepared source transformation.",
			status: "Current lifecycle or verification status.",
			summary: "Concise evidence-backed summary of the result.",
			symbols: "Ordered Swift symbols to demangle.",
			target_id: "Exact CDP target identifier selected from the endpoint's target listing.",
			unknown_id: "Exact residual-unknown identifier."
		};
		toolInputSchemaWithMetadata = (contract) => withAdvertisedJsonSchema(contract.inputSchema, "input", (project) => (options) => {
			const inline = project({
				...options,
				libraryOptions: {
					...options.libraryOptions,
					reused: "inline"
				}
			});
			const examples = advertisedInputExamples(contract);
			return {
				...presentInputJsonSchema(inline, fallbackPropertyDescription),
				...examples.length === 0 ? {} : { examples }
			};
		});
		advertisedInputJsonSchema = (contract) => toolInputSchemaWithMetadata(contract)["~standard"].jsonSchema.input({ target: "draft-2020-12" });
		toolOutputSchemaWithMetadata = (contract) => withAdvertisedJsonSchema(contract.outputSchema, "output", (project) => (options) => {
			const shared = project({
				...options,
				libraryOptions: {
					reused: "ref",
					...options.libraryOptions
				}
			});
			if ("$id" in shared || hasRelativeSchemaReference(shared)) return shared;
			return {
				...shared,
				$id: `urn:rea:tool-output:sha256:${digestCanonicalValue({
					target: options.target,
					schema: shared
				}, "Tool output schema")}`
			};
		});
		transformAdvertisedInputJsonSchema = (schema, transform) => {
			const standard = Reflect.get(schema, "~standard");
			if (!isSchemaRecord(standard)) return schema;
			const jsonSchema = Reflect.get(standard, "jsonSchema");
			if (!isSchemaRecord(jsonSchema)) return schema;
			const project = Reflect.get(jsonSchema, "input");
			if (typeof project !== "function") return schema;
			const byTarget = new Map();
			const transformedInput = (options) => {
				const target = Reflect.get(options, "target");
				const cacheable = typeof target === "string" && Reflect.get(options, "libraryOptions") === undefined;
				if (cacheable) {
					const cached = byTarget.get(target);
					if (cached !== undefined) return cached;
				}
				const projected = project(options);
				const transformed = isSchemaRecord(projected) ? transform(projected) : projected;
				if (cacheable && isSchemaRecord(transformed)) byTarget.set(target, transformed);
				return transformed;
			};
			return {
				...schema,
				"~standard": {
					...standard,
					jsonSchema: {
						...jsonSchema,
						input: transformedInput
					}
				}
			};
		};
		hasRelativeSchemaReference = (schema) => {
			const references = new JsonSchemaReferences(schema);
			const pending = [{
				value: schema,
				scope: references.rootScope,
				position: "schema"
			}];
			const visited = new WeakMap();
			while (pending.length > 0) {
				const entry = pending.pop();
				const current = entry.value;
				if (current === null || typeof current !== "object") continue;
				const { position } = entry;
				const scope = position !== "map" && isSchemaRecord(current) ? references.enter(current, entry.scope) : entry.scope;
				if (scope === undefined) return true;
				let positions = visited.get(scope);
				if (positions === undefined) {
					positions = {
						schema: new WeakSet(),
						map: new WeakSet(),
						unknown: new WeakSet()
					};
					visited.set(scope, positions);
				}
				if (positions[position].has(current)) continue;
				positions[position].add(current);
				if (Array.isArray(current)) {
					for (const value of current) pending.push({
						value,
						scope,
						position
					});
					continue;
				}
				for (const [key, value] of Object.entries(current)) {
					if (position !== "map" && [
						"$id",
						"$ref",
						"$dynamicRef",
						"$recursiveRef"
					].includes(key) && typeof value === "string") {
						if (key === "$dynamicRef" || key === "$recursiveRef") return true;
						if (!value.startsWith("#") && !URL.canParse(value)) return true;
						if (key !== "$id" && value.startsWith("#")) {
							const target = references.resolve(scope, value);
							if (target.kind === "unresolved") return true;
							if (target.kind === "target") pending.push({
								value: target.value,
								scope,
								position: "schema"
							});
						}
					}
					if (position === "schema" && schemaLiteralValues.has(key)) continue;
					const childPosition = position === "map" ? "schema" : position === "schema" && schemaMaps.has(key) ? "map" : position === "schema" && (schemaArrays.has(key) || schemaChildren.has(key)) ? "schema" : "unknown";
					if (value !== null && typeof value === "object") pending.push({
						value,
						scope,
						position: childPosition
					});
				}
			}
			return false;
		};
		withAdvertisedJsonSchema = (canonical, io, advertise = (project) => project) => {
			const schema = canonical.meta(z.globalRegistry.get(canonical) ?? {});
			const standard = schema["~standard"];
			const project = standard.jsonSchema?.[io];
			if (project === undefined) throw new TypeError(`Tool ${io} schema does not expose Standard JSON Schema`);
			Object.defineProperty(schema, "~standard", { value: {
				...standard,
				jsonSchema: {
					...standard.jsonSchema,
					[io]: memoizeByTarget(advertise(project))
				}
			} });
			return schema;
		};
		memoizeByTarget = (project) => {
			const byTarget = new Map();
			return (options) => {
				if (options.libraryOptions !== undefined) return project(options);
				const cached = byTarget.get(options.target);
				if (cached !== undefined) return cached;
				const projected = project(options);
				byTarget.set(options.target, projected);
				return projected;
			};
		};
		isSchemaRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		fallbackPropertyDescription = (property) => {
			const explicit = Object.hasOwn(PROPERTY_DESCRIPTIONS, property) ? PROPERTY_DESCRIPTIONS[property] : undefined;
			if (explicit !== undefined) return explicit;
			const words = property.replaceAll("_", " ");
			if (property.startsWith("max_")) return `Maximum permitted ${words.slice(4)} for this operation.`;
			if (property.startsWith("include_")) return `Whether to include ${words.slice(8)} in the result.`;
			if (property.startsWith("expected_")) return `Expected ${words.slice(9)} used to reject stale or mismatched input.`;
			if (property.endsWith("_sha256")) return `Exact SHA-256 digest of ${words.slice(0, -7)}.`;
			if (property.endsWith("_evidence_id")) return `Exact Evidence identifier for the ${words.slice(0, -12)} observation.`;
			if (property.endsWith("_evidence_ids")) return `Ordered Evidence identifiers for the ${words.slice(0, -13)} observations.`;
			if (property.endsWith("_path")) return `Local filesystem path for ${words.slice(0, -5)}.`;
			if (property.endsWith("_uri")) return `Canonical URI for ${words.slice(0, -4)}.`;
			if (property.endsWith("_bytes")) return `Byte count for ${words.slice(0, -6)}.`;
			if (property.endsWith("_root") || property.endsWith("_roots")) return `Local filesystem ${words} selected for this operation.`;
			if (property.startsWith("is_") || property.startsWith("has_")) return `Whether ${words}.`;
			return undefined;
		};
	})))();
}

//#endregion
export { transformAdvertisedInputJsonSchema as a, COMPACT_INPUT_SCHEMA_BUDGET_BYTES as c, mcpInputSchemaProfileSchema as d, parseMcpInputSchemaProfile as f, init_CurrentEntrypointPath as h, toolOutputSchemaWithMetadata as i, compactPresentationForMcpInputSchemaProfile as l, CURRENT_ENTRYPOINT_PATH as m, init_toolSchemaMetadata as n, init_compactInputSchema as o, resolveMcpInputSchemaProfile as p, toolInputSchemaWithMetadata as r, presentAdvertisedInputSchema as s, advertisedInputJsonSchema as t, init_mcpInputSchemaProfile as u };