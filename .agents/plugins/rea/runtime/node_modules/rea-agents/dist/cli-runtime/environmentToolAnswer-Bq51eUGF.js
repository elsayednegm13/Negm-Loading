import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { init_recordedTransportUrl, iterateUrlQueryParameters, recordedPathSegments } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { allLines, bodyProblem, bulkCollectionOf, callRenewal, collectionMatch, collectionPathOf, createdFields, decodedSegment, documentBodyProblem, evaluateQuery, formatClock, generatedIntegerDigits, init_EnvironmentStateAccumulator, init_environmentStateListQuery, init_environmentStatePaging, init_environmentStateRules, init_environmentStateVariants, init_environmentStateWriteAddress, init_environmentStateWriteApply, init_environmentStateWriteChecks, init_environmentStateWriteExplain, init_environmentStateWriteGenerated, init_environmentStateWriteLinks, init_environmentStateWriteObserve, init_environmentStateWriteRules, init_environmentStateWriteStamps, init_environmentStateWriteValues, insertIndex, isAbsence, isObject, linkedCollection, listItems, listsAll, missingRequiredFields, namedEntities, nestedClockValue, nextInteger, optionalFields, pageBound, pagesOnly, pathSegmentMatches, pathValuesOf, pinnedQuery, renderQueryList, renderStateEntity, renderStateList, renewUuids, replaceAt, replayReason, sameLinkedSource, scalarText, seededInteger, seededLike, segmentsOf, selectedCollection, spelledLike, stateBodyJson, unenveloped, updatedEntity, updatedFields, valueAt, withRead, writtenBulkResponse, writtenDocument, writtenResponse } from "./analysisView-DxQriOKj.js";
import { AnalysisInputError, AnalysisResourceConstraintError, err, init_analysisErrorCore, init_jsonSerialization, init_result, jsonByteLength, ok } from "./jsonLines-Gf10X4s1.js";
import { ENVIRONMENT_SERVE_OPERATION, REPLAY_BODY_LIMIT_BYTES, init_environmentSource, replayedBody } from "./environmentSource-BU4MlUgQ.js";
import { environmentToolArguments, hasRepeatedQueryArgument, init_environmentStateDocument, init_environmentTools, isLoadableValue, unloadableMember } from "./environmentState-UIc1qofA.js";

