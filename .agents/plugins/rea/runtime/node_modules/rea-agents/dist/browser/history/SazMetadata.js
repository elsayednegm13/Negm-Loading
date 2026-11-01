import { parseXmlDocument } from "../../domain/xmlDocument.js";
import { WEB_NETWORK_CAPTURE_LIMITS } from "../../domain/webNetworkCapture.js";
import { decodeXmlPlistText, XmlPlistTextDecodeError, } from "../../domain/propertyListXmlText.js";
import { CaptureFormatError } from "./CaptureFormatError.js";
/** Preserve XML node order, attribute names and text without interpreting producer-specific flags. */
export const decodeSazMetadata = (bytes) => {
    let xml;
    try {
        xml = decodeXmlPlistText(bytes);
    }
    catch (cause) {
        if (cause instanceof XmlPlistTextDecodeError &&
            cause.reason === "unsupported-encoding")
            throw new CaptureFormatError("unsupported", `SAZ metadata declares unsupported XML encoding ${cause.declaredEncoding}.`, "", cause);
        if (cause instanceof XmlPlistTextDecodeError &&
            cause.reason === "encoding-mismatch")
            throw new CaptureFormatError("format", "SAZ metadata encoding declaration disagrees with its bytes.", "", cause);
        throw new CaptureFormatError("unsupported", "SAZ metadata must use UTF-8 or BOM-marked UTF-16.", "", cause);
    }
    const parsed = parseXmlDocument(xml, {
        doctype: "reject",
        lineEndings: "preserve",
    });
    if (!parsed.ok)
        throw new CaptureFormatError(parsed.error.reason === "doctype" ? "unsupported" : "format", parsed.error.reason === "doctype"
            ? "SAZ metadata DTDs are unsupported."
            : "SAZ metadata is not well-formed XML.", "", parsed.error);
    const document = parsed.value;
    if (document.documentElement?.tagName !== "Session")
        throw new CaptureFormatError("format", "SAZ metadata must have a Session document element.");
    const visit = (node, depth) => {
        if (depth > WEB_NETWORK_CAPTURE_LIMITS.depth)
            throw new CaptureFormatError("input-limit", "SAZ metadata exceeds the complete-evidence nesting budget. This release has no runtime override.");
        const children = [];
        for (let child = node.firstChild; child !== null; child = child.nextSibling)
            children.push(visit(child, depth + 1));
        const attributes = [];
        if (node.nodeType === 1) {
            const element = node;
            for (let i = 0; i < element.attributes.length; i++) {
                const attribute = element.attributes.item(i);
                if (attribute !== null)
                    attributes.push({ name: attribute.name, value: attribute.value });
            }
        }
        return {
            name: node.nodeName,
            type: node.nodeType,
            value: node.nodeValue,
            attributes,
            children,
        };
    };
    return visit(document, 0);
};
