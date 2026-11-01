export const symbolicUnknown = (reason) => ({
    kind: "unknown",
    reason,
});
export const symbolicVariants = (value) => value.kind === "union" ? value.values : [value];
export const symbolicUnion = (values) => {
    const unique = [...new Set(values.flatMap(symbolicVariants))];
    return unique.length === 1 ? unique[0] : { kind: "union", values: unique };
};
export const symbolicTruth = (value) => {
    if (value.kind === "namespace" && value.runtimeValueUnknown)
        return undefined;
    if (value.kind === "union") {
        const choices = value.values.map(symbolicTruth);
        return choices.length > 0 &&
            choices.every((choice) => choice === choices[0])
            ? choices[0]
            : undefined;
    }
    return value.kind === "literal"
        ? Boolean(value.value)
        : [
            "function",
            "object",
            "namespace",
            "array",
            "record",
            "loader",
            "promise",
            "iterator",
        ].includes(value.kind)
            ? true
            : undefined;
};
/** Attach selection predicates to values while preserving their representation. */
export const symbolicCondition = (value, condition) => {
    if (value.kind === "union")
        return symbolicUnion(value.values.map((variant) => symbolicCondition(variant, condition)));
    return { ...value, conditions: [...(value.conditions ?? []), condition] };
};
export const symbolicConditionsUnresolved = (value) => {
    if (value.kind === "union")
        return symbolicUnion(value.values.map(symbolicConditionsUnresolved));
    return { ...value, conditionUnresolved: true };
};