//#region dist/application/environment/environmentReplay.js
var scoreExchange, outranks, selectReplayExchange, selectsRecordedLine, utf8Prefix, BASE64_LIMIT_CHARS, replayBody, REPLAY_METADATA_LIMIT_BYTES, replayEnvironmentTool, replayAnswer;
function init_environmentReplay() {
	return (init_environmentReplay = __esmMin((() => {
		init_analysisErrorCore();
		init_environmentStateRules();
		init_recordedTransportUrl();
		init_result();
		init_environmentTools();
		init_environmentSource();
		scoreExchange = (tool, pathArguments, queryArguments, exchange, args, observedQuery) => {
			const providedPaths = [];
			for (const param of tool.params) {
				const value = args[pathArguments.get(param.name) ?? param.name];
				if (typeof value === "string") providedPaths.push({
					index: param.index,
					value
				});
			}
			const segments = providedPaths.length === 0 ? new Map() : recordedPathSegments(exchange.path, providedPaths.map((param) => param.index));
			const pathProvided = providedPaths.length;
			let pathMatches = 0;
			let verbatimMatches = 0;
			for (const { index, value } of providedPaths) {
				const segment = segments.get(index);
				if (segment === value) verbatimMatches += 1;
				if (segment !== undefined && pathSegmentMatches(segment, value)) pathMatches += 1;
			}
			const supplied = new Map();
			for (const [name, argument] of queryArguments) {
				const value = args[argument];
				if (typeof value === "string") supplied.set(name, [value]);
				else if (Array.isArray(value) && value.every((item) => typeof item === "string")) supplied.set(name, value);
			}
			const recorded = new Map();
			const inspectQuery = supplied.size > 0 || observedQuery !== undefined;
			const recordedPairs = inspectQuery ? [...iterateUrlQueryParameters(exchange.query ?? "", observedQuery === undefined ? supplied : queryArguments)] : [];
			for (const [name, value] of recordedPairs) {
				const values = recorded.get(name) ?? [];
				values.push(value);
				recorded.set(name, values);
			}
			const matched = new Set();
			for (const [name, values] of supplied) {
				const actual = recorded.get(name);
				if (actual !== undefined && actual.length === values.length && actual.every((value, index) => value === values[index])) matched.add(name);
			}
			const queryProvided = supplied.size;
			const queryMatches = matched.size;
			const observedOccurrences = new Map();
			const observedPairs = observedQuery === undefined ? undefined : [...iterateUrlQueryParameters(observedQuery ?? "", queryArguments)].map(([name, rawValue]) => {
				const occurrence = observedOccurrences.get(name) ?? 0;
				observedOccurrences.set(name, occurrence + 1);
				const argument = queryArguments.get(name);
				const value = argument === undefined ? undefined : args[argument];
				const normalized = typeof value === "string" ? occurrence === 0 ? value : rawValue : Array.isArray(value) && typeof value[occurrence] === "string" ? value[occurrence] : rawValue;
				return [name, normalized];
			});
			const observedOrderMatches = observedPairs === undefined ? 0 : Number(observedQuery === null === (exchange.query === null) && observedPairs.length === recordedPairs.length && observedPairs.every(([name, value], index) => recordedPairs[index]?.[0] === name && recordedPairs[index]?.[1] === value));
			return {
				pathMatches,
				verbatimMatches,
				queryMatches,
				observedOrderMatches,
				exact: pathMatches === pathProvided && queryMatches === queryProvided && (observedPairs === undefined || observedOrderMatches === 1)
			};
		};
		outranks = (score, best) => score.pathMatches !== best.pathMatches ? score.pathMatches > best.pathMatches : score.verbatimMatches !== best.verbatimMatches ? score.verbatimMatches > best.verbatimMatches : score.queryMatches !== best.queryMatches ? score.queryMatches > best.queryMatches : score.observedOrderMatches > best.observedOrderMatches;
		selectReplayExchange = (tool, exchanges, args, observedQuery) => {
			let best;
			const argumentsMap = environmentToolArguments(tool);
			for (const ordinal of tool.record_ordinals) {
				const exchange = exchanges.get(ordinal);
				if (exchange === undefined) continue;
				const score = scoreExchange(tool, argumentsMap.path, argumentsMap.query, exchange, args, observedQuery);
				if (best === undefined || outranks(score, best.score)) best = {
					exchange,
					score
				};
			}
			if (best === undefined) return undefined;
			const suppliedQueryNames = new Set([...argumentsMap.query].flatMap(([name, argument]) => args[argument] === undefined ? [] : [name]));
			const queryWasSupplied = suppliedQueryNames.size > 0;
			const canInspectQuery = observedQuery !== undefined || queryWasSupplied;
			const bestPairs = canInspectQuery ? [...iterateUrlQueryParameters(best.exchange.query ?? "", suppliedQueryNames)] : [];
			const orderAmbiguous = observedQuery === undefined && queryWasSupplied && best.score.exact && tool.record_ordinals.some((ordinal) => {
				const candidate = exchanges.get(ordinal);
				if (candidate === undefined || candidate.ordinal === best.exchange.ordinal) return false;
				const score = scoreExchange(tool, argumentsMap.path, argumentsMap.query, candidate, args);
				if (score.pathMatches !== best.score.pathMatches || score.verbatimMatches !== best.score.verbatimMatches || !score.exact) return false;
				const pairs = [...iterateUrlQueryParameters(candidate.query ?? "", suppliedQueryNames)];
				return pairs.length !== bestPairs.length || pairs.some(([name, value], index) => bestPairs[index]?.[0] !== name || bestPairs[index]?.[1] !== value);
			});
			return {
				exchange: best.exchange,
				exact: best.score.exact && !orderAmbiguous
			};
		};
		selectsRecordedLine = (tool, exchange, args, observedQuery) => {
			const argumentsMap = environmentToolArguments(tool);
			if (!tool.params.every((param) => typeof args[argumentsMap.path.get(param.name) ?? param.name] === "string") || !scoreExchange(tool, argumentsMap.path, argumentsMap.query, exchange, args, observedQuery).exact) return false;
			const recorded = new Map();
			for (const [name, value] of iterateUrlQueryParameters(exchange.query ?? "")) {
				const values = recorded.get(name) ?? [];
				values.push(value);
				recorded.set(name, values);
			}
			for (const [name, values] of recorded) {
				const argument = argumentsMap.query.get(name);
				const supplied = args[argument ?? ""];
				if (argument === undefined || (typeof supplied === "string" ? values.length !== 1 || values[0] !== supplied : !Array.isArray(supplied) || supplied.length !== values.length || !supplied.every((value, index) => value === values[index]))) return false;
			}
			return true;
		};
		utf8Prefix = (text, maxBytes) => {
			const { read } = new TextEncoder().encodeInto(text, new Uint8Array(maxBytes));
			return text.slice(0, read);
		};
		BASE64_LIMIT_CHARS = Math.floor(REPLAY_BODY_LIMIT_BYTES / 3) * 4;
		replayBody = (exchange) => {
			const body = replayedBody(exchange);
			switch (body.kind) {
				case "none": return {
					body: null,
					truncated: false
				};
				case "base64": return body.whole ? {
					body: body.encoded,
					truncated: false
				} : {
					body: body.encoded.slice(0, BASE64_LIMIT_CHARS),
					truncated: true
				};
				case "cut": return {
					body: utf8Prefix(body.text, REPLAY_BODY_LIMIT_BYTES),
					truncated: true
				};
				case "json": return {
					body: body.value,
					truncated: false
				};
				case "text": return {
					body: body.text,
					truncated: false
				};
			}
		};
		REPLAY_METADATA_LIMIT_BYTES = 1024;
		replayEnvironmentTool = (source, tool, args, observedQuery) => {
			const selected = selectReplayExchange(tool, source.exchanges, args, observedQuery);
			if (selected === undefined) return err(new AnalysisInputError(ENVIRONMENT_SERVE_OPERATION, { userMessage: `Tool ${tool.name} cites no retained record to replay.` }, [{
				path: ["tool"],
				reason: "invalid_value",
				expected: tool.name
			}]));
			return ok(replayAnswer(source, selected.exchange, selected.exact));
		};
		replayAnswer = (source, exchange, exact, { body, truncated } = replayBody(exchange)) => {
			const recordedPath = utf8Prefix(exchange.path, REPLAY_METADATA_LIMIT_BYTES);
			const recordedQuery = exchange.query === null ? null : utf8Prefix(exchange.query, REPLAY_METADATA_LIMIT_BYTES);
			const contentType = exchange.contentType === null ? null : utf8Prefix(exchange.contentType, REPLAY_METADATA_LIMIT_BYTES);
			return {
				status: exchange.status,
				content_type: contentType,
				body,
				replay: {
					record_ordinal: exchange.ordinal,
					evidence_id: source.evidenceId,
					exact_match: exact,
					recorded_path: recordedPath,
					recorded_query: recordedQuery,
					recorded_line_truncated: recordedPath.length < exchange.path.length || (recordedQuery?.length ?? 0) < (exchange.query?.length ?? 0),
					content_type_truncated: contentType !== exchange.contentType,
					body_recorded: exchange.bodyText !== null,
					body_encoding: exchange.bodyEncoding ?? "utf-8",
					truncated
				}
			};
		};
	})))();
}

