import { runtimeAsarHeaderAdmission } from "../config/runtimeAnalysisSettings.js";
import { CdpElectronProvider } from "../browser/CdpElectronProvider.js";
/** Construct a fresh provider without opening a target or acquiring an engine. */
export const createElectronObservationProvider = (environment, settings) => new CdpElectronProvider(runtimeAsarHeaderAdmission(environment, settings));
