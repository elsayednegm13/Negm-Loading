import * as t from "@babel/types";
import { semanticComputedMethodKey } from "./javascriptSemanticEvaluationOrder.js";
import { semanticCallableIdForNode } from "./javascriptSemanticProjection.js";
/**
 * Track callables admitted by `admit`, which maps a callable ID to the value
 * kept on the stack or `undefined` to ignore it. A caller-owned `callables`
 * array is updated in place, so shared contexts can keep reading it.
 */
export const createSemanticCallableStack = (admit, callables = []) => {
    const frames = [];
    const suspendedMethods = new Map();
    callables.length = 0;
    const push = (frame) => {
        frames.push(frame);
        callables.push(frame.callable);
    };
    const pop = () => {
        callables.pop();
        return frames.pop();
    };
    return {
        callables,
        enter: (node, parent) => {
            if (parent !== null &&
                semanticComputedMethodKey(parent, node) &&
                frames.at(-1)?.callableId === semanticCallableIdForNode(parent)) {
                const method = pop();
                if (method !== undefined)
                    suspendedMethods.set(node, method);
            }
            const callableId = semanticCallableIdForNode(node);
            if (callableId === null)
                return;
            const callable = admit(callableId);
            if (callable !== undefined)
                push({ callableId, callable });
        },
        exit: (node) => {
            const callableId = semanticCallableIdForNode(node);
            if (callableId !== null && frames.at(-1)?.callableId === callableId)
                pop();
            const method = suspendedMethods.get(node);
            if (method !== undefined) {
                suspendedMethods.delete(node);
                push(method);
            }
        },
    };
};
/** Track admitted callable IDs, keeping each ID as its stack value. */
export const createSemanticCallableIdStack = (admitted, callables = []) => createSemanticCallableStack((callableId) => (admitted.has(callableId) ? callableId : undefined), callables);
