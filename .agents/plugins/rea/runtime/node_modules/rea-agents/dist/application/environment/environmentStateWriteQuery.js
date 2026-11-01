import { pinnedQuery } from "../../domain/analysisView/environmentStateWriteStamps.js";
import { err, ok } from "../../domain/result.js";
import { refused } from "./environmentStateAnswer.js";
import { callQuery } from "./environmentStateCallLines.js";
import { environmentToolArguments, hasRepeatedQueryArgument, } from "./environmentTools.js";
/** A served write call with the query its recording pins: a parameter it leaves out takes the recorded value; another value or parameter, or a repeated one, is refused. */
export const pinnedRequest = (serving, request) => {
    const { tool, plan, args } = request;
    if (hasRepeatedQueryArgument(tool, args))
        return err(refused(tool, "The state write model cannot apply repeated query parameters; the state is unchanged."));
    const query = pinnedQuery(serving.source.exchanges.get(plan.exemplar_ordinal ?? -1)?.query, callQuery(tool, args));
    if (!query.ok)
        return err(refused(tool, `Tool ${tool.name} ${query.error}`));
    const names = environmentToolArguments(tool).query;
    const filled = { ...args };
    for (const [name, value] of query.value)
        filled[names.get(name) ?? name] ??= value;
    return ok({ ...request, args: filled });
};
