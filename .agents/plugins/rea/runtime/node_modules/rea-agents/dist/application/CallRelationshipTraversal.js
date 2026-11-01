/** The provider read and response relation for each supported traversal direction. */
export const CALL_RELATIONSHIP_TRAVERSALS = {
    forward: { operation: "procedure_callees", relation: "callees" },
    backward: { operation: "procedure_callers", relation: "callers" },
};
