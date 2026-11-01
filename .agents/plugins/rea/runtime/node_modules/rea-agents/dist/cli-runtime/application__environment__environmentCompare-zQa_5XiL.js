import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { compareOffsetDateTimeInstants, init_offsetDateTime, offsetDateTimeInstantFromEpochMilliseconds, readRecordedDateTime } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { bulkCollectionOf, composedPartText, composedValue, decodedSegment, init_EnvironmentManifestAccumulator, init_environmentManifestOrigin, init_environmentStatePaging, init_environmentStateRules, init_environmentStateWriteAddress, init_environmentStateWriteClockFormats, init_environmentStateWriteComposed, init_environmentStateWriteValues, init_exactJsonNumber, init_webNetworkRouteTemplates, isJsonLike, isPagingParameter, isUuid, likeGeneratedInteger, matchesClockFormat, mediaTypeEssence, parseExactJson, primaryOrigin, readClock, readRecordedRequestLine, same, segmentRule, segmentsOf } from "./analysisView-DxQriOKj.js";
import { err, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { init_environmentSource, inputError, parseCaptureEvidence, recordedExchange, replayedBody } from "./environmentSource-BU4MlUgQ.js";
import { EnvironmentStateStore, environmentToolArguments, init_environmentState, init_environmentStateStore, init_environmentTools, prepareServedState, servedCatalog } from "./environmentState-UIc1qofA.js";
import { environmentToolAnswer, init_environmentReplay, init_environmentToolAnswer, selectsRecordedLine } from "./environmentToolAnswer-Bq51eUGF.js";
import { z } from "zod";
import { fromJsonSchema } from "@modelcontextprotocol/server";

//#region dist/application/environment/environmentCompareIds.js
var ID_FIELD, isObject$1, isScalarId, IDENTITY_FIELD, IdMap, keyCandidates, pairing, pairElements, keyedByIds, keyedByLearnedIds, learnKeyedEntries, idPair, childPointer, learnAt, learnIds, inEnvTerms, translateValue, translateBulkBody, environmentArguments, translatePath;
function init_environmentCompareIds() {
	return (init_environmentCompareIds = __esmMin((() => {
		init_environmentStateWriteValues();
		ID_FIELD = /^(id|uuid|guid)$|(_id|Id|ID|_uuid|Uuid)$/u;
		isObject$1 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		isScalarId = (value) => typeof value === "string" && value !== "" || typeof value === "number" && Number.isFinite(value);
		IDENTITY_FIELD = /^(id|uuid|guid)$/u;
		IdMap = class {
			#toEnv = new Map();
			#toLive = new Map();
			#scoped = new Map();
			#envValues = new Set();
			#stateReferenceFields = new Map();
			#ambiguousEnvValues = new Set();
			#conflicts = 0;
			/**
			* Pair a live value with an environment value. The first pairing of either side wins; if a conflict includes an equal
			* pair, the accepted global destination is withheld from translation so raw equality cannot hide that conflict. A
			* collection keeps its own first pairing, including equal values. `size` counts usable non-identity translations.
			*/
			learn(live, env, scope, stateReferenceField) {
				const liveKey = String(live);
				const envKey = String(env);
				if (scope !== undefined && !this.#pairScoped(scope, liveKey, env, envKey)) return;
				if (scope !== undefined && liveKey === envKey) return;
				const known = this.#toEnv.get(liveKey);
				if (known !== undefined) {
					if (String(known) !== envKey) {
						this.#conflicts += 1;
						if (liveKey === envKey) this.#ambiguousEnvValues.add(String(known));
					} else if (stateReferenceField !== undefined) this.#noteStateReference(liveKey, stateReferenceField);
					return;
				}
				const knownLive = this.#toLive.get(envKey);
				if (knownLive !== undefined) {
					this.#conflicts += 1;
					if (String(knownLive) === envKey || liveKey === envKey) this.#ambiguousEnvValues.add(envKey);
					return;
				}
				this.#toEnv.set(liveKey, env);
				this.#toLive.set(envKey, live);
				this.#envValues.add(envKey);
				if (stateReferenceField !== undefined) this.#noteStateReference(liveKey, stateReferenceField);
			}
			/** Store one collection's pairing. False when it conflicts with a pairing that collection already kept. */
			#pairScoped(scope, liveKey, env, envKey) {
				const scoped = this.#scoped.get(scope) ?? new Map();
				const known = scoped.get(liveKey);
				if (known !== undefined) {
					if (String(known) !== envKey) this.#conflicts += 1;
					return false;
				}
				for (const value of scoped.values()) {
					if (String(value) === envKey) {
						this.#conflicts += 1;
						return false;
					}
				}
				scoped.set(liveKey, env);
				this.#scoped.set(scope, scoped);
				this.#envValues.add(envKey);
				return true;
			}
			/** The environment's value for a live one: the collection's own when a scope is given and it knows one, else the probe's. */
			env(live, scope) {
				const liveKey = String(live);
				const scoped = scope === undefined ? undefined : this.#scoped.get(scope)?.get(liveKey);
				if (scoped !== undefined) return scoped;
				const global = this.#toEnv.get(liveKey);
				return global !== undefined && !this.#ambiguousEnvValues.has(String(global)) ? global : undefined;
			}
			hasLive(value) {
				const key = String(value);
				return this.#toEnv.has(key) || [...this.#scoped.values()].some((scoped) => scoped.has(key));
			}
			hasEnv(value) {
				return this.#envValues.has(String(value));
			}
			#noteStateReference(value, field) {
				const fields = this.#stateReferenceFields.get(value) ?? new Set();
				fields.add(field);
				this.#stateReferenceFields.set(value, fields);
			}
			/** A non-identifier string field that learning proved is an id in environment state. */
			isStateReference(value, field) {
				return this.#stateReferenceFields.get(String(value))?.has(field) ?? false;
			}
			get size() {
				return [...this.#toEnv].filter(([live, env]) => live !== String(env) && !this.#ambiguousEnvValues.has(String(env))).length;
			}
			get conflicts() {
				return this.#conflicts;
			}
		};
		keyCandidates = (items) => {
			const candidates = new Set();
			const first = items[0];
			if (first === undefined) return candidates;
			for (const key of Object.keys(first)) {
				if (ID_FIELD.test(key)) continue;
				const values = items.map((item) => item[key]);
				if (values.every((value) => typeof value === "string" && value !== "") && new Set(values).size === values.length) candidates.add(key);
			}
			return candidates;
		};
		pairing = (live, env) => {
			const byPosition = (by) => ({
				pairs: Array.from({ length: Math.min(live.length, env.length) }, (_, index) => [index, index]),
				by
			});
			if (!live.every(isObject$1) || !env.every(isObject$1)) return byPosition("position");
			const liveItems = live;
			const envItems = env;
			const envKeys = keyCandidates(envItems);
			const shared = [...keyCandidates(liveItems)].filter((key) => envKeys.has(key));
			let best = [];
			for (const key of shared.sort()) {
				const envIndex = new Map(envItems.map((item, index) => [item[key], index]));
				const pairs = [];
				for (const [index, item] of liveItems.entries()) {
					const match = envIndex.get(item[key]);
					if (match !== undefined) pairs.push([index, match]);
				}
				if (pairs.length > best.length) best = pairs;
			}
			if (best.length > 0) return {
				pairs: best,
				by: "key"
			};
			return byPosition(shared.length > 0 ? "unmatched" : "position");
		};
		pairElements = (live, env) => pairing(live, env).pairs;
		keyedByIds = (entries) => entries.every(([key, value]) => /^\d+$/u.test(key) || isUuid(key) || isObject$1(value) && Object.entries(value).some(([field, held]) => IDENTITY_FIELD.test(field) && isScalarId(held) && String(held) === key));
		keyedByLearnedIds = (live, env, map) => {
			const entries = Object.entries(live);
			if (!entries.some(([key]) => map.hasLive(key))) return false;
			return entries.some(([key]) => Object.hasOwn(env, key)) ? keyedByIds(entries) : entries.every(([, value]) => isObject$1(value)) || keyedByIds(entries);
		};
		learnKeyedEntries = (live, env, context, own, at) => {
			const liveEntries = Object.entries(live);
			const envEntries = Object.entries(env);
			const shared = liveEntries.filter(([key]) => Object.hasOwn(env, key)).length;
			if (liveEntries.length === 0 || envEntries.length === 0 || shared === liveEntries.length || !liveEntries.every(([, value]) => isObject$1(value)) || !envEntries.every(([, value]) => isObject$1(value))) return false;
			const paired = pairing(liveEntries.map(([, value]) => value), envEntries.map(([, value]) => value));
			if (paired.by !== "key" || shared > 0 && (paired.pairs.length !== liveEntries.length || !keyedByIds(liveEntries) || !keyedByIds(envEntries))) return false;
			for (const [left, right] of paired.pairs) {
				const [liveKey, liveValue] = liveEntries[left];
				const [envKey, envValue] = envEntries[right];
				context.map.learn(liveKey, envKey, own ? context.scope : undefined);
				learnAt(liveValue, envValue, context, {
					at: childPointer(at, liveKey),
					own
				});
			}
			return true;
		};
		idPair = (key, value, other, heldIds) => isScalarId(value) && isScalarId(other) && (ID_FIELD.test(key) || typeof value === "string" && typeof other === "string" && heldIds.has(other)) ? [value, other] : undefined;
		childPointer = (at, key) => `${at}/${String(key).replaceAll("~", "~0").replaceAll("/", "~1")}`;
		learnAt = (live, env, context, place) => {
			if (Array.isArray(live) && Array.isArray(env)) {
				const paired = pairing(live, env);
				if (paired.by === "unmatched" || paired.by === "position" && live.length !== env.length) return;
				for (const [left, right] of paired.pairs) learnAt(live[left], env[right], context, {
					at: childPointer(place.at, left),
					own: place.at === context.entityAt
				});
				return;
			}
			if (!isObject$1(live) || !isObject$1(env)) {
				if (context.identity && place.at === context.entityAt && isScalarId(live) && isScalarId(env)) context.map.learn(live, env, context.scope);
				return;
			}
			const own = place.own || place.at === context.entityAt;
			if (learnKeyedEntries(live, env, context, own, place.at)) return;
			for (const [key, value] of Object.entries(live)) {
				if (!Object.hasOwn(env, key)) continue;
				const other = env[key];
				const pair = idPair(key, value, other, context.heldIds);
				if (pair !== undefined) {
					const stateReferenceField = !ID_FIELD.test(key) && typeof value === "string" && typeof other === "string" && context.heldIds.has(other);
					context.map.learn(...pair, own && IDENTITY_FIELD.test(key) ? context.scope : undefined, stateReferenceField ? key : undefined);
				} else learnAt(value, other, context, {
					at: childPointer(place.at, key),
					own: false
				});
			}
		};
		learnIds = (live, env, map, known) => learnAt(live, env, {
			map,
			heldIds: known.heldIds,
			scope: known.scope,
			entityAt: known.entityAt ?? "",
			identity: known.identity === true
		}, {
			at: "",
			own: false
		});
		inEnvTerms = (value, env) => {
			if (env === undefined) return value;
			return typeof value === "string" ? String(env) : typeof env === "number" ? env : value;
		};
		translateValue = (value, map) => {
			if (Array.isArray(value)) return value.map((item) => translateValue(item, map));
			if (isObject$1(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, translateValue(item, map)]));
			return isScalarId(value) ? inEnvTerms(value, map.env(value)) : value;
		};
		translateBulkBody = (body, map, bulk) => {
			const { address, idField, scope } = bulk;
			const id = (value) => isScalarId(value) ? inEnvTerms(value, map.env(value, scope)) : value;
			const entries = (value) => Array.isArray(value) ? value.map((entry) => address.by === "ids" ? id(entry) : isObject$1(entry) && Object.hasOwn(entry, idField) ? {
				...translateValue(entry, map),
				[idField]: id(entry[idField])
			} : translateValue(entry, map)) : translateValue(value, map);
			if (address.member === null) return entries(body);
			return isObject$1(body) ? Object.fromEntries(Object.entries(body).map(([key, value]) => [key, key === address.member ? entries(value) : translateValue(value, map)])) : translateValue(body, map);
		};
		environmentArguments = (call, map, bulk) => Object.fromEntries(Object.entries(call.args).map(([name, value]) => [name, call.pathArguments.includes(name) || call.pagingArguments.includes(name) ? value : bulk !== undefined && name === bulk.body ? translateBulkBody(value, map, bulk) : translateValue(value, map)]));
		translatePath = (path, map, scopeAt = () => undefined, literalAt = () => false) => path.split("/").map((segment, index) => {
			const position = index - 1;
			if (literalAt(position)) return segment;
			let decoded = segment;
			try {
				decoded = decodeURIComponent(segment);
			} catch {
				return segment;
			}
			const env = decoded === "" ? undefined : map.env(decoded, scopeAt(position));
			return env === undefined ? segment : encodeURIComponent(String(env));
		}).join("/");
	})))();
}