//#endregion
//#region dist/application/environment/environmentStateCallLines.js
var callSegments, checkedLine, unfilteredLine, callQuery, queryLine;
function init_environmentStateCallLines() {
	return (init_environmentStateCallLines = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStatePaging();
		init_environmentReplay();
		init_environmentTools();
		callSegments = (tool, args) => {
			const names = environmentToolArguments(tool).path;
			const params = new Map(tool.params.map((param) => [param.index, param]));
			const segments = [];
			for (const [index, text] of segmentsOf(tool.path_template).entries()) {
				const param = params.get(index);
				if (param === undefined) {
					segments.push({
						text,
						supplied: false
					});
					continue;
				}
				const value = args[names.get(param.name) ?? param.name];
				if (typeof value !== "string") return undefined;
				segments.push({
					text: value,
					supplied: true
				});
			}
			return segments;
		};
		checkedLine = (source, tool, checked, args, observedQuery) => {
			const lines = new Map();
			for (const ordinal of checked) {
				const exchange = source.exchanges.get(ordinal);
				if (exchange !== undefined && selectsRecordedLine(tool, exchange, args, observedQuery)) lines.set(ordinal, exchange);
			}
			return selectReplayExchange(tool, lines, args, observedQuery)?.exchange;
		};
		unfilteredLine = (source, tool, checked, args, observedQuery) => {
			const query = environmentToolArguments(tool).query;
			const segments = callSegments(tool, args);
			if (segments === undefined || [...query.values()].some((argument) => args[argument] !== undefined)) return undefined;
			const lines = new Map();
			for (const ordinal of checked) {
				const exchange = source.exchanges.get(ordinal);
				if (exchange !== undefined && pagesOnly(exchange.query ?? undefined) && collectionMatch(collectionPathOf(exchange, false), segments) !== undefined) lines.set(ordinal, exchange);
			}
			return selectReplayExchange(tool, lines, args, observedQuery)?.exchange;
		};
		callQuery = (tool, args) => new Map([...environmentToolArguments(tool).query].flatMap(([name, argument]) => {
			const value = args[argument];
			return value === undefined ? [] : [[name, String(value)]];
		}));
		queryLine = (source, tool, view, args, observedQuery) => {
			const query = view.query;
			const segments = callSegments(tool, args);
			if (query === undefined || segments === undefined || [...callQuery(tool, args).keys()].some((name) => !Object.hasOwn(query.parameters, name))) return undefined;
			const lines = new Map();
			for (const ordinal of [...query.record_ordinals, ...allLines(view)]) {
				const exchange = source.exchanges.get(ordinal);
				if (exchange !== undefined && collectionMatch(collectionPathOf(exchange, false), segments) !== undefined) lines.set(ordinal, exchange);
			}
			return selectReplayExchange(tool, lines, args, observedQuery)?.exchange;
		};
	})))();
}

