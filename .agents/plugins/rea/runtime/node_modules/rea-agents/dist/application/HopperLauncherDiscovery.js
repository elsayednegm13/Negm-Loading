import { linuxHopperLauncherCandidates, REA_MANAGED_LINUX_HOPPER_LAUNCHER, } from "./LinuxHopper.js";
import { MAC_HOPPER_SYSTEM_LAUNCHER, macHopperCanonicalLauncherCandidates, } from "./MacHopperPaths.js";
/** Select the automatic Hopper launcher candidates for one platform. */
export const hopperLauncherDiscovery = (platform, homeDirectory) => {
    if (platform === "darwin")
        return {
            candidates: macHopperCanonicalLauncherCandidates(homeDirectory),
            probesMacApplicationBundles: true,
            fallback: MAC_HOPPER_SYSTEM_LAUNCHER,
        };
    if (platform === "linux")
        return {
            candidates: linuxHopperLauncherCandidates(homeDirectory),
            probesMacApplicationBundles: false,
            fallback: REA_MANAGED_LINUX_HOPPER_LAUNCHER,
        };
    return {
        candidates: [],
        probesMacApplicationBundles: false,
        fallback: MAC_HOPPER_SYSTEM_LAUNCHER,
    };
};
