import { z } from "incur";
import { javaScriptRoutesDeliverySchema, webRoutesDeliverySchema, } from "../domain/analysisView/javascriptRoutesView.js";
import { analysisEvidenceDeliveryOptions, parseCliAnalysisEvidenceDelivery, } from "./analysisEvidenceDelivery.js";
export const javascriptRouteDeliveryOptions = {
    ...analysisEvidenceDeliveryOptions,
    view: z
        .string()
        .optional()
        .describe("JSON javascript-routes view; requires --detail summary and --evidence_output"),
};
/** Validate delivery before opening artifacts or attaching a browser. */
export const parseJavaScriptRouteDelivery = (operation, options) => {
    const schema = operation === "analyze_web_bundle"
        ? webRoutesDeliverySchema
        : javaScriptRoutesDeliverySchema;
    return parseCliAnalysisEvidenceDelivery(operation, options, schema);
};
