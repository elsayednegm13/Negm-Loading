import { analyzeCapturedWebScript } from "../domain/webBundleAnalyzer.js";
import { serveWebBundleAnalysisWorker, } from "../browser/WebBundleAnalysisWorkerServer.js";
const analyze = (script) => analyzeCapturedWebScript(script);
try {
    await serveWebBundleAnalysisWorker(analyze);
}
catch (cause) {
    process.stderr.write(`${cause instanceof Error ? cause.message : String(cause)}\n`);
    process.exitCode = 1;
}