//#endregion
//#region dist/application/environment/environmentStateAnswer.js
var refused, shownEntity, fromRecording, replayedCall, recordedJson, stateAnswer, itemCall, startedWithItem, namedEntity, missingAnswer, answerItem, listSelection, answerList, answerDocument$1, answerCheckedLine, answerFromState;
function init_environmentStateAnswer() {
	return (init_environmentStateAnswer = __esmMin((() => {
		init_environmentTools();
		init_EnvironmentStateAccumulator();
		init_environmentStateRules();
		init_environmentStatePaging();
		init_environmentStateVariants();
		init_environmentStateWriteChecks();
		init_environmentStateListQuery();
		init_analysisErrorCore();
		init_jsonSerialization();
		init_result();
		init_environmentReplay();
		init_environmentSource();
		init_environmentStateCallLines();
		refused = (tool, userMessage) => new AnalysisInputError(ENVIRONMENT_SERVE_OPERATION, { userMessage }, [{
			path: ["tool"],
			reason: "invalid_value",
			expected: tool.name
		}]);
		shownEntity = (tool, view, entity, volatile) => {
			const missing = missingRequiredFields(entity, view, volatile);
			return missing.length === 0 ? ok(renderStateEntity(entity, view, volatile)) : err(refused(tool, `The state holds no complete ${view.type} entity ${entity.id} in ${entity.collection}: it lacks fields this tool's responses always carried: ${missing.join(", ")}.`));
		};
		fromRecording = (source, tool, args, reason, observedQuery) => {
			const replayed = replayEnvironmentTool(source, tool, args, observedQuery);
			return replayed.ok ? ok({
				...replayed.value,
				state: {
					source: "recording",
					reason
				}
			}) : replayed;
		};
		replayedCall = (source, view, call) => replayReason(view, new Map([...call].map(([name, value]) => [name, [value]])), (ordinal) => source.exchanges.get(ordinal)?.query);
		recordedJson = (exchange) => stateBodyJson(exchange.contentType, exchange);
		stateAnswer = (serving, base, body, state) => {
			const bytes = jsonByteLength(body);
			if (bytes > 262144) return err(new AnalysisResourceConstraintError(ENVIRONMENT_SERVE_OPERATION, "capacity", "The answer rendered from the state exceeds the reply body limit", {
				max_body_bytes: REPLAY_BODY_LIMIT_BYTES,
				body_bytes: bytes
			}, {
				retryable: false,
				remediationAction: "Load a smaller state with data/add; the state is not cut to fit."
			}));
			return ok({
				...replayAnswer(serving.source, base.exchange, base.exact, {
					body,
					truncated: false
				}),
				state
			});
		};
		itemCall = (tool, args, action = false) => {
			const segments = callSegments(tool, args);
			if (action && segments?.pop()?.supplied !== false) return undefined;
			const last = segments?.pop();
			return segments !== undefined && last?.supplied === true ? {
				segments,
				id: last.text
			} : undefined;
		};
		startedWithItem = (store, type, call) => {
			const ids = new Set([decodedSegment(call.id), call.id]);
			return store.startedWith(type).some((entity) => ids.has(entity.id) && collectionMatch(entity.collection, call.segments) !== undefined);
		};
		namedEntity = (store, type, call) => {
			const ids = call.literal === true ? [call.id] : [...new Set([decodedSegment(call.id), call.id])];
			const candidates = store.collectionsOf(type).flatMap((collection) => {
				const verbatim = collectionMatch(collection, call.segments);
				return verbatim === undefined ? [] : [{
					collection,
					verbatim
				}];
			}).sort((left, right) => right.verbatim - left.verbatim);
			for (const { collection } of candidates) for (const id of ids) {
				const entity = store.entity(type, collection, id);
				if (entity !== undefined) return entity;
			}
			return undefined;
		};
		missingAnswer = (serving, tool, missing) => {
			const nullAbsence = tool.method === "GET";
			const latestAbsence = (ordinals) => ordinals.map((ordinal) => serving.source.exchanges.get(ordinal)).filter((exchange) => exchange !== undefined && (isAbsence(exchange.status) || nullAbsence && exchange.status !== null && exchange.status >= 200 && exchange.status < 300 && recordedJson(exchange) === null)).at(-1);
			const itemTools = new Set([...serving.store.state.views.values()].flatMap((view) => view.shape === "item" && view.type === missing.type ? [view.tool] : []));
			const recorded = latestAbsence(tool.record_ordinals) ?? latestAbsence(serving.source.manifest.tools.filter((candidate) => itemTools.has(candidate.name)).flatMap((candidate) => candidate.record_ordinals));
			if (recorded === undefined) return err(refused(tool, `The state holds no ${missing.type} entity ${missing.id} in ${missing.collection}.`));
			return ok({
				...replayAnswer(serving.source, recorded, false),
				state: {
					source: "state",
					view: "missing",
					...missing
				}
			});
		};
		answerItem = (serving, tool, view, args, observedQuery) => {
			const { source, store } = serving;
			const call = itemCall(tool, args);
			if (call === undefined) return err(refused(tool, `Tool ${tool.name} needs every path argument.`));
			const entity = namedEntity(store, view.type, call);
			const replayed = replayedCall(source, view, callQuery(tool, args));
			if (entity === undefined) {
				if (replayed !== undefined && !store.createdInto(view.type) && !startedWithItem(store, view.type, call) && selectReplayExchange(tool, source.exchanges, args, observedQuery)?.exact === true) return fromRecording(source, tool, args, replayed, observedQuery);
				return missingAnswer(serving, tool, {
					type: view.type,
					collection: `/${call.segments.map(({ text }) => text).join("/")}`,
					id: call.id
				});
			}
			if (replayed !== undefined) return fromRecording(source, tool, args, replayed, observedQuery);
			const shown = shownEntity(tool, view, entity, new Set(store.type(view.type)?.volatile_fields));
			if (!shown.ok) return shown;
			const base = source.exchanges.get(view.envelope_ordinal);
			const envelope = base === undefined ? undefined : recordedJson(base);
			if (base === undefined || envelope === undefined) return err(refused(tool, `Tool ${tool.name} has no usable recorded envelope.`));
			const exact = selectReplayExchange(tool, new Map([[base.ordinal, base]]), args, observedQuery)?.exact === true;
			return stateAnswer(serving, {
				exchange: base,
				exact
			}, replaceAt(envelope, view.pointer, shown.value), {
				source: "state",
				view: "item",
				type: view.type,
				collection: entity.collection,
				id: entity.id
			});
		};
		listSelection = (store, { tool, args, exact }, view, line) => {
			const collection = collectionPathOf(line.base, false);
			const values = callQuery(tool, args);
			const queried = view.query !== undefined && (exact ? view.query.record_ordinals.includes(line.base.ordinal) : values.size > 0);
			if (queried) {
				const computed = evaluateQuery(view.query.parameters, values, store.inCollection(view.type, collection));
				return computed === undefined ? undefined : {
					members: computed.page,
					membership: "query",
					total: computed.total
				};
			}
			if (listsAll(view, line.base.ordinal)) {
				const members = store.inCollection(view.type, collection);
				return {
					members,
					membership: "all",
					total: members.length
				};
			}
			const idField = store.type(view.type)?.id_field ?? "";
			const members = line.recorded.flatMap((item) => {
				const id = scalarText(item[idField]);
				const entity = id === undefined ? undefined : store.entity(view.type, collection, id);
				return entity === undefined ? [] : [entity];
			});
			return {
				members,
				membership: "recorded",
				total: members.length
			};
		};
		answerList = (serving, call, view, base) => {
			const { source, store } = serving;
			const { tool, args, exact } = call;
			const envelope = recordedJson(base);
			const recorded = envelope === undefined ? undefined : listItems(envelope, view.pointer);
			if (envelope === undefined || recorded === undefined) return fromRecording(source, tool, args, "body-unusable");
			const size = exact ? pageBound(base.query ?? undefined, recorded.length) : undefined;
			if (listsAll(view, base.ordinal) && size !== undefined && store.inCollection(view.type, collectionPathOf(base, false)).length > size) return fromRecording(source, tool, args, "page-exceeded");
			const selection = listSelection(store, call, view, {
				base,
				recorded
			});
			if (selection === undefined) return fromRecording(source, tool, args, "unrecorded-request");
			const volatile = new Set(store.type(view.type)?.volatile_fields);
			const items = [];
			for (const entity of selection.members) {
				const shown = shownEntity(tool, view, entity, volatile);
				if (!shown.ok) return shown;
				items.push(shown.value);
			}
			const body = view.query === undefined || selection.membership === "recorded" ? renderStateList(view, envelope, items) : renderQueryList({
				...view,
				query: view.query
			}, envelope, items, selection.total);
			return stateAnswer(serving, {
				exchange: base,
				exact
			}, body, {
				source: "state",
				view: "list",
				type: view.type,
				collection: collectionPathOf(base, false),
				membership: selection.membership,
				listed: items.length
			});
		};
		answerDocument$1 = (serving, tool, base) => {
			const current = serving.store.document(tool.name);
			if (current === undefined) return err(refused(tool, `The state holds no document for ${tool.name}.`));
			return stateAnswer(serving, {
				exchange: base,
				exact: true
			}, current.value, {
				source: "state",
				view: "document",
				path: current.path
			});
		};
		answerCheckedLine = (serving, tool, view, args, observedQuery) => {
			const replayed = view.shape === "list" ? replayedCall(serving.source, view, callQuery(tool, args)) : undefined;
			if (replayed !== undefined) return fromRecording(serving.source, tool, args, replayed, observedQuery);
			const named = checkedLine(serving.source, tool, view.checked_record_ordinals, args, observedQuery);
			const base = named ?? (view.shape === "list" ? unfilteredLine(serving.source, tool, allLines(view), args, observedQuery) ?? queryLine(serving.source, tool, view, args, observedQuery) : undefined);
			if (base === undefined) return fromRecording(serving.source, tool, args, "unrecorded-request", observedQuery);
			return view.shape === "list" ? answerList(serving, {
				tool,
				args,
				exact: named !== undefined
			}, view, base) : answerDocument$1(serving, tool, base);
		};
		answerFromState = (serving, tool, args, observedQuery) => {
			if (hasRepeatedQueryArgument(tool, args)) return fromRecording(serving.source, tool, args, "query-multiplicity", observedQuery);
			const view = serving.store.state.views.get(tool.name);
			if (view === undefined) return fromRecording(serving.source, tool, args, "no-view", observedQuery);
			switch (view.shape) {
				case "recorded": return fromRecording(serving.source, tool, args, view.reason, observedQuery);
				case "item": return answerItem(serving, tool, view, args, observedQuery);
				case "list":
				case "document": return answerCheckedLine(serving, tool, view, args, observedQuery);
			}
		};
	})))();
}

