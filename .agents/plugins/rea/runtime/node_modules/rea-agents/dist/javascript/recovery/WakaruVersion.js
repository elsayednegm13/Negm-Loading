import { satisfies, valid } from "semver";
import { WAKARU_ACCEPTED_RANGE, WAKARU_RELEASE } from "./WakaruRelease.js";
/** Caller-facing accepted releases, naming the verified build. */
export const wakaruReleaseLine = () => `Wakaru ${WAKARU_ACCEPTED_RANGE} (verified with ${WAKARU_RELEASE.version})`;
/** Classify a `wakaru <version>` banner against the accepted release range. */
export const admitWakaruVersion = (banner) => {
    const token = banner.startsWith("wakaru ")
        ? banner.slice("wakaru ".length)
        : undefined;
    if (token === undefined ||
        valid(token) !== token ||
        !satisfies(token, WAKARU_ACCEPTED_RANGE))
        return {
            status: "unsupported",
            message: `Unsupported Wakaru version ${banner.length === 0 ? "missing" : banner}; accepted releases are ${wakaruReleaseLine()}`,
        };
    if (token === WAKARU_RELEASE.version)
        return { status: "verified", version: token };
    return {
        status: "compatible",
        version: token,
        limitation: `This session uses Wakaru ${token}. The report parser is verified against ${WAKARU_RELEASE.version}; other ${WAKARU_ACCEPTED_RANGE} releases are accepted and the observed version is reported.`,
    };
};
