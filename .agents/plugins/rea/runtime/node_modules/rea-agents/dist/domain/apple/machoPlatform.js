/**
 * dyld derives legacy simulator platforms from the CPU type. tvOS uses
 * x86_64 only; iOS and watchOS also recognize i386. Explicit LC_BUILD_VERSION
 * platforms do not use this rule.
 */
export const legacyMachoPlatform = (platform, cpuType) => {
    if (platform === 3)
        return cpuType === 0x01000007 ? 8 : 3;
    if (cpuType === 7 || cpuType === 0x01000007) {
        if (platform === 2)
            return 7;
        if (platform === 4)
            return 9;
    }
    return platform;
};