//#endregion
//#region dist/application/environment/environmentCompareDiff.js
var DIFFERENCE_CATEGORIES, STEP_DIFFERENCE_LIMIT, VALUE_CHARS, TIME_FIELD, TIME_FIELD_CAMEL, ID_LIST_FIELD, isObject, shown, escapePointer, formatKey, clockReading, characterClasses, generatedPair, Differ, compareAnswers;
function init_environmentCompareDiff() {
	return (init_environmentCompareDiff = __esmMin((() => {
		init_environmentStateWriteClockFormats();
		init_environmentStateWriteComposed();
		init_environmentStateWriteValues();
		init_environmentCompareIds();
		DIFFERENCE_CATEGORIES = [
			"status",
			"missing-field",
			"extra-field",
			"value",
			"length",
			"order",
			"clock-format",
			"refused",
			"not-served",
			"no-tool",
			"unmapped-id"
		];
		STEP_DIFFERENCE_LIMIT = 20;
		VALUE_CHARS = 120;
		TIME_FIELD = /(?:^|[_-])(?:at|time|date|timestamp|created|updated|modified)$/iu;
		TIME_FIELD_CAMEL = /(?:At|Time|Date|Timestamp|Created|Updated|Modified)$/u;
		ID_LIST_FIELD = /^(ids|uuids|guids)$/u;
		isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		shown = (value) => {
			const text = value === undefined ? "<absent>" : JSON.stringify(value);
			return text.length > VALUE_CHARS ? `${text.slice(0, VALUE_CHARS)}…` : text;
		};
		escapePointer = (key) => key.replaceAll("~", "~0").replaceAll("/", "~1");
		formatKey = (format) => format.kind === "epoch" ? `epoch-${format.unit}` : `iso${format.separator}${String(format.fraction)}${format.zone === "" ? "" : format.zone === "Z" ? "Z" : "offset"}`;
		clockReading = (value, key) => {
			if (typeof value === "number" && (key === undefined || !TIME_FIELD.test(key) && !TIME_FIELD_CAMEL.test(key))) return undefined;
			return readClock(value);
		};
		characterClasses = (text) => [...new Set(text.replaceAll(/\d/gu, "0").replaceAll(/[a-z]/gu, "a").replaceAll(/[A-Z]/gu, "A"))].sort().join("");
		generatedPair = (live, env, generation) => {
			if (generation === undefined) return false;
			const { rule, pointer } = generation;
			if (rule.rule === "unique" && pointer === "" && likeGeneratedInteger(live, env)) return true;
			if (typeof live !== "string" || typeof env !== "string") return false;
			if (rule.rule === "renewed") return rule.pointers.includes(pointer) && isUuid(live) && isUuid(env);
			if (pointer !== "") return false;
			if (rule.rule === "unique" || rule.rule === "identity" && rule.generator === "uuid") return isUuid(live) && isUuid(env);
			if (rule.rule !== "sequence" && rule.rule !== "identity") return false;
			return live.length === env.length && live.length >= 8 && /\d/u.test(live) && /\d/u.test(env) && characterClasses(live) === characterClasses(env);
		};
		Differ = class {
			map;
			entity;
			#rules;
			#composedRules;
			#generatedToEnv = new Map();
			#generatedToLive = new Map();
			differences = [];
			normalised = {
				ids: 0,
				clocks: 0,
				generated: 0,
				large_bodies: 0,
				unobserved_bodies: 0
			};
			/** The answer's own entities: where they sit (the object, or the array of them, at `at`) and the collection the call names, whose own mapping their identities compare by. `identity` marks a write that answers with only the new id, at `at`. */
			constructor(map, entity) {
				this.map = map;
				this.entity = entity;
				this.#rules = new Map(entity.rules.map((rule) => [rule.field, rule]));
				this.#composedRules = entity.rules.filter((rule) => rule.rule === "composed");
			}
			add(difference) {
				this.differences.push(difference);
			}
			/** One answer's generated identities must rename consistently in both directions. */
			#pairGenerated(live, env, rule) {
				const uuid = rule.rule === "unique" || rule.rule === "renewed" || rule.rule === "identity" && rule.generator === "uuid";
				const identity = (value) => typeof value === "number" ? `number:${String(value)}` : uuid ? `uuid:${value.toLowerCase()}` : `string:${value}`;
				const liveKey = identity(live);
				const envKey = identity(env);
				const knownEnv = this.#generatedToEnv.get(liveKey);
				const knownLive = this.#generatedToLive.get(envKey);
				if (knownEnv !== undefined && knownEnv !== envKey || knownLive !== undefined && knownLive !== liveKey) return false;
				this.#generatedToEnv.set(liveKey, envKey);
				this.#generatedToLive.set(envKey, liveKey);
				return true;
			}
			/** Whether a value compares within the call's collection, as an entity's own identity or a create's bare id does; other ids compare by the probe's mapping. */
			#inCollection(pointer, at) {
				return this.entity.identity && pointer === this.entity.at || at.own === true && at.key !== undefined && IDENTITY_FIELD.test(at.key);
			}
			/** Whether an identity both sides hold verbatim is one its collection's mapping gives to another environment entity; a reference's collection is unknown, so it is not judged. */
			#reassigned(value, pointer, at) {
				if (typeof value !== "string" && typeof value !== "number") return false;
				if (!this.#inCollection(pointer, at)) return false;
				const mapped = this.map.env(value, this.entity.scope);
				return mapped !== undefined && String(mapped) !== String(value);
			}
			scalar(live, env, pointer, at = {}, generation) {
				const key = at.clockKey ?? at.key;
				const liveClock = clockReading(live, key);
				const envClock = clockReading(env, key);
				const generatedMatch = generation !== undefined && (typeof live === "string" || typeof live === "number") && (typeof env === "string" || typeof env === "number") && liveClock === undefined && envClock === undefined && !this.map.hasLive(live) && !this.map.hasEnv(env) && generatedPair(live, env, generation) ? this.#pairGenerated(live, env, generation.rule) : undefined;
				if (live === env) {
					if (generatedMatch === false || this.#reassigned(live, pointer, at)) this.add({
						category: "value",
						pointer,
						live: shown(live),
						env: shown(env)
					});
					return;
				}
				const field = at.key;
				if ((typeof live === "string" || typeof live === "number") && (typeof env === "string" || typeof env === "number")) {
					const mapsAsId = field !== undefined && ID_FIELD.test(field) || this.#inCollection(pointer, at) || typeof live === "string" && field !== undefined && this.map.isStateReference(live, field);
					const mapped = mapsAsId ? this.map.env(live, this.#inCollection(pointer, at) ? this.entity.scope : undefined) : undefined;
					if (mapped !== undefined && String(mapped) === String(env)) {
						this.normalised.ids += 1;
						return;
					}
					if (liveClock !== undefined && envClock !== undefined) {
						const rule = generation?.pointer === "" ? generation.rule : undefined;
						const format = rule?.rule === "clock" || rule?.rule === "held-clock" ? rule.format : undefined;
						const matches = format?.kind === "iso" && format.trimmed === true ? matchesClockFormat(format, liveClock) && matchesClockFormat(format, envClock) : formatKey(liveClock.format) === formatKey(envClock.format);
						if (matches) this.normalised.clocks += 1;
						else this.add({
							category: "clock-format",
							pointer,
							live: shown(live),
							env: shown(env)
						});
						return;
					}
					if (generatedMatch === true) {
						this.normalised.generated += 1;
						return;
					}
				}
				this.add({
					category: "value",
					pointer,
					live: shown(live),
					env: shown(env)
				});
			}
			array(live, env, pointer, clockKey, generation) {
				const own = pointer === this.entity.at;
				if (this.sameItems(live, env, pointer)) {
					if (generation !== undefined) for (const [index, item] of live.entries()) this.scalar(item, item, `${pointer}/${String(index)}`, {
						own,
						clockKey
					}, {
						...generation,
						pointer: `${generation.pointer}/*`
					});
					return;
				}
				const pairs = pairElements(live, env);
				if (live.length !== env.length || pairs.length !== live.length) this.add({
					category: "length",
					pointer,
					live: `${String(live.length)} items`,
					env: `${String(env.length)} items (${String(pairs.length)} paired)`
				});
				const envOrder = pairs.map(([, right]) => right);
				if (envOrder.some((right, index) => index > 0 && right < envOrder[index - 1])) this.add({
					category: "order",
					pointer
				});
				for (const [left, right] of pairs) this.value(live[left], env[right], `${pointer}/${String(left)}`, {
					own,
					clockKey
				}, generation === undefined ? undefined : {
					...generation,
					pointer: `${generation.pointer}/*`
				});
			}
			/** Arrays of scalars holding the same items in another order differ only in order, as sets an application returns unordered do. */
			sameItems(live, env, pointer) {
				const scalar = (item) => item === null || typeof item !== "object";
				if (live.length !== env.length || !live.every(scalar) || !env.every(scalar)) return false;
				const field = pointer.slice(pointer.lastIndexOf("/") + 1);
				const mapped = live.map((item) => {
					if (typeof item === "string" && this.map.isStateReference(item, field) || (typeof item === "number" || typeof item === "string") && ID_LIST_FIELD.test(field)) return translateValue(item, this.map);
					return item;
				});
				const key = (items) => JSON.stringify(items.map((item) => JSON.stringify(item)).sort());
				if (key(mapped) !== key(env)) return false;
				this.normalised.ids += mapped.filter((item, index) => item !== live[index]).length;
				if (JSON.stringify(mapped) !== JSON.stringify(env)) this.add({
					category: "order",
					pointer
				});
				return true;
			}
			object(live, env, pointer, own = false, generation) {
				const self = own || pointer === this.entity.at;
				const keyed = keyedByLearnedIds(live, env, this.map);
				const envKey = (key) => {
					const mapped = keyed ? this.map.env(key, self ? this.entity.scope : undefined) : undefined;
					return mapped !== undefined && Object.hasOwn(env, String(mapped)) ? String(mapped) : key;
				};
				const matched = new Set();
				const composed = self && this.#composedRules.length > 0 ? {
					agreed: new Set(),
					fields: new Map()
				} : undefined;
				for (const [key, value] of Object.entries(live)) {
					const child = `${pointer}/${escapePointer(key)}`;
					const other = envKey(key);
					if (!Object.hasOwn(env, other)) this.add({
						category: "missing-field",
						pointer: child,
						live: shown(value)
					});
					else {
						matched.add(other);
						const rule = self ? this.#rules.get(key) : undefined;
						if (rule?.rule === "composed" && composed !== undefined) {
							composed.fields.set(key, other);
							continue;
						}
						const before = this.differences.length;
						this.value(value, env[other], child, {
							key,
							own: self,
							keyed: self && keyed
						}, rule !== undefined ? {
							rule,
							pointer: ""
						} : generation === undefined ? undefined : {
							...generation,
							pointer: `${generation.pointer}/${escapePointer(key)}`
						});
						if (this.differences.length === before) composed?.agreed.add(key);
					}
				}
				if (composed !== undefined) {
					for (const rule of this.#composedRules) {
						const other = composed.fields.get(rule.field);
						if (other === undefined) continue;
						const coherent = composedValue(rule.parts, live) === live[rule.field] && composedValue(rule.parts, env) === env[other];
						if (coherent && rule.parts.every((part) => !("from" in part) || composed.agreed.has(part.from) || composedPartText(part, live) === composedPartText(part, env))) {
							composed.agreed.add(rule.field);
							if (live[rule.field] !== env[other]) this.normalised.generated += 1;
						} else this.add({
							category: "value",
							pointer: `${pointer}/${escapePointer(rule.field)}`,
							live: shown(live[rule.field]),
							env: shown(env[other])
						});
					}
				}
				for (const [key, value] of Object.entries(env)) if (!matched.has(key)) this.add({
					category: "extra-field",
					pointer: `${pointer}/${escapePointer(key)}`,
					env: shown(value)
				});
			}
			/** `own` marks an item of the entity array, or with `key` a field of an own entity; a field's own children are not. */
			value(live, env, pointer, at = {}, generation) {
				if (Array.isArray(live) && Array.isArray(env)) this.array(live, env, pointer, at.clockKey ?? at.key, generation);
				else if (isObject(live) && isObject(env)) this.object(live, env, pointer, at.own === true && (at.key === undefined || at.keyed === true), generation);
				else if (Array.isArray(live) || Array.isArray(env) || isObject(live) || isObject(env)) this.add({
					category: "value",
					pointer,
					live: shown(live),
					env: shown(env)
				});
				else this.scalar(live, env, pointer, at, generation);
			}
		};
		compareAnswers = (live, env, map, entity = {}) => {
			const differ = new Differ(map, {
				scope: entity.scope,
				at: entity.at ?? "",
				identity: entity.identity === true,
				rules: entity.rules ?? []
			});
			if (live.status !== env.status) differ.add({
				category: "status",
				pointer: "",
				live: String(live.status),
				env: String(env.status)
			});
			if (live.body.kind === "cut" || live.body.kind === "base64" && !live.body.whole) differ.normalised.large_bodies += 1;
			else if (live.unobserved === true) differ.normalised.unobserved_bodies += 1;
			else if (live.body.kind === "none" && env.body.kind === "json" && env.body.value === null || env.body.kind === "none" && live.body.kind === "json" && live.body.value === null) {} else if (live.body.kind === "base64" || env.body.kind === "base64") {
				const bytes = (body) => {
					if (body.kind === "base64") return Buffer.from(body.encoded, "base64");
					if (body.kind === "text") return Buffer.from(body.text, "utf8");
					return undefined;
				};
				const liveBytes = bytes(live.body);
				const envBytes = bytes(env.body);
				if (liveBytes === undefined || envBytes === undefined || !liveBytes.equals(envBytes)) differ.add({
					category: "value",
					pointer: "",
					live: shown(live.body),
					env: shown(env.body)
				});
			} else if (live.body.kind !== env.body.kind) differ.add({
				category: "value",
				pointer: "",
				live: shown(live.body),
				env: shown(env.body)
			});
			else if (live.body.kind === "json" && env.body.kind === "json") differ.value(live.body.value, env.body.value, "");
			else if (live.body.kind === "text" && env.body.kind === "text") differ.value(live.body.text, env.body.text, "");
			return {
				differences: differ.differences,
				normalised: differ.normalised
			};
		};
	})))();
}