//#endregion
//#region dist/application/environment/environmentStateCollections.js
var creatableCollectionsOf, createdCollection;
function init_environmentStateCollections() {
	return (init_environmentStateCollections = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateCallLines();
		creatableCollectionsOf = (serving, type) => {
			const listed = [];
			for (const view of serving.store.state.views.values()) if (view.shape === "list" && view.type === type) for (const ordinal of view.checked_record_ordinals) {
				const exchange = serving.source.exchanges.get(ordinal);
				if (exchange !== undefined) listed.push(collectionPathOf(exchange, false));
			}
			return [...new Set([...serving.store.knownCollectionsOf(type), ...listed])];
		};
		createdCollection = (serving, tool, args, type) => {
			const segments = callSegments(tool, args);
			if (segments === undefined || segments.some(({ text, supplied }) => supplied && text.length === 0)) return undefined;
			return selectedCollection(segments, creatableCollectionsOf(serving, type));
		};
	})))();
}

//#endregion
//#region dist/application/environment/environmentStateWriteAnswer.js
var GENERATION_ATTEMPTS, pathValues, unloadable, callBody, recordedObject, observedEntity, nextHeld, heldEntity, updateTarget, generator, writeAnswer, pathArguments, exemplarPath, writtenCollection, createdPathValues, answerCreate, targetEntity, answerUpdate, answerDelete, documentTarget, answerDocument, answerWrite;
function init_environmentStateWriteAnswer() {
	return (init_environmentStateWriteAnswer = __esmMin((() => {
		init_environmentStateWriteApply();
		init_environmentStateWriteExplain();
		init_environmentStateWriteGenerated();
		init_environmentStateWriteStamps();
		init_environmentStateWriteLinks();
		init_environmentStateWriteRules();
		init_environmentStateWriteObserve();
		init_environmentStateWriteValues();
		init_environmentStateRules();
		init_result();
		init_environmentReplay();
		init_environmentStateCallLines();
		init_environmentStateAnswer();
		init_environmentStateCollections();
		init_environmentStateDocument();
		init_environmentTools();
		GENERATION_ATTEMPTS = 64;
		pathValues = (tool, args) => {
			const names = environmentToolArguments(tool).path;
			const template = tool.path_template.slice(tool.path_template.indexOf("/") + 1).split("/");
			const values = new Map();
			for (const param of tool.params) {
				const value = args[names.get(param.name) ?? param.name];
				const segment = template[param.index] ?? "";
				if (typeof value === "string") values.set(segment.slice(1, -1), value);
			}
			return values;
		};
		unloadable = (tool, holder) => refused(tool, `${holder} would hold a value that is not exactly representable JSON, which data/add could not load back.`);
		callBody = ({ tool, args, plan }) => {
			const name = environmentToolArguments(tool).body;
			const sent = name === undefined ? undefined : args[name];
			if (sent === undefined) return ok(undefined);
			const envelope = plan.body?.envelope ?? "";
			const value = unenveloped(sent, plan.body?.envelope);
			if (value === undefined) return err(refused(tool, `Tool ${tool.name} takes its JSON object body wrapped as {"${envelope}":[{...}]}, as the capture sent it.`));
			if (!isObject(value)) return err(refused(tool, `Tool ${tool.name} takes a JSON object body.`));
			const member = unloadableMember(value);
			return member === undefined ? ok(value) : err(unloadable(tool, `Member ${member}`));
		};
		recordedObject = (serving, at) => {
			const exchange = serving.source.exchanges.get(at.ordinal);
			const body = exchange === undefined ? undefined : recordedJson(exchange);
			const object = body === undefined ? undefined : valueAt(body, at.pointer);
			return isObject(object) ? object : undefined;
		};
		observedEntity = (serving, plan) => {
			if (plan.observation === null) return undefined;
			const object = recordedObject(serving, plan.observation);
			if (object === undefined || plan.observation.read === undefined) return object;
			const read = recordedObject(serving, plan.observation.read);
			return read === undefined ? undefined : withRead(object, read, plan.observation.read.shape);
		};
		nextHeld = (entities, field, exemplar) => nextInteger(entities.map((entity) => entity.fields), field, exemplar);
		heldEntity = (serving) => (type, id) => serving.store.ofType(type).flatMap((entity) => entity.id === id ? [entity.fields] : []);
		updateTarget = (serving, entity, observed) => ({
			name: entity.collection,
			collection: serving.store.inCollection(entity.type, entity.collection),
			observed,
			current: entity.fields
		});
		generator = (serving, request) => {
			const { store } = serving;
			const write = store.pendingWrite();
			const taken = new Map();
			const sequence = (key, held) => {
				const value = store.sequenceAfter(key, held);
				taken.set(key, value);
				return value;
			};
			const ofType = store.ofType(request.plan.target ?? "");
			const started = store.startedWith(request.plan.target ?? "");
			const startedIn = (collection) => started.filter((held) => held.collection === collection);
			const renewed = callRenewal(`${store.state.evidenceId}:${request.tool.name}:renewed:${String(write.count)}`);
			const unused = (field, make) => {
				const held = new Set(ofType.map((entity) => scalarText(entity.fields[field])));
				for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
					const value = make(attempt);
					if (!held.has(scalarText(value))) return ok(value);
				}
				return err(`Could not generate a unique value for ${field} after ${String(GENERATION_ATTEMPTS)} attempts without colliding with the held state.`);
			};
			const generate = (target, rule) => {
				const exemplar = target.observed[rule.field] ?? "";
				const seed = (attempt) => `${store.state.evidenceId}:${request.tool.name}:${rule.field}:${String(write.count)}:${String(attempt)}`;
				switch (rule.rule) {
					case "clock":
					case "held-clock":
					case "nested-clock": {
						const value = formatClock(write.clockMs, rule.format);
						if (value === undefined) return err(`The generated clock for ${rule.field} is outside its recorded four-digit year format.`);
						return rule.rule === "nested-clock" ? nestedClockValue((target.current ?? target.observed)[rule.field], rule, value) : ok(value);
					}
					case "sequence": return ok(spelledLike(exemplar, sequence(`${request.tool.name} ${rule.field} ${rule.scope === "collection" ? target.name : ""}`, nextHeld(rule.scope === "collection" ? [...target.collection, ...startedIn(target.name)] : [...ofType, ...started], rule.field, exemplar))));
					case "unique": return unused(rule.field, (attempt) => generatedIntegerDigits(exemplar) === undefined ? seededLike(seed(attempt), exemplar) : seededInteger(seed(attempt), exemplar));
					case "renewed": return ok(renewUuids(target.current?.[rule.field] ?? null, rule.pointers, renewed));
					case "identity":
						if (rule.generator === "sequence") return ok(spelledLike(exemplar, sequence(`${request.plan.target ?? ""} ${rule.field} ${target.name}`, nextHeld([...target.collection, ...startedIn(target.name)], rule.field, exemplar))));
						return unused(rule.field, (attempt) => seededLike(seed(attempt), exemplar, rule.generator === "uuid"));
				}
			};
			return {
				forTarget: (target) => (rule) => generate(target, rule),
				taken
			};
		};
		writeAnswer = (serving, request, rendered, state) => {
			const { plan, tool, args } = request;
			const exchange = plan.response === null ? undefined : serving.source.exchanges.get(plan.response.ordinal);
			if (plan.response === null || exchange === undefined) return err(refused(tool, `Tool ${tool.name} has no recorded response.`));
			const exact = selectReplayExchange(tool, new Map([[exchange.ordinal, exchange]]), args, request.observedQuery)?.exact === true;
			if (plan.response.shape === "recorded") return ok({
				...replayAnswer(serving.source, exchange, exact),
				state
			});
			const recorded = recordedJson(exchange);
			const body = typeof rendered === "function" ? rendered(recorded) : writtenResponse(plan.response, recorded, {
				...rendered,
				clocks: plan.observation?.read?.shape === "item" ? plan.rules.flatMap((rule) => rule.rule === "clock" ? [rule.field] : []) : []
			}, optionalFields(plan));
			if (!body.ok) return err(refused(tool, body.error));
			return stateAnswer(serving, {
				exchange,
				exact
			}, body.value ?? null, state);
		};
		pathArguments = (tool, args) => {
			const names = environmentToolArguments(tool).path;
			return new Map(tool.params.flatMap((param) => {
				const value = args[names.get(param.name) ?? param.name];
				return typeof value === "string" ? [[param.index, value]] : [];
			}));
		};
		exemplarPath = (serving, plan) => plan.exemplar_ordinal === null ? undefined : serving.source.exchanges.get(plan.exemplar_ordinal)?.path;
		writtenCollection = (serving, request) => {
			const { tool, plan } = request;
			const linked = linkedCollection(plan, tool.path_template);
			if (linked === undefined) return ok(createdCollection(serving, tool, request.args, plan.target ?? ""));
			return sameLinkedSource(tool.path_template, exemplarPath(serving, plan), pathArguments(tool, request.args)) ? ok(linked) : err(refused(tool, `Tool ${tool.name} creates into ${linked} only with the path arguments its recording sent.`));
		};
		createdPathValues = (serving, request, call, collection) => {
			const { tool, plan } = request;
			const exemplar = linkedCollection(plan, tool.path_template) === undefined ? undefined : exemplarPath(serving, plan);
			return (exemplar === undefined ? undefined : pathValuesOf(tool.path_template, exemplar)) ?? pathValuesOf(tool.path_template, collection) ?? new Map([...call.pathValues].map(([name, value]) => [name, decodedSegment(value)]));
		};
		answerCreate = (serving, request, call) => {
			const { tool, plan } = request;
			const type = plan.target ?? "";
			const idField = serving.store.type(type)?.id_field ?? "";
			const target = writtenCollection(serving, request);
			if (!target.ok) return target;
			const collection = target.value;
			const observed = observedEntity(serving, plan);
			if (collection === undefined || observed === undefined) return err(refused(tool, `Tool ${tool.name} needs every path argument to be non-empty.`));
			if (plan.collection !== null && plan.collection !== collection) return err(refused(tool, `The recorded create's values are tied to ${plan.collection}; the environment models creates only there.`));
			const members = serving.store.inCollection(type, collection);
			const values = generator(serving, request);
			const created = {
				...call,
				pathValues: createdPathValues(serving, request, call, collection)
			};
			const fields = createdFields(plan, observed, created, values.forTarget({
				name: collection,
				collection: members,
				observed
			}), heldEntity(serving));
			if (!fields.ok) return err(refused(tool, fields.error));
			const field = unloadableMember(fields.value);
			if (field !== undefined) return err(unloadable(tool, `Field ${field}`));
			const id = scalarText(fields.value[idField]);
			if (id === undefined || serving.store.entity(type, collection, id) !== undefined) return err(refused(tool, `The state already holds a ${type} entity ${id ?? ""} in ${collection}.`));
			const state = {
				source: "state",
				view: "create",
				type,
				collection,
				id
			};
			const answer = writeAnswer(serving, request, {
				fields: fields.value,
				id
			}, state);
			if (!answer.ok) return answer;
			const inserted = serving.store.insert({
				type,
				collection,
				id,
				fields: fields.value,
				view_fields: [],
				record_ordinals: []
			}, insertIndex(plan.insert ?? { rule: "last" }, members.map((entity) => entity.fields), fields.value));
			if (!inserted.ok) return inserted;
			serving.store.commitWrite(values.taken);
			return answer;
		};
		targetEntity = (serving, request) => {
			const { tool, plan, args } = request;
			const call = itemCall(tool, args, plan.address?.by === "action");
			if (call === undefined) return err(err(refused(tool, `Tool ${tool.name} needs every path argument.`)));
			const entity = namedEntity(serving.store, plan.target ?? "", call);
			return entity === undefined ? err(missingAnswer(serving, tool, {
				type: plan.target ?? "",
				collection: `/${call.segments.map(({ text }) => text).join("/")}`,
				id: call.id
			})) : ok(entity);
		};
		answerUpdate = (serving, request, call) => {
			const { tool, plan } = request;
			const target = targetEntity(serving, request);
			if (!target.ok) return target.error;
			const entity = target.value;
			const observed = observedEntity(serving, plan) ?? {};
			const values = generator(serving, request);
			const written = updatedFields(plan, {
				before: entity.fields,
				observed
			}, {
				...call,
				id: entity.id
			}, values.forTarget(updateTarget(serving, entity, observed)), heldEntity(serving));
			if (!written.ok) return err(refused(tool, written.error));
			const field = unloadableMember(written.value);
			if (field !== undefined) return err(unloadable(tool, `Field ${field}`));
			const answer = writeAnswer(serving, request, {
				fields: written.value,
				id: entity.id
			}, {
				source: "state",
				view: "update",
				type: entity.type,
				collection: entity.collection,
				id: entity.id
			});
			if (!answer.ok) return answer;
			const updated = serving.store.update(updatedEntity(entity, written.value));
			if (!updated.ok) return updated;
			serving.store.commitWrite(values.taken);
			return answer;
		};
		answerDelete = (serving, request) => {
			const target = targetEntity(serving, request);
			if (!target.ok) return target.error;
			const entity = target.value;
			const answer = writeAnswer(serving, request, {
				fields: entity.fields,
				id: entity.id
			}, {
				source: "state",
				view: "delete",
				type: entity.type,
				collection: entity.collection,
				id: entity.id
			});
			if (answer.ok) {
				serving.store.remove(entity);
				serving.store.commitWrite(new Map());
			}
			return answer;
		};
		documentTarget = (serving, { tool, plan, args }, call) => {
			const held = serving.store.document(plan.target ?? "");
			const segments = callSegments(tool, args);
			if (held === undefined || plan.body === null) return err(refused(tool, `The state holds no document for ${plan.target ?? ""}.`));
			if (segments === undefined) return err(refused(tool, `Tool ${tool.name} needs every path argument.`));
			if (collectionMatch(held.path, segments) === undefined) return err(refused(tool, `The state holds this document only at ${held.path}; the environment models writes to it only there.`));
			const initial = serving.store.state.documents.find((document) => document.tool === held.tool);
			const problem = documentBodyProblem(plan, call, {
				initial: initial?.value,
				current: held.value
			});
			return problem === undefined ? ok(held) : err(refused(tool, problem));
		};
		answerDocument = (serving, request, call) => {
			const { tool, plan } = request;
			const target = documentTarget(serving, request, call);
			if (!target.ok) return target;
			const held = target.value;
			const written = writtenDocument(plan, held.value, call);
			if (!written.ok) return err(refused(tool, written.error));
			if (!isLoadableValue(written.value)) return err(unloadable(tool, "The document"));
			const state = {
				source: "state",
				view: "document-write",
				path: held.path
			};
			const answer = plan.response?.shape === "entity" ? (() => {
				const exchange = serving.source.exchanges.get(plan.response.ordinal);
				return exchange === undefined ? err(refused(tool, `Tool ${tool.name} has no recorded response.`)) : stateAnswer(serving, {
					exchange,
					exact: true
				}, written.value, state);
			})() : writeAnswer(serving, request, {
				fields: undefined,
				id: ""
			}, state);
			if (!answer.ok) return answer;
			const set = serving.store.setDocument(held.tool, written.value);
			if (!set.ok) return set;
			serving.store.commitWrite(new Map());
			return answer;
		};
		answerWrite = (serving, request) => {
			const body = callBody(request);
			if (!body.ok) return body;
			const call = {
				path: request.tool.path_template,
				pathValues: pathValues(request.tool, request.args),
				body: body.value
			};
			switch (request.plan.effect) {
				case "create": return answerCreate(serving, request, call);
				case "update": return answerUpdate(serving, request, call);
				case "delete": return answerDelete(serving, request);
				case "document": return answerDocument(serving, request, call);
				case "none": return err(refused(request.tool, `Tool ${request.tool.name} is not served from the state.`));
			}
		};
	})))();
}

