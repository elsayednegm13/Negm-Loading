/** Most unrecognized output lines a parser retains as source evidence. */
export const UNPARSED_LINE_SAMPLE_LIMIT = 10;
/** Accumulate unrecognized lines without retaining more than the sample. */
export const collectUnparsedLines = () => {
    const sample = [];
    let total = 0;
    return {
        add: (line) => {
            total += 1;
            if (sample.length < UNPARSED_LINE_SAMPLE_LIMIT)
                sample.push(line);
        },
        facts: () => ({ sample, total }),
    };
};
