import { FIRMWARE_TOOL_REQUIREMENTS, } from "../contracts/firmware/firmwareToolRequirements.js";
const TOKEN = /^(\d+)\.(\d+)\.(\d+)([-+][0-9A-Za-z.-]+)?$/u;
const parseToken = (token) => {
    const match = TOKEN.exec(token);
    if (match === null)
        return undefined;
    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]);
    if (![major, minor, patch].every((part) => Number.isSafeInteger(part)))
        return undefined;
    return { major, minor, token };
};
/**
 * Classify a `--version` banner against the audited release line.
 * Binwalk prints `binwalk <version>`; Unblob prints the version alone.
 */
export const admitFirmwareVersion = (engine, banner) => {
    const token = versionToken(engine, banner);
    const parsed = token === undefined ? undefined : parseToken(token);
    const verified = FIRMWARE_TOOL_REQUIREMENTS[engine];
    const accepted = `accepted releases are ${verified.requirement}`;
    if (parsed === undefined)
        return {
            status: "unresolved",
            message: `Unsupported tool version ${banner.length === 0 ? "missing" : banner}; ${accepted}.`,
        };
    if (parsed.major !== verified.major || parsed.minor !== verified.minor)
        return {
            status: "unsupported",
            message: `Unsupported tool version ${banner}; ${accepted}.`,
        };
    if (parsed.token === verified.version)
        return { status: "verified", version: parsed.token };
    return {
        status: "compatible",
        version: parsed.token,
        limitation: `This session uses ${verified.name} ${parsed.token}. The report parser is verified against ${verified.version}; other ${verified.line} builds are accepted and the observed version is reported.`,
    };
};
const versionToken = (engine, banner) => {
    switch (engine) {
        case "binwalk":
            return banner.startsWith("binwalk ")
                ? banner.slice("binwalk ".length)
                : undefined;
        case "unblob":
            return banner;
        default: {
            const unreachable = engine;
            return unreachable;
        }
    }
};