//#endregion
//#region dist/application/environment/environmentStateBulkAnswer.js
var DRAWN_ONCE, namedTargets, writtenTargets, answerBulk;
function init_environmentStateBulkAnswer() {
	return (init_environmentStateBulkAnswer = __esmMin((() => {
		init_environmentStateWriteAddress();
		init_environmentStateWriteApply();
		init_result();
		init_environmentStateCallLines();
		init_environmentStateAnswer();
		init_environmentStateDocument();
		init_environmentStateWriteAnswer();
		init_environmentTools();
		DRAWN_ONCE = new Set(["unique", "renewed"]);
		namedTargets = (serving, request) => {
			const { tool, plan, args } = request;
			const { address } = plan;
			const type = plan.target ?? "";
			const name = environmentToolArguments(tool, true).body;
			const body = name === undefined ? undefined : args[name];
			if (body !== undefined && !isLoadableValue(body)) return err(unloadable(tool, "The body"));
			const named = address === undefined || address.by === "action" ? undefined : namedEntities(address, body, serving.store.type(type)?.id_field ?? "");
			if (named === undefined) return err(refused(tool, `Tool ${tool.name} names the entities it writes by their ids in its body, as its recording did.`));
			const segments = callSegments(tool, args);
			if (segments === undefined) return err(refused(tool, `Tool ${tool.name} needs every path argument.`));
			const collection = bulkCollectionOf(type, segments, (text) => ({
				text,
				supplied: false
			}));
			const targets = [];
			for (const { id, body: members } of named) {
				const entity = namedEntity(serving.store, type, {
					segments: collection,
					id,
					literal: true
				});
				if (entity === undefined) return err(refused(tool, `The state holds no ${type} entity ${id}; the state is unchanged.`));
				if (targets.some((target) => target.entity === entity)) return err(refused(tool, `The body names ${type} entity ${entity.id} more than once; the state is unchanged.`));
				targets.push({
					entity,
					body: members
				});
			}
			return ok(targets);
		};
		writtenTargets = (serving, request, targets, values) => {
			const { tool, plan, args } = request;
			const observed = observedEntity(serving, plan) ?? {};
			const path = {
				path: tool.path_template,
				pathValues: pathValues(tool, args)
			};
			const written = [];
			for (const { entity, body } of targets) {
				const call = {
					...path,
					body,
					id: entity.id
				};
				if (plan.effect !== "update") {
					const problem = plan.body === null ? "The tool has no modelled body." : bodyProblem(plan.body, call, {
						entity: {},
						id: entity.id
					});
					if (problem !== undefined) return err(refused(tool, problem));
					written.push(entity);
					continue;
				}
				const fields = updatedFields(plan, {
					before: entity.fields,
					observed
				}, call, values.forTarget(updateTarget(serving, entity, observed)), heldEntity(serving));
				if (!fields.ok) return err(refused(tool, fields.error));
				const field = unloadableMember(fields.value);
				if (field !== undefined) return err(unloadable(tool, `Field ${field}`));
				written.push(updatedEntity(entity, fields.value));
			}
			return ok(written);
		};
		answerBulk = (serving, request) => {
			const { tool, plan } = request;
			const targets = namedTargets(serving, request);
			if (!targets.ok) return targets;
			const update = plan.effect === "update";
			if (update && targets.value.length > 1 && plan.rules.some((rule) => DRAWN_ONCE.has(rule.rule))) return err(refused(tool, `Tool ${tool.name} generates a value per call, so it writes one entity per call here.`));
			const [first] = targets.value;
			const values = generator(serving, request);
			const written = writtenTargets(serving, request, targets.value, values);
			if (!written.ok) return written;
			const answer = writeAnswer(serving, request, (recorded) => writtenBulkResponse(plan.response, recorded, written.value), {
				source: "state",
				view: update ? "update" : "delete",
				type: first.entity.type,
				collection: first.entity.collection,
				id: first.entity.id,
				ids: written.value.map((entity) => entity.id)
			});
			if (!answer.ok) return answer;
			if (update) {
				const updated = serving.store.updateAll(written.value);
				if (!updated.ok) return updated;
			} else serving.store.removeAll(written.value);
			serving.store.commitWrite(values.taken);
			return answer;
		};
	})))();
}

