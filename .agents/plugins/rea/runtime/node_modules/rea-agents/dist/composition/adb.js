import { AdbProvider } from "../adb/AdbProvider.js";
/** Construct one ADB provider bound to the caller-selected binary. */
export const createAdbDeviceAnalysisProvider = (environment = process.env) => new AdbProvider({ environment });
