import { NATIVE_TOOL_CONTRACTS } from "../contracts/native/nativeToolContracts.js";
import { registerEvidenceTools } from "./registerEvidenceTools.js";
import { retainedSummaryDelivery, withoutDeliveryDetail, } from "./retainedSummaryDelivery.js";
const SUMMARY_DELIVERY = new Set(["inspect_macho"]);
/** Register macOS native contracts; Mach-O inspection can deliver a retained summary. */
export const registerNativeTools = (server, options) => {
    const withoutDelivery = withoutDeliveryDetail(SUMMARY_DELIVERY);
    registerEvidenceTools(server, NATIVE_TOOL_CONTRACTS, {
        ...options,
        ...retainedSummaryDelivery(SUMMARY_DELIVERY, options),
        parametersForExecution: withoutDelivery,
        parametersForEvidence: withoutDelivery,
    });
};
