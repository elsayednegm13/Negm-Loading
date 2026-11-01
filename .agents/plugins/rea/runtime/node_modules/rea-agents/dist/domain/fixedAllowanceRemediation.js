const unchangedRequest = "Repeating the unchanged request fails the same way.";
/** Name the fixed allowance and the recovery that cannot admit the same request. */
export const fixedAllowanceRemediation = (allowance, kind) => {
    switch (kind) {
        case "parser":
            return `${allowance} is a fixed allowance. Worker memory limits, inherited limits, and additional host memory do not raise it. Select another complete input within the allowance when that preserves the needed observation. ${unchangedRequest}`;
        case "count":
            return `${allowance} is a fixed count. Waiting for an active analysis to finish does not raise it. ${unchangedRequest}`;
        case "bytes":
            return `${allowance} is a fixed byte allowance. Waiting for an active analysis to finish does not raise it. ${unchangedRequest}`;
        case "report":
            return `${allowance} is a fixed report allowance. This refusal does not leave a completed report or Evidence record to retrieve, and complete CLI JSON does not raise it. ${unchangedRequest}`;
        case "input":
            return `Select a suitable complete artifact within ${allowance}. Increasing an evidence-reply file-size allowance does not admit this input. Do not truncate required bytes. ${unchangedRequest}`;
        case "capture":
            return `${allowance} is a fixed capture allowance. Worker memory limits, inherited limits, and additional host memory do not raise it. ${unchangedRequest}`;
        case "live":
            return `${allowance} is a fixed capture allowance. Worker memory limits, inherited limits, and additional host memory do not raise it. Capturing the same output exceeds the allowance again; live output may change between requests.`;
        case "work":
            return `${allowance} is a fixed work allowance. Worker CPU limits and additional CPU time do not raise it. Select another complete artifact within the allowance. ${unchangedRequest}`;
    }
};
/** Non-retryable options for a fixed allowance. Occupied capacity stays retryable. */
export const fixedAllowanceOptions = (allowance, kind) => ({
    retryable: false,
    fixedAllowance: { name: allowance, kind },
});
/**
 * Name a fixed producer input allowance in bytes. Host and inherited limits
 * do not raise it, and this release has no runtime override.
 */
export const fixedProducerInputAllowance = (bytes, allowance) => fixedAllowanceOptions(`${allowance} of ${String(bytes)} bytes (this release has no runtime override)`, "input");
