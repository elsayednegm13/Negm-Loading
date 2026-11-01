import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { f as init_analysisErrorCore, o as AnalysisInputError } from "./analysisErrorCore-Cl6H9zyu.js";

//#region dist/domain/inputIssueProjection.js
var analysisInputErrorFromIssues, analysisOperationInputErrorFromIssues, projectInputIssues, projectIssue, uniqueIssues, valueAtPath, numericBound, isSafeExpected, safeExpected, boundedIssue;
function init_inputIssueProjection() {
	return (init_inputIssueProjection = __esmMin((() => {
		init_analysisErrorCore();
		analysisInputErrorFromIssues = (operation, issues, input, options = {}) => new AnalysisInputError(operation, {
			...options.cause === undefined ? {} : { cause: options.cause },
			...options.userMessage === undefined ? {} : { userMessage: options.userMessage }
		}, [...projectInputIssues(issues, input), ...options.additionalIssues ?? []]);
		analysisOperationInputErrorFromIssues = (operation, issues, input, cause) => new AnalysisInputError(operation, { cause }, projectInputIssues(issues, {
			operation,
			input
		}).map((issue) => issue.path[0] === "input" ? {
			...issue,
			path: issue.path.slice(1)
		} : issue));
		projectInputIssues = (issues, input) => issues.flatMap((issue) => projectIssue(issue, input));
		projectIssue = (issue, input) => {
			const path = issue.path.flatMap((part) => typeof part === "string" || typeof part === "number" ? [part] : []);
			if (issue.code === "invalid_union") {
				if (issue.errors.length === 0) {
					const expected = "options" in issue ? issue.options?.filter(isSafeExpected) : undefined;
					return [{
						path,
						reason: valueAtPath(input, path) === undefined ? "missing_argument" : "invalid_value",
						...expected === undefined ? {} : { expected }
					}];
				}
				return uniqueIssues(issue.errors.flatMap((branch) => branch.flatMap((branchIssue) => projectIssue({
					...branchIssue,
					path: [...issue.path, ...branchIssue.path]
				}, input))));
			}
			if (issue.code === "invalid_key") return issue.issues.flatMap((keyIssue) => projectIssue({
				...keyIssue,
				path: [...issue.path, ...keyIssue.path]
			}, input));
			if (issue.code === "unrecognized_keys") return issue.keys.map((key) => ({
				path: [...path, key],
				reason: "unknown_argument"
			}));
			if (issue.code === "invalid_type") return [{
				path,
				reason: valueAtPath(input, path) === undefined ? "missing_argument" : "invalid_type",
				expected: safeExpected(issue.expected)
			}];
			if (issue.code === "too_small") return [boundedIssue(path, "minimum", numericBound(issue.minimum))];
			if (issue.code === "too_big") return [boundedIssue(path, "maximum", numericBound(issue.maximum))];
			if (issue.code === "invalid_format") return [{
				path,
				reason: "invalid_format",
				expected: issue.format,
				...issue.format === "regex" && issue.message.length > 0 ? { message: issue.message } : {}
			}];
			if (issue.code === "invalid_value") return [{
				path,
				reason: "invalid_value",
				expected: issue.values.filter(isSafeExpected)
			}];
			return [{
				path,
				reason: "invalid_value",
				...issue.message.length > 0 ? { message: issue.message } : {}
			}];
		};
		uniqueIssues = (issues) => [...new Map(issues.map((issue) => [JSON.stringify(issue), issue])).values()];
		valueAtPath = (input, path) => {
			let current = input;
			for (const part of path) {
				if (typeof current !== "object" || current === null) return undefined;
				const next = Reflect.get(current, part);
				current = next;
			}
			return current;
		};
		numericBound = (value) => typeof value === "number" && Number.isFinite(value) ? value : undefined;
		isSafeExpected = (value) => value === null || [
			"string",
			"number",
			"boolean"
		].includes(typeof value);
		safeExpected = (value) => isSafeExpected(value) ? value : "schema-defined value";
		boundedIssue = (path, key, value) => ({
			path,
			reason: "out_of_range",
			...value === undefined ? {} : { [key]: value }
		});
	})))();
}

//#endregion
export { projectInputIssues as i, analysisOperationInputErrorFromIssues as n, init_inputIssueProjection as r, analysisInputErrorFromIssues as t };