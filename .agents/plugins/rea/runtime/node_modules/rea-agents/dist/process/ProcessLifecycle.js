export const PROCESS_CLEANUP_VERIFICATION_GRACE_MS = 1_000;
export const PROCESS_CLEANUP_VERIFICATION_INTERVAL_MS = 25;
export const processIdentityHasExited = (identity) => identity?.state === "absent" ||
    (identity?.state === "readable" &&
        identity.lifecycle?.state === "observed" &&
        (identity.lifecycle.lifecycle === "zombie" ||
            identity.lifecycle.lifecycle === "dead"));
export const processIdentityIsExiting = (identity) => identity?.state === "readable" &&
    identity.lifecycle?.state === "observed" &&
    identity.lifecycle.lifecycle === "exiting";
