import { ApktoolProvider } from "../apktool/ApktoolProvider.js";
/** Construct one Apktool provider bound to the caller-selected launcher. */
export const createApktoolResourceAnalysisProvider = (environment = process.env) => new ApktoolProvider({ environment });