//#endregion
//#region dist/application/environment/environmentCompareMatch.js
var FORMAT_RULES, collectionAt, collectionScope, bulkIds, parameterScopes, literalPositions, fitOf, probeArguments, bodyTools, matchProbeRequest;
function init_environmentCompareMatch() {
	return (init_environmentCompareMatch = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteAddress();
		init_environmentStatePaging();
		init_webNetworkRouteTemplates();
		init_environmentTools();
		FORMAT_RULES = new Set([
			"numeric",
			"uuid",
			"hex",
			"iso-date"
		]);
		collectionAt = (tool, end, segments) => {
			const params = new Set(tool.params.map((param) => param.index));
			return `/${tool.path_template.slice(1).split("/").slice(0, end).map((segment, index) => {
				if (!params.has(index)) return segment;
				const value = segments?.[index];
				return value === undefined || value === "" ? "{}" : encodeURIComponent(decodedSegment(value));
			}).join("/")}`;
		};
		collectionScope = (tool, segments) => {
			const length = tool.path_template.slice(1).split("/").length;
			return collectionAt(tool, tool.params.some((param) => param.index === length - 1) ? length - 1 : length, segments);
		};
		bulkIds = (run, call, segments) => {
			const plan = run.store?.state.writes.get(call.tool.name);
			const target = plan?.target ?? null;
			const address = plan?.address;
			const body = probeArguments(call.tool, run.bodies).body;
			if (target === null || address === undefined || address.by === "action" || body === undefined) return undefined;
			const scope = collectionAt(call.tool, segmentsOf(target).length, segments);
			return {
				body,
				address,
				idField: run.store?.type(target)?.id_field ?? "",
				scope: `/${bulkCollectionOf(target, scope.slice(1).split("/"), (text) => text).join("/")}`
			};
		};
		parameterScopes = (tool, segments) => new Map(tool.params.map((param) => [param.index, collectionAt(tool, param.index, segments)]));
		literalPositions = (tool) => {
			const params = new Set(tool.params.map((param) => param.index));
			return new Set(tool.path_template.slice(1).split("/").flatMap((_, index) => params.has(index) ? [] : [index]));
		};
		fitOf = (tool, segments) => {
			const template = tool.path_template.slice(1).split("/");
			if (template.length !== segments.length) return undefined;
			const params = new Map(tool.params.map((param) => [param.index, param]));
			let literals = 0;
			for (const [index, part] of template.entries()) {
				const segment = segments[index];
				const param = params.get(index);
				if (param === undefined) {
					if (part !== segment && part !== decodedSegment(segment)) return undefined;
					literals += 1;
				} else if (FORMAT_RULES.has(param.rule) && segmentRule(decodedSegment(segment)) !== param.rule) return undefined;
				else if (segment === "") return undefined;
			}
			return {
				tool,
				literals
			};
		};
		probeArguments = (tool, bodies) => environmentToolArguments(tool, bodies.has(tool.name) ? true : undefined);
		bodyTools = (definitions) => new Set(definitions.flatMap((definition) => Object.hasOwn(definition.inputSchema.properties, environmentToolArguments(definition.tool, true).body) ? [definition.name] : []));
		matchProbeRequest = (manifest, request, bodies = new Set()) => {
			const segments = request.path.slice(1).split("/");
			let best;
			for (const tool of manifest.tools) {
				if (tool.method !== request.method) continue;
				const fit = fitOf(tool, segments);
				if (fit !== undefined && (best === undefined || fit.literals > best.literals)) best = fit;
			}
			if (best === undefined) return undefined;
			const { tool } = best;
			const names = probeArguments(tool, bodies);
			const args = {};
			const pathArguments = [];
			for (const param of tool.params) {
				const name = names.path.get(param.name) ?? param.name;
				args[name] = segments[param.index];
				pathArguments.push(name);
			}
			const ignoredQuery = [];
			const pagingArguments = [];
			const queryValues = new Map();
			if (request.query !== null) for (const [key, value] of new URLSearchParams(request.query.slice(1))) {
				const name = names.query.get(key);
				if (name === undefined) ignoredQuery.push(key);
				else {
					const values = queryValues.get(name) ?? [];
					values.push(value);
					queryValues.set(name, values);
					if (isPagingParameter(key)) pagingArguments.push(name);
				}
			}
			for (const [name, values] of queryValues) args[name] = values.length === 1 ? values[0] : values;
			if (names.body !== undefined && request.body !== undefined) args[names.body] = request.body;
			return {
				tool,
				args,
				pathArguments,
				pagingArguments,
				ignoredQuery,
				observedQuery: request.query
			};
		};
	})))();
}

