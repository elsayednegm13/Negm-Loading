import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { PROCESS_PROVIDER, canonicalJson, compareUnicodeCodePoints, createEvidence, hasStableNativeSymbol, init_canonicalOrdering, init_comparisonSemantics, init_evidence, init_nativeSymbol, init_processEvidenceProvider, init_relationshipCoverage, init_unicodeCodePointOrder, relationshipCoverageLimitations, uniqueSorted } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { init_nativeAddress, nativeAddressCoordinateInputSchema } from "./interfaceBuilderGraph-DKoO7eCM.js";
import { compareProcessCaptures, init_processComparison } from "./toolOutputSchemaGroups-D49U2-8O.js";

//#region dist/domain/functionComparisonNormalization.js
var identityProjection, functionMatch, normalizeCfg, commentProjection, referencedStringProjection, nameAndSwiftProjection, swiftLiteralSitesConflict, swiftLiteralSites, sorted, parseAddress, relativeAddress;
function init_functionComparisonNormalization() {
	return (init_functionComparisonNormalization = __esmMin((() => {
		init_nativeSymbol();
		init_comparisonSemantics();
		init_unicodeCodePointOrder();
		init_nativeAddress();
		identityProjection = (snapshot) => ({
			name: snapshot.dossier.procedure.name,
			signature: snapshot.dossier.procedure.signature,
			locals: snapshot.dossier.procedure.locals.map(({ description }) => description).sort()
		});
		functionMatch = (left, right) => {
			const leftName = left.dossier.procedure.name;
			const rightName = right.dossier.procedure.name;
			const stableNames = hasStableNativeSymbol(leftName, left.dossier.procedure.symbol) && hasStableNativeSymbol(rightName, right.dossier.procedure.symbol);
			if (stableNames && leftName === rightName) return {
				status: "matched",
				method: "symbol",
				left_name: leftName,
				right_name: rightName
			};
			return {
				status: stableNames ? "mismatched" : "ambiguous",
				method: "explicit",
				left_name: leftName,
				right_name: rightName
			};
		};
		normalizeCfg = (blocks) => {
			const parsed = [];
			let space;
			for (const block of blocks) {
				const start = parseAddress(block.start);
				const end = parseAddress(block.end);
				if (start === null || end === null || start.space !== end.space || space !== undefined && start.space !== space || end.offset <= start.offset) return null;
				space = start.space;
				parsed.push({
					block,
					start: start.offset,
					end: end.offset
				});
			}
			const ordered = parsed.sort((left, right) => left.start < right.start ? -1 : left.start > right.start ? 1 : 0);
			if (new Set(ordered.map(({ start }) => start)).size !== ordered.length) return null;
			const indices = new Map(ordered.map(({ start }, index) => [start, index]));
			const graph = [];
			for (const { block, start, end } of ordered) {
				const successors = [];
				for (const address of block.successors) {
					const parsedAddress = parseAddress(address);
					if (parsedAddress === null || parsedAddress.space !== space) return null;
					const index = indices.get(parsedAddress.offset);
					if (index === undefined) return null;
					successors.push(index);
				}
				graph.push({
					size: String(end - start),
					successors: successors.sort((left, right) => left - right)
				});
			}
			return graph;
		};
		commentProjection = (snapshot) => {
			const values = snapshot.dossier.comments.map(({ address, kind, text }) => ({
				offset: relativeAddress(address, snapshot.dossier.procedure.address),
				kind,
				text
			}));
			return values.some(({ offset }) => offset === null) ? null : sorted(values);
		};
		referencedStringProjection = (snapshot) => {
			const values = snapshot.dossier.referenced_strings.map(({ source_address: sourceAddress, value, decoding, string }) => ({
				source_offset: relativeAddress(sourceAddress, snapshot.dossier.procedure.address),
				content: decoding === undefined ? value : null,
				decoding_reason: decoding?.reason ?? null,
				metadata: string === undefined ? null : {
					encoding: string.encoding,
					termination: string.termination,
					byte_length: string.byte_length
				}
			}));
			return sorted(values);
		};
		nameAndSwiftProjection = (snapshot, includeSwiftLiterals = true) => {
			const values = [...snapshot.dossier.referenced_names.map(({ source_address: sourceAddress, value }) => ({
				kind: "name",
				source_offset: relativeAddress(sourceAddress, snapshot.dossier.procedure.address),
				value
			})), ...(includeSwiftLiterals ? snapshot.dossier.swift_string_literals ?? [] : []).map(({ source_address: sourceAddress, value, representation, registers }) => ({
				kind: "swift_string",
				source_offset: relativeAddress(sourceAddress, snapshot.dossier.procedure.address),
				value,
				representation,
				registers
			}))];
			return values.some(({ source_offset: offset }) => offset === null) ? null : sorted(values);
		};
		swiftLiteralSitesConflict = (left, right) => {
			const leftSites = swiftLiteralSites(left);
			const rightSites = swiftLiteralSites(right);
			for (const site of new Set([...leftSites.values.keys(), ...rightSites.values.keys()])) {
				const leftValues = leftSites.values.get(site) ?? (leftSites.complete ? [] : undefined);
				const rightValues = rightSites.values.get(site) ?? (rightSites.complete ? [] : undefined);
				if (leftValues === undefined || rightValues === undefined) continue;
				const leftFacts = new Set(leftValues);
				const rightFacts = new Set(rightValues);
				if (rightSites.complete && leftValues.some((value) => !rightFacts.has(value)) || leftSites.complete && rightValues.some((value) => !leftFacts.has(value))) return true;
			}
			return false;
		};
		swiftLiteralSites = (snapshot) => {
			const base = snapshot.dossier.procedure.address;
			const omissions = snapshot.dossier.swift_string_literal_omissions ?? [];
			const site = (sourceAddress, registers) => {
				const offset = relativeAddress(sourceAddress, base);
				return offset === null ? null : canonicalJson([offset, registers]);
			};
			const values = new Map();
			for (const literal of snapshot.dossier.swift_string_literals ?? []) {
				const key = site(literal.source_address, literal.registers);
				if (key === null) continue;
				values.set(key, [...values.get(key) ?? [], canonicalJson([literal.value, literal.representation])].sort(compareUnicodeCodePoints));
			}
			const complete = snapshot.dossier.swift_string_literals !== undefined && omissions.length === 0;
			return {
				values,
				complete
			};
		};
		sorted = (values) => values.map((value) => ({
			value,
			json: canonicalJson(value, "Function normalization")
		})).sort((left, right) => compareUnicodeCodePoints(left.json, right.json)).map(({ value }) => value);
		parseAddress = (value) => {
			const parsed = nativeAddressCoordinateInputSchema.safeParse(value);
			return parsed.success ? parsed.data : null;
		};
		relativeAddress = (value, base) => {
			const parsed = parseAddress(value);
			const parsedBase = parseAddress(base);
			return parsed === null || parsedBase === null || parsed.space !== parsedBase.space || parsed.offset < parsedBase.offset ? null : String(parsed.offset - parsedBase.offset);
		};
	})))();
}

