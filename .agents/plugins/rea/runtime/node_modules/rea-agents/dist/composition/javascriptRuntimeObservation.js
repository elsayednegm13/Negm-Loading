import { runtimeAsarHeaderAdmission } from "../config/runtimeAnalysisSettings.js";
import { V8InspectorProvider } from "../inspector/V8InspectorProvider.js";
/** Construct a fresh provider without opening a target or acquiring an engine. */
export const createJavaScriptRuntimeObservationProvider = (environment, settings) => new V8InspectorProvider(runtimeAsarHeaderAdmission(environment, settings));
