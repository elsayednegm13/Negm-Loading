import { absoluteCallerPath } from "../filesystem/callerPath.js";
export const RIZIN_PROVIDER_IDENTITY = {
    id: "rizin",
    name: "Rizin",
    version: null,
};
/** Default one-shot presentation to plain text while retaining plugin availability. */
export const rizinCommand = (input) => [
    "-N",
    "-q",
    "-e",
    "scr.color=0",
    "-c",
    input.command,
    absoluteCallerPath(input.path),
];
