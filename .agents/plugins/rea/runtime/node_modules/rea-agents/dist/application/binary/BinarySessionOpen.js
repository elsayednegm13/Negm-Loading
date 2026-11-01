import { snapshotMatchesBinding, snapshotMatchesTarget, snapshotTarget, } from "../../domain/analysisSnapshot.js";
import { parseBinaryTarget } from "../BinaryTargetResolver.js";
import { EvidenceIntegrityError, AnalysisSnapshotMismatchError, } from "../../domain/evidenceErrors.js";
import { err } from "../../domain/result.js";
import { isProfilelessNativeDispatchSnapshot, profilelessNativeDispatchProfile, } from "./ProfilelessNativeWorkflowSnapshot.js";
import { SessionProviderRouter } from "./SessionProviderRouter.js";
/** Parse a target, resolve its provider route, and validate snapshot binding. */
export const resolveSessionOpen = async (input) => {
    const { path, options } = input;
    const parsed = await parseBinaryTarget(path, {
        resources: input.resources,
        ...(options.targetKind === undefined
            ? {}
            : { targetKind: options.targetKind }),
        ...(options.formatHint === undefined
            ? {}
            : { formatHint: options.formatHint }),
        ...(options.architecture === undefined
            ? {}
            : { architecture: options.architecture }),
        ...(options.entryPoint === undefined
            ? {}
            : { entryPoint: options.entryPoint }),
        ...(options.signal === undefined ? {} : { signal: options.signal }),
    });
    if (!parsed.ok)
        return parsed;
    return resolveSessionTarget({ ...input, target: parsed.value });
};
/** Resolve a known target's provider route and validate snapshot binding. */
export const resolveSessionTarget = async (input) => {
    const { router, current, target, options } = input;
    const sameTarget = sameSessionTarget(current?.target, target);
    const resolvedRoute = sameTarget && options.providerId === undefined && current !== undefined
        ? { ok: true, value: current.route }
        : await router.resolve(target, options.providerId, options.signal);
    if (!resolvedRoute.ok)
        return resolvedRoute;
    return validateResolvedSessionTarget({
        ...input,
        route: resolvedRoute.value,
    });
};
/** Revalidate a previewed route against the current session and snapshot binding. */
export const validateResolvedSessionTarget = (input) => {
    const { current, target, route, options, stagedSnapshotMatches } = input;
    const sameTarget = sameSessionTarget(current?.target, target);
    const snapshotError = validateSnapshot({
        snapshot: options.snapshot,
        target,
        profile: route.profile,
        profilelessWorkflowProfile: profilelessNativeDispatchProfile(route),
        current,
        stagedSnapshotMatches,
    });
    if (snapshotError !== undefined)
        return err(snapshotError);
    return { ok: true, value: { target, route, sameTarget } };
};
const sameSessionTarget = (current, target) => current !== undefined &&
    current.path === target.path &&
    // Native admission is bound to the requested path, not just its realpath.
    (current.sourcePath ?? current.path) === (target.sourcePath ?? target.path) &&
    snapshotMatchesTarget(snapshotTarget(current), target);
const validateSnapshot = ({ snapshot, target, profile, profilelessWorkflowProfile, current, stagedSnapshotMatches, }) => {
    if (snapshot !== undefined &&
        (profile === null
            ? profilelessWorkflowProfile === undefined ||
                !isProfilelessNativeDispatchSnapshot(snapshot, target, profilelessWorkflowProfile)
            : !snapshotMatchesBinding(snapshot, target, profile)))
        return new AnalysisSnapshotMismatchError("Analysis snapshot profile_mismatch: target, provider, or analysis profile does not match the requested binary");
    if (current === undefined &&
        !stagedSnapshotMatches(target, profile ?? profilelessWorkflowProfile ?? null))
        return new AnalysisSnapshotMismatchError("Analysis snapshot profile_mismatch: staged target, provider, or analysis profile does not match");
    return undefined;
};
