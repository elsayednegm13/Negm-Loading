import { decodedSegment, segmentsOf, } from "../../domain/analysisView/environmentStateRules.js";
import { bulkCollectionOf } from "../../domain/analysisView/environmentStateWriteAddress.js";
import { isPagingParameter } from "../../domain/analysisView/environmentStatePaging.js";
import { segmentRule } from "../../domain/analysisView/webNetworkRouteTemplates.js";
import { environmentToolArguments, } from "./environmentTools.js";
const FORMAT_RULES = new Set([
    "numeric",
    "uuid",
    "hex",
    "iso-date",
]);
/**
 * A tool's path segments up to `end`. A parameter stays `{}` unless `segments` gives the live value at that position,
 * decoded once and encoded again, so two parents of one template do not share a child collection, spellings replay
 * treats as equal name one, and a decoded slash stays inside its segment. An empty parent stays `{}`. A second
 * encoding stays distinct: decoding again would join it with the value.
 */
const collectionAt = (tool, end, segments) => {
    const params = new Set(tool.params.map((param) => param.index));
    return `/${tool.path_template
        .slice(1)
        .split("/")
        .slice(0, end)
        .map((segment, index) => {
        if (!params.has(index))
            return segment;
        const value = segments?.[index];
        return value === undefined || value === ""
            ? "{}"
            : encodeURIComponent(decodedSegment(value));
    })
        .join("/")}`;
};
/** The collection a call of the tool names: its path, less the trailing parameter of an item route. */
export const collectionScope = (tool, segments) => {
    const length = tool.path_template.slice(1).split("/").length;
    return collectionAt(tool, tool.params.some((param) => param.index === length - 1)
        ? length - 1
        : length, segments);
};
/** How a served bulk write's body names its entities, and the collection they belong to: the path up to its type's, spelled as the type ends, as reads of the type scope them. */
export const bulkIds = (run, call, segments) => {
    const plan = run.store?.state.writes.get(call.tool.name);
    const target = plan?.target ?? null;
    const address = plan?.address;
    const body = probeArguments(call.tool, run.bodies).body;
    if (target === null ||
        address === undefined ||
        address.by === "action" ||
        body === undefined)
        return undefined;
    const scope = collectionAt(call.tool, segmentsOf(target).length, segments);
    return {
        body,
        address,
        idField: run.store?.type(target)?.id_field ?? "",
        scope: `/${bulkCollectionOf(target, scope.slice(1).split("/"), (text) => text).join("/")}`,
    };
};
/** The collection each path parameter names an entity of: the path before it, by the parameter's position. */
export const parameterScopes = (tool, segments) => new Map(tool.params.map((param) => [
    param.index,
    collectionAt(tool, param.index, segments),
]));
/** Template positions that are literals, so a mapped id is not written over the route. */
export const literalPositions = (tool) => {
    const params = new Set(tool.params.map((param) => param.index));
    return new Set(tool.path_template
        .slice(1)
        .split("/")
        .flatMap((_, index) => (params.has(index) ? [] : [index])));
};
/** How a path fits a tool's template: the literal segments it matches, or undefined when it does not fit. */
const fitOf = (tool, segments) => {
    const template = tool.path_template.slice(1).split("/");
    if (template.length !== segments.length)
        return undefined;
    const params = new Map(tool.params.map((param) => [param.index, param]));
    let literals = 0;
    for (const [index, part] of template.entries()) {
        const segment = segments[index];
        const param = params.get(index);
        if (param === undefined) {
            if (part !== segment && part !== decodedSegment(segment))
                return undefined;
            literals += 1;
        }
        else if (
        // Replay matches a path value decoded, so its format is the decoded value's.
        FORMAT_RULES.has(param.rule) &&
            segmentRule(decodedSegment(segment)) !== param.rule)
            return undefined;
        else if (segment === "")
            return undefined;
    }
    return { tool, literals };
};
/** A tool's arguments as the served catalog offers them: a body too when `bodies` names it. */
export const probeArguments = (tool, bodies) => environmentToolArguments(tool, bodies.has(tool.name) ? true : undefined);
/** The served tools whose catalog takes a body, by name, as a bulk delete names its entities in one. */
export const bodyTools = (definitions) => new Set(definitions.flatMap((definition) => Object.hasOwn(definition.inputSchema.properties, environmentToolArguments(definition.tool, true).body)
    ? [definition.name]
    : []));
/** The tool of the request's method whose template fits the path with the most literal segments; the manifest's order breaks ties. `bodies` names the tools a served catalog gives a body beyond their method's. */
export const matchProbeRequest = (manifest, request, bodies = new Set()) => {
    const segments = request.path.slice(1).split("/");
    let best;
    for (const tool of manifest.tools) {
        if (tool.method !== request.method)
            continue;
        const fit = fitOf(tool, segments);
        if (fit !== undefined &&
            (best === undefined || fit.literals > best.literals))
            best = fit;
    }
    if (best === undefined)
        return undefined;
    const { tool } = best;
    const names = probeArguments(tool, bodies);
    const args = {};
    const pathArguments = [];
    for (const param of tool.params) {
        const name = names.path.get(param.name) ?? param.name;
        // The environment decodes a path id once. Passing the raw segment keeps `book%2531` from becoming `book1`.
        args[name] = segments[param.index];
        pathArguments.push(name);
    }
    const ignoredQuery = [];
    const pagingArguments = [];
    const queryValues = new Map();
    if (request.query !== null)
        for (const [key, value] of new URLSearchParams(request.query.slice(1))) {
            const name = names.query.get(key);
            if (name === undefined)
                ignoredQuery.push(key);
            else {
                const values = queryValues.get(name) ?? [];
                values.push(value);
                queryValues.set(name, values);
                if (isPagingParameter(key))
                    pagingArguments.push(name);
            }
        }
    for (const [name, values] of queryValues)
        args[name] = values.length === 1 ? values[0] : values;
    if (names.body !== undefined && request.body !== undefined)
        args[names.body] = request.body;
    return {
        tool,
        args,
        pathArguments,
        pagingArguments,
        ignoredQuery,
        observedQuery: request.query,
    };
};