//#endregion
//#region dist/application/environment/environmentStateWriteQuery.js
var pinnedRequest;
function init_environmentStateWriteQuery() {
	return (init_environmentStateWriteQuery = __esmMin((() => {
		init_environmentStateWriteStamps();
		init_result();
		init_environmentStateAnswer();
		init_environmentStateCallLines();
		init_environmentTools();
		pinnedRequest = (serving, request) => {
			const { tool, plan, args } = request;
			if (hasRepeatedQueryArgument(tool, args)) return err(refused(tool, "The state write model cannot apply repeated query parameters; the state is unchanged."));
			const query = pinnedQuery(serving.source.exchanges.get(plan.exemplar_ordinal ?? -1)?.query, callQuery(tool, args));
			if (!query.ok) return err(refused(tool, `Tool ${tool.name} ${query.error}`));
			const names = environmentToolArguments(tool).query;
			const filled = { ...args };
			for (const [name, value] of query.value) filled[names.get(name) ?? name] ??= value;
			return ok({
				...request,
				args: filled
			});
		};
	})))();
}

//#endregion
//#region dist/application/environment/environmentToolAnswer.js
var environmentToolAnswer;
function init_environmentToolAnswer() {
	return (init_environmentToolAnswer = __esmMin((() => {
		init_environmentReplay();
		init_environmentStateAnswer();
		init_environmentStateBulkAnswer();
		init_environmentStateWriteAnswer();
		init_environmentStateWriteQuery();
		environmentToolAnswer = (source, store) => store === undefined ? (tool, args, observedQuery) => replayEnvironmentTool(source, tool, args, observedQuery) : (tool, args, observedQuery) => {
			const plan = store.state.writes.get(tool.name);
			if (plan?.served !== true) return answerFromState({
				source,
				store
			}, tool, args, observedQuery);
			const request = pinnedRequest({
				source,
				store
			}, {
				tool,
				plan,
				args,
				...observedQuery === undefined ? {} : { observedQuery }
			});
			if (!request.ok) return request;
			const bulk = plan.address !== undefined && plan.address.by !== "action";
			return (bulk ? answerBulk : answerWrite)({
				source,
				store
			}, request.value);
		};
	})))();
}

//#endregion
export { environmentToolAnswer, init_environmentReplay, init_environmentToolAnswer, selectsRecordedLine };