//#endregion
//#region dist/application/environment/environmentCompareProbe.js
var BODYLESS_STATUSES, startedSchema, postDataSchema, methodSchema, startedInstant, sendsBodies, requestBody, liveAnswer, probeOrigin, probeRequests;
function init_environmentCompareProbe() {
	return (init_environmentCompareProbe = __esmMin((() => {
		init_EnvironmentManifestAccumulator();
		init_environmentManifestOrigin();
		init_webNetworkRouteTemplates();
		init_exactJsonNumber();
		init_offsetDateTime();
		init_environmentSource();
		BODYLESS_STATUSES = new Set([
			204,
			205,
			304
		]);
		startedSchema = z.object({ startedDateTime: z.string() });
		postDataSchema = z.object({ request: z.object({ postData: z.object({
			mimeType: z.string(),
			text: z.string()
		}) }) });
		methodSchema = z.object({ request: z.object({ method: z.string() }) });
		startedInstant = (record) => {
			const started = startedSchema.safeParse(record.reported);
			if (!started.success) return undefined;
			const reading = readRecordedDateTime(started.data.startedDateTime);
			if (reading !== undefined) {
				const { spelling } = reading;
				const offsetTimestamp = spelling.separator === "T" && (spelling.zone === "Z" || spelling.zone.includes(":"));
				const clockTimestamp = spelling.secondsPresent && spelling.fractionDigits <= 9;
				if (offsetTimestamp || clockTimestamp) return reading.instant;
			}
			const ms = Date.parse(started.data.startedDateTime);
			return Number.isFinite(ms) ? offsetDateTimeInstantFromEpochMilliseconds(ms) : undefined;
		};
		sendsBodies = (records) => records.some((record) => {
			const parsed = methodSchema.safeParse(record.reported);
			return parsed.success && [
				"POST",
				"PUT",
				"PATCH"
			].includes(parsed.data.request.method);
		});
		requestBody = (record) => {
			const parsed = postDataSchema.safeParse(record.reported);
			if (!parsed.success) return undefined;
			const { mimeType, text } = parsed.data.request.postData;
			return isJsonLike(mediaTypeEssence(mimeType)) ? parseExactJson(text) ?? text : text;
		};
		liveAnswer = (method, status, body) => {
			if (body.kind === "none") return method === "HEAD" || BODYLESS_STATUSES.has(status) ? {
				status,
				body
			} : {
				status,
				body,
				unobserved: true
			};
			if (body.kind === "text" && body.text === "") return {
				status,
				body: { kind: "none" }
			};
			return {
				status,
				body
			};
		};
		probeOrigin = (lines) => {
			const origins = new Map();
			for (const line of lines.values()) {
				if (line?.kind !== "line") continue;
				const stats = origins.get(line.origin) ?? {
					records: 0,
					jsonLike: 0
				};
				stats.records += 1;
				if (isJsonLike(mediaTypeEssence(line.rawMime))) stats.jsonLike += 1;
				origins.set(line.origin, stats);
			}
			return primaryOrigin(origins);
		};
		probeRequests = (records) => {
			const steps = [];
			const unobserved = [];
			const starts = new Map(records.map((record) => [record.ordinal, startedInstant(record)]));
			const timed = [...starts.values()].every((instant) => instant !== undefined);
			const ordered = [...records].sort((left, right) => (timed ? compareOffsetDateTimeInstants(starts.get(left.ordinal), starts.get(right.ordinal)) : 0) || left.ordinal - right.ordinal);
			const lines = new Map(records.map((record) => [record.ordinal, readRecordedRequestLine(record.reported, true, () => true)]));
			const origin = probeOrigin(lines);
			for (const record of ordered) {
				const line = lines.get(record.ordinal);
				const { ordinal } = record;
				if (line?.kind === "line" && line.origin !== origin) unobserved.push({
					ordinal,
					reason: "other-origin"
				});
				else if (line?.kind !== "line") unobserved.push({
					ordinal,
					reason: line?.kind === "excluded" ? line.reason : "request-unavailable"
				});
				else {
					const exchange = recordedExchange(record, line);
					const request = {
						method: line.method,
						path: exchange.path,
						query: exchange.query,
						body: requestBody(record)
					};
					if (exchange.status === null) {
						unobserved.push({
							ordinal,
							reason: "no-response"
						});
						steps.push({
							ordinal,
							request
						});
					} else steps.push({
						ordinal,
						request,
						live: liveAnswer(line.method, exchange.status, replayedBody(exchange))
					});
				}
			}
			return {
				steps,
				unobserved
			};
		};
	})))();
}

