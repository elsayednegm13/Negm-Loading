import { snapshotEnvironment } from "../process/snapshotEnvironment.js";
/** Capture the selected provider environment at server construction time. */
export const captureProviderEnvironment = (providerEnvironment, serverEnvironment) => snapshotEnvironment(providerEnvironment ?? serverEnvironment);
