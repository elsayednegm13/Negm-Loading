import { addElectronIpcBoundaries } from "./ElectronBoundaryGraphIpc.js";
import { addElectronNativeBoundaries } from "./ElectronBoundaryGraphNative.js";
import { addElectronWindowBoundaries } from "./ElectronBoundaryGraphWindows.js";
import { addElectronCallPaths } from "./ElectronBoundaryGraphCallPaths.js";
/** Add every static Electron process and security-boundary fact to the JAG. */
export const addElectronBoundaries = (context) => {
    addElectronWindowBoundaries(context);
    addElectronIpcBoundaries(context);
    addElectronNativeBoundaries(context);
    addElectronCallPaths(context);
};