//#endregion
//#region dist/domain/functionCallCoverage.js
var callerCoveragePrefix, calleeCoveragePrefix, combineFunctionRelationshipCoverage, isCallerOnlyIncompleteCoverage, assessFunctionCallCoverage;
function init_functionCallCoverage() {
	return (init_functionCallCoverage = __esmMin((() => {
		init_relationshipCoverage();
		init_canonicalOrdering();
		callerCoveragePrefix = "Callers: ";
		calleeCoveragePrefix = "Callees: ";
		combineFunctionRelationshipCoverage = (callers, callees) => {
			const reads = [{
				direction: "callers",
				coverage: callers
			}, {
				direction: "callees",
				coverage: callees
			}];
			const diagnostics = uniqueSorted(reads.flatMap(({ coverage }) => coverage?.diagnostics ?? []));
			const details = diagnostics.length > 0 ? { diagnostics } : {};
			const callersLimited = callers?.status !== "complete";
			const calleesLimited = callees?.status !== "complete";
			const limited_directions = callersLimited ? calleesLimited ? ["callers", "callees"] : ["callers"] : ["callees"];
			const reasons = reads.flatMap(({ direction, coverage }) => {
				const label = direction === "callers" ? callerCoveragePrefix : calleeCoveragePrefix;
				return relationshipCoverageLimitations(coverage).map((reason) => `${label}${reason}`);
			});
			if (reads.some(({ coverage }) => coverage === undefined || coverage.status === "unknown")) return {
				status: "unknown",
				reason: uniqueSorted(reasons).join(" "),
				limited_directions,
				...details
			};
			if (reasons.length > 0) return {
				status: "partial",
				limitations: uniqueSorted(reasons),
				limited_directions,
				...details
			};
			return {
				status: "complete",
				...details
			};
		};
		isCallerOnlyIncompleteCoverage = (coverage) => {
			if (coverage.status === "complete") return false;
			if (coverage.limited_directions !== undefined) return !coverage.limited_directions.some((direction) => direction === "callees");
			return coverage.status === "unknown" && coverage.reason.startsWith(callerCoveragePrefix) && !coverage.reason.includes(calleeCoveragePrefix);
		};
		assessFunctionCallCoverage = (coverage, dossier) => {
			const unresolvedCallCaveats = uniqueSorted((dossier.unresolved_calls ?? []).map(({ address, reason }) => `Unresolved call at ${address}: ${reason}`));
			return {
				blockers: uniqueSorted([...relationshipCoverageLimitations(coverage), ...unresolvedCallCaveats]),
				unresolvedCallCaveats,
				diagnostics: uniqueSorted(coverage?.diagnostics ?? [])
			};
		};
	})))();
}

//#endregion
//#region dist/domain/process/processComparisonEvidence.js
var compareProcessCaptureEvidence;
function init_processComparisonEvidence() {
	return (init_processComparisonEvidence = __esmMin((() => {
		init_evidence();
		init_processComparison();
		init_processEvidenceProvider();
		compareProcessCaptureEvidence = (left, right, options = {}) => {
			const comparison = compareProcessCaptures(left.capture, right.capture, options);
			const evidence = createEvidence(undefined, PROCESS_PROVIDER, {
				predicateType: "rea.process-comparison",
				operation: "compare_process_captures",
				parameters: {
					left_evidence_id: left.record.evidence_id,
					right_evidence_id: right.record.evidence_id,
					left_normalization: left.capture.normalization,
					right_normalization: right.capture.normalization,
					...options.maxCaptureAgeMs === undefined ? {} : { max_capture_age_ms: options.maxCaptureAgeMs },
					...options.traceSpecification === undefined ? {} : { trace_spec: options.traceSpecification }
				},
				result: comparison,
				confidence: "derived",
				authority: "analyst-inference",
				limitations: comparison.limitations,
				locations: [...left.record.locations, ...right.record.locations],
				evidenceLinks: [left.record.evidence_id, right.record.evidence_id]
			});
			return {
				comparison,
				evidence
			};
		};
	})))();
}

//#endregion
export { assessFunctionCallCoverage, combineFunctionRelationshipCoverage, commentProjection, compareProcessCaptureEvidence, functionMatch, identityProjection, init_functionCallCoverage, init_functionComparisonNormalization, init_processComparisonEvidence, nameAndSwiftProjection, normalizeCfg, referencedStringProjection, sorted, swiftLiteralSitesConflict };