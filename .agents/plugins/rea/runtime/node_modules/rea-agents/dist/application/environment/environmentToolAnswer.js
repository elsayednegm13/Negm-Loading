import { replayEnvironmentTool, } from "./environmentReplay.js";
import { answerFromState } from "./environmentStateAnswer.js";
import { answerBulk } from "./environmentStateBulkAnswer.js";
import { answerWrite } from "./environmentStateWriteAnswer.js";
import { pinnedRequest } from "./environmentStateWriteQuery.js";
/** The answer a served environment gives: replay without a state store; with one, a served write applies to the live state and a read answers from it. */
export const environmentToolAnswer = (source, store) => store === undefined
    ? (tool, args, observedQuery) => replayEnvironmentTool(source, tool, args, observedQuery)
    : (tool, args, observedQuery) => {
        const plan = store.state.writes.get(tool.name);
        if (plan?.served !== true)
            return answerFromState({ source, store }, tool, args, observedQuery);
        const request = pinnedRequest({ source, store }, {
            tool,
            plan,
            args,
            ...(observedQuery === undefined ? {} : { observedQuery }),
        });
        if (!request.ok)
            return request;
        const bulk = plan.address !== undefined && plan.address.by !== "action";
        return (bulk ? answerBulk : answerWrite)({ source, store }, request.value);
    };
