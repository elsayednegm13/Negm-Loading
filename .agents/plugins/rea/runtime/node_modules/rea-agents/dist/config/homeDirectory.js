import { userInfo } from "node:os";
const firstNonempty = (...values) => values.find((value) => value !== undefined && value.length > 0);
/** Resolve the caller's selected home before consulting the host account. */
export const homeDirectoryFromEnvironment = (environment, platform) => {
    const windowsDriveHome = environment.HOMEDRIVE !== undefined &&
        environment.HOMEDRIVE.length > 0 &&
        environment.HOMEPATH !== undefined &&
        environment.HOMEPATH.length > 0
        ? `${environment.HOMEDRIVE}${environment.HOMEPATH}`
        : undefined;
    const selected = platform === "win32"
        ? firstNonempty(environment.USERPROFILE, windowsDriveHome, environment.HOME)
        : firstNonempty(environment.HOME, environment.USERPROFILE);
    return selected ?? userInfo().homedir;
};
