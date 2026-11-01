import { apkSignatureModule } from "../composition/apkSignature.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind the named APK-signature contract to shared validation and session Evidence. */
export const registerApkSignatureTools = (server, service, logger, recordEvidence, withAdmittedAnalysis, evidenceById) => {
    const contract = apkSignatureModule.contract;
    const handler = createEvidenceToolHandler(server, (input, options) => service.inspect(input, options, { recordEvidence, evidenceById }), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, toolRegistrationOptions(contract), handler(contract));
};
