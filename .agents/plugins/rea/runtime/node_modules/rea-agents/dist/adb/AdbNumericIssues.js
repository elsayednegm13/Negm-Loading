import { UNPARSED_LINE_SAMPLE_LIMIT } from "./AdbUnparsedLines.js";
/** Retain the first diagnostic facts and exact count without copying command output. */
export const collectNumericIssues = () => {
    const sample = [];
    let total = 0;
    return {
        add: (issue) => {
            total += 1;
            if (sample.length < UNPARSED_LINE_SAMPLE_LIMIT)
                sample.push(issue);
        },
        append: (issues) => {
            total += issues.total;
            for (const issue of issues.sample) {
                if (sample.length === UNPARSED_LINE_SAMPLE_LIMIT)
                    break;
                sample.push(issue);
            }
        },
        facts: () => ({ sample, total }),
    };
};
