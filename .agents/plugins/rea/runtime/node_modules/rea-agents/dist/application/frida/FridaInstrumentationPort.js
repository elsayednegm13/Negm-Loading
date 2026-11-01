import { AnalysisCancelledError } from "../../domain/analysisErrorCore.js";
export class FridaScriptLoadCancelledError extends AnalysisCancelledError {
    script;
    scriptHandleAcquired;
    constructor(script, options) {
        super("load_frida_script", options);
        this.script = script;
        this.scriptHandleAcquired = options?.scriptHandleAcquired ?? true;
    }
}