//#endregion
//#region dist/application/environment/environmentCompare.js
var NORMALISED_KEYS, emptyNormalised, isSuccess, entityOf, fromState, identityValue, envBody, answersCall, inputCheck, heldIds, stepOf, compareStep, probeReport, summaryOf, toolsOf, compareEnvironment;
function init_environmentCompare() {
	return (init_environmentCompare = __esmMin((() => {
		init_environmentStateRules();
		init_result();
		init_environmentCompareDiff();
		init_environmentCompareIds();
		init_environmentCompareMatch();
		init_environmentCompareProbe();
		init_environmentSource();
		init_environmentReplay();
		init_environmentState();
		init_environmentStateStore();
		init_environmentToolAnswer();
		NORMALISED_KEYS = [
			"ids",
			"clocks",
			"generated",
			"large_bodies",
			"unobserved_bodies"
		];
		emptyNormalised = () => ({
			ids: 0,
			clocks: 0,
			generated: 0,
			large_bodies: 0,
			unobserved_bodies: 0
		});
		isSuccess = (status) => status !== null && status >= 200 && status < 300;
		entityOf = (run, tool, segments, answer) => {
			const view = run.store?.state.views.get(tool.name);
			const plan = run.store?.state.writes.get(tool.name);
			const response = plan?.response;
			const scope = collectionScope(tool, segments);
			if (view?.shape === "item" || view?.shape === "list") return {
				scope,
				at: view.pointer,
				identity: false,
				rules: []
			};
			const identity = response?.shape === "identity";
			const at = identity ? response.pointer ?? "" : response?.pointer ?? plan?.observation?.pointer ?? "";
			const provenance = answer.state;
			const renderedWrite = provenance?.source === "state" && (provenance.view === "create" || provenance.view === "update" || provenance.view === "document-write" || provenance.view === "delete");
			const rules = plan?.served === true && response?.shape === "entity" && renderedWrite ? plan.rules : [];
			return {
				scope,
				at,
				identity,
				rules
			};
		};
		fromState = (answer) => {
			const state = answer.state;
			return state?.source === "state" && state.view !== "missing";
		};
		identityValue = (body) => {
			if (body.kind === "json") return body.value;
			if (body.kind === "text") return body.text;
			return undefined;
		};
		envBody = (run, answer) => {
			if (fromState(answer)) return {
				kind: "json",
				value: answer.body
			};
			const exchange = run.source.exchanges.get(answer.replay.record_ordinal);
			if (exchange === undefined) return answer.body === "" ? { kind: "none" } : {
				kind: "json",
				value: answer.body
			};
			const body = replayedBody(exchange);
			if (body.kind === "text" && body.text === "") return { kind: "none" };
			if (body.kind === "json") return {
				kind: "json",
				value: answer.body
			};
			if (body.kind === "text") return {
				kind: "text",
				text: typeof answer.body === "string" ? answer.body : body.text
			};
			if (body.kind === "base64") return {
				...body,
				encoded: typeof answer.body === "string" ? answer.body : body.encoded,
				whole: body.whole && !answer.replay.truncated
			};
			if (body.kind === "cut") return {
				kind: "cut",
				text: typeof answer.body === "string" ? answer.body : body.text
			};
			return body;
		};
		answersCall = (run, call, args, answer) => {
			if (fromState(answer)) return true;
			const exchange = run.source.exchanges.get(answer.replay.record_ordinal);
			if (!answer.replay.exact_match || exchange === undefined || !selectsRecordedLine(call.tool, exchange, args)) return false;
			const body = probeArguments(call.tool, run.bodies).body;
			if (body === undefined) return true;
			return same(run.recordedBodies.get(exchange.ordinal), args[body]);
		};
		inputCheck = (definition) => {
			const schema = fromJsonSchema(definition.inputSchema)["~standard"];
			return (args) => {
				const checked = schema.validate(args);
				return checked instanceof Promise ? undefined : checked.issues?.[0]?.message;
			};
		};
		heldIds = (store) => new Set(store?.snapshot().rea_state.entities.map((entity) => entity.id) ?? []);
		stepOf = (base, call, outcome) => {
			const categories = [...new Set(outcome.differences.map((d) => d.category))];
			return {
				...base,
				tool: call?.tool.name ?? null,
				env_status: outcome.env_status,
				equal: outcome.differences.length === 0,
				equal_ignoring_order: outcome.differences.every((difference) => difference.category === "order"),
				categories,
				differences: outcome.differences.slice(0, 20),
				ignored_query: [...call?.ignoredQuery ?? []]
			};
		};
		compareStep = (run, manifest, probe) => {
			const { request, live } = probe;
			const base = {
				ordinal: probe.ordinal,
				method: request.method,
				path: request.path,
				live_status: live?.status ?? null
			};
			const report = (call, outcome) => live === undefined ? undefined : stepOf(base, call, outcome);
			const liveSegments = request.path.slice(1).split("/");
			const fitted = matchProbeRequest(manifest, request, run.bodies);
			const scopes = fitted === undefined ? undefined : parameterScopes(fitted.tool, liveSegments);
			const literals = fitted === undefined ? undefined : literalPositions(fitted.tool);
			const path = translatePath(request.path, run.map, (index) => scopes?.get(index), (index) => literals?.has(index) === true);
			const call = matchProbeRequest(manifest, {
				...request,
				path
			}, run.bodies);
			if (call === undefined) return report(call, {
				env_status: null,
				differences: [{
					category: "no-tool",
					pointer: ""
				}]
			});
			const check = run.served.get(call.tool.name);
			if (check === undefined) return report(call, {
				env_status: null,
				differences: [{
					category: "not-served",
					pointer: ""
				}]
			});
			const held = heldIds(run.store);
			const unknownPath = call.pathArguments.some((name) => {
				const value = call.args[name];
				if (typeof value !== "string") return false;
				const id = decodedSegment(value);
				return !run.map.hasEnv(id) && !held.has(id);
			});
			const refusedWith = (message) => report(call, {
				env_status: null,
				differences: [{
					category: "refused",
					pointer: "",
					env: message.slice(0, 200)
				}]
			});
			const bulk = bulkIds(run, call, liveSegments);
			const args = environmentArguments(call, run.map, bulk);
			const problem = check(args);
			if (problem !== undefined) return refusedWith(`Invalid arguments: ${problem}`);
			const answered = run.answer(call.tool, args, call.observedQuery);
			if (!answered.ok) return refusedWith(answered.error.message);
			if (live === undefined) return undefined;
			const env = {
				status: answered.value.status,
				body: envBody(run, answered.value)
			};
			const entity = entityOf(run, call.tool, liveSegments, answered.value);
			if (answersCall(run, call, args, answered.value)) learnIds(identityValue(live.body), identityValue(env.body), run.map, {
				heldIds: heldIds(run.store),
				scope: entity.scope,
				entityAt: entity.at,
				identity: entity.identity
			});
			const compared = compareAnswers(live, env, run.map, entity);
			for (const key of NORMALISED_KEYS) run.normalised[key] += compared.normalised[key];
			const differences = [...compared.differences];
			if (unknownPath && isSuccess(live.status) && !isSuccess(env.status)) differences.unshift({
				category: "unmapped-id",
				pointer: ""
			});
			return stepOf(base, call, {
				env_status: env.status,
				differences
			});
		};
		probeReport = (probe, run, results, unobserved) => ({
			label: probe.label,
			evidence_id: probe.evidenceId,
			steps: results.length,
			equal: results.filter((step) => step.equal).length,
			ids_mapped: run.map.size,
			id_conflicts: run.map.conflicts,
			normalised: run.normalised,
			results,
			unobserved
		});
		summaryOf = (probes) => {
			const steps = probes.flatMap((probe) => probe.results);
			const categories = Object.fromEntries(DIFFERENCE_CATEGORIES.map((category) => [category, 0]));
			for (const step of steps) for (const category of step.categories) categories[category] += 1;
			const equal = steps.filter((step) => step.equal).length;
			const ratio = (count) => steps.length === 0 ? null : Math.round(count / steps.length * 1e3) / 1e3;
			const normalised = emptyNormalised();
			for (const probe of probes) for (const key of NORMALISED_KEYS) normalised[key] += probe.normalised[key];
			return {
				probes: probes.length,
				steps: steps.length,
				equal,
				agreement: ratio(equal),
				agreement_ignoring_order: ratio(steps.filter((step) => step.equal_ignoring_order).length),
				unobserved: probes.reduce((sum, probe) => sum + probe.unobserved.length, 0),
				categories,
				normalised
			};
		};
		toolsOf = (probes) => {
			const tools = new Map();
			for (const step of probes.flatMap((probe) => probe.results)) {
				if (step.tool === null) continue;
				const entry = tools.get(step.tool) ?? {
					tool: step.tool,
					steps: 0,
					equal: 0
				};
				entry.steps += 1;
				if (step.equal) entry.equal += 1;
				tools.set(step.tool, entry);
			}
			return [...tools.values()].sort((left, right) => left.equal / left.steps - right.equal / right.steps || (left.tool < right.tool ? -1 : 1));
		};
		compareEnvironment = (input) => {
			const { source, operation } = input;
			const state = prepareServedState(source, input.captureValue, { operation }).state;
			const catalog = servedCatalog(source, state, source.manifest.name, operation);
			if (!catalog.ok) return catalog;
			const served = new Map(catalog.value.tools.map((definition) => [definition.name, inputCheck(definition)]));
			const bodies = bodyTools(catalog.value.tools);
			const recorded = parseCaptureEvidence(operation, input.captureValue, "manifest");
			const recordedBodies = new Map(recorded.ok ? recorded.value.records.map((record) => [record.ordinal, requestBody(record)]) : []);
			const probes = [];
			for (const [index, probe] of input.probes.entries()) {
				const capture = parseCaptureEvidence(operation, probe.value, "manifest");
				const problem = !capture.ok ? capture.error.message : !capture.value.responseBodies ? "a browser probe needs capture.network.response_body selected, or only statuses would compare." : !capture.value.requestBodies && sendsBodies(capture.value.records) ? "a browser probe that makes POST, PUT or PATCH calls needs capture.network.request_body selected, or those calls would be made without their bodies." : undefined;
				if (!capture.ok || problem !== undefined) return err(inputError(operation, [{
					path: ["probe", index],
					reason: "invalid_value",
					message: `${probe.label}: ${problem}`
				}], "A probe file cannot be compared."));
				const store = state === undefined ? undefined : new EnvironmentStateStore(state);
				const run = {
					source,
					recordedBodies,
					answer: environmentToolAnswer(source, store),
					store,
					served,
					bodies,
					map: new IdMap(),
					normalised: emptyNormalised()
				};
				const { steps, unobserved } = probeRequests(capture.value.records);
				const results = steps.flatMap((step) => compareStep(run, source.manifest, step) ?? []);
				probes.push(probeReport({
					label: probe.label,
					evidenceId: capture.value.evidenceId
				}, run, results, unobserved));
			}
			return ok({
				status: "complete",
				environment: {
					name: source.manifest.name,
					manifest_evidence_id: source.manifestEvidenceId,
					evidence_id: source.evidenceId,
					state: state === undefined ? "replay-only" : "served"
				},
				summary: summaryOf(probes),
				tools: toolsOf(probes),
				probes
			});
		};
	})))();
}

//#endregion
init_environmentCompare();
export { compareEnvironment };