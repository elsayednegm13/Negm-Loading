const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
/** A list counter's member names: a top-level member's name not starting with `/`, else a pointer (`/pageInfo/totalRows`, `/~1total`). */
export const counterPath = (counter) => counter.startsWith("/")
    ? counter
        .slice(1)
        .split("/")
        .map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"))
    : [counter];
/** A list counter's recorded value, or undefined when the body lacks it. */
export const counterAt = (body, counter) => counterPath(counter).reduce((value, name) => isObject(value) && Object.hasOwn(value, name) ? value[name] : undefined, body);
/** The body with a counter it holds set to `value`. */
export const withCounter = (body, counter, value) => {
    const set = (node, path) => {
        const [name, ...rest] = path;
        if (name === undefined)
            return value;
        if (!isObject(node) || !Object.hasOwn(node, name))
            return node;
        return { ...node, [name]: set(node[name], rest) };
    };
    return set(body, counterPath(counter));
};